"""
M2 — Chat router: streams Ollama responses as Server-Sent Events with unified tool registry routing.
Endpoint: POST /api/chat  →  text/event-stream
"""
from __future__ import annotations
import json
import time
import logging

import httpx
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from config import OLLAMA_BASE_URL, OLLAMA_MODEL, OLLAMA_TIMEOUT, SYSTEM_PROMPT
from utils.activity import log_activity
from integrations.tool_registry import route_user_request

log = logging.getLogger(__name__)
router = APIRouter()


class Message(BaseModel):
    role: str   # "user" | "assistant" | "system"
    content: str


class ChatRequest(BaseModel):
    messages: list[Message] = Field(..., min_length=1)
    model: str = OLLAMA_MODEL
    stream: bool = True


async def _stream_ollama(payload: dict):
    """Stream from Ollama, yielding SSE lines."""
    url = f"{OLLAMA_BASE_URL}/api/chat"
    async with httpx.AsyncClient(timeout=OLLAMA_TIMEOUT) as client:
        async with client.stream("POST", url, json=payload) as resp:
            if resp.status_code != 200:
                body = await resp.aread()
                yield f"data: {json.dumps({'error': f'Ollama {resp.status_code}: {body.decode()[:200]}'})}\n\n"
                return
            async for line in resp.aiter_lines():
                if not line.strip():
                    continue
                try:
                    chunk = json.loads(line)
                except json.JSONDecodeError:
                    continue
                token = chunk.get("message", {}).get("content", "")
                yield f"data: {json.dumps({'token': token})}\n\n"
                if chunk.get("done"):
                    yield f"data: {json.dumps({'done': True})}\n\n"
                    return


async def _stream_generator(payload: dict, tool_result_override: dict | None = None):
    """Collect tokens and log after completion."""
    char_count = 0

    if tool_result_override:
        # If there is a missing integration or direct tool execution
        if tool_result_override.get("type") == "missing_integration":
            yield f"data: {json.dumps({'missing_integration': tool_result_override})}\n\n"
            msg = (
                f"\n\n**{tool_result_override['service_name']} is not connected yet.**\n\n"
                f"{tool_result_override['message']}\n\n"
                f"**Required Connection Type:** {tool_result_override['connection_type']}\n"
                f"**Prerequisites:** {tool_result_override['required_credentials']}\n"
            )
            for chunk in msg.split(" "):
                yield f"data: {json.dumps({'token': chunk + ' '})}\n\n"
            yield f"data: {json.dumps({'done': True})}\n\n"
            await log_activity("chat", f"Missing integration guidance: {tool_result_override['service_name']}")
            return

        elif tool_result_override.get("type") == "tool_result":
            yield f"data: {json.dumps({'tool_call': tool_result_override})}\n\n"
            action = tool_result_override.get("action", "Tool Execution")
            res_data = tool_result_override.get("result", {})
            
            # Formulate clear response
            summary_lines = [f"### [Action Completed] {action}\n"]
            if res_data.get("success"):
                if "result" in res_data:
                    summary_lines.append(f"**Result:** `{res_data['result']}`\n")
                elif "repositories" in res_data:
                    summary_lines.append(f"Found **{len(res_data['repositories'])}** repositories:\n")
                    for r in res_data["repositories"][:5]:
                        summary_lines.append(f"- **[{r['name']}]({r['url']})**: {r['description'] or 'No description'}")
                elif "results" in res_data:
                    summary_lines.append(f"Top search results for your query:\n")
                    for r in res_data["results"][:3]:
                        summary_lines.append(f"- **[{r['title']}]({r['url']})**: {r['snippet']}")
                elif "content" in res_data:
                    summary_lines.append(f"```text\n{res_data['content']}\n```")
                elif res_data.get("launched"):
                    summary_lines.append(f"Successfully launched application **{res_data.get('app_id', '').capitalize()}** (PID: {res_data.get('pid')}).")
            else:
                summary_lines.append(f"**Error during execution:** {res_data.get('error', 'Unknown failure')}")

            full_text = "\n".join(summary_lines)
            for word in full_text.split(" "):
                yield f"data: {json.dumps({'token': word + ' '})}\n\n"
            yield f"data: {json.dumps({'done': True})}\n\n"
            await log_activity("chat", f"Executed tool action: {action}")
            return

    # Normal Ollama stream
    async for sse_line in _stream_ollama(payload):
        yield sse_line
        if sse_line.startswith("data:"):
            try:
                d = json.loads(sse_line[5:].strip())
                char_count += len(d.get("token", ""))
            except Exception:
                pass
    await log_activity("chat", "AI response complete", {"chars": char_count})


@router.post("/chat")
async def chat(req: ChatRequest):
    """
    Stream chat with local Ollama model or execute registered tools.
    Returns text/event-stream with 'data: {"token": "..."}' events.
    Final event: 'data: {"done": true}'.
    """
    last_user_msg = ""
    for m in reversed(req.messages):
        if m.role == "user":
            last_user_msg = m.content
            break

    # Check unified tool registry for action intent
    tool_override = await route_user_request(last_user_msg) if last_user_msg else None

    # Build messages with system prompt prepended
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    messages += [{"role": m.role, "content": m.content} for m in req.messages]

    payload = {
        "model": req.model,
        "messages": messages,
        "stream": True,
        "options": {
            "temperature": 0.7,
            "num_predict": 2048,
        },
    }

    await log_activity("chat", "Chat request sent", {"model": req.model, "messages": len(req.messages)})

    return StreamingResponse(
        _stream_generator(payload, tool_result_override=tool_override),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


@router.get("/chat/status")
async def chat_status():
    """Check if Ollama is reachable and the model is available."""
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            r = await client.get(f"{OLLAMA_BASE_URL}/api/tags")
            if r.status_code != 200:
                return {"connected": False, "error": f"Ollama returned {r.status_code}"}
            tags = r.json()
            models = [m["name"] for m in tags.get("models", [])]
            model_present = any(OLLAMA_MODEL in m for m in models)
            return {
                "connected": True,
                "ollama_url": OLLAMA_BASE_URL,
                "model": OLLAMA_MODEL,
                "model_present": model_present,
                "available_models": models,
            }
    except Exception as e:
        return {"connected": False, "error": str(e)}
