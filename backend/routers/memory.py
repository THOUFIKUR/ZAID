"""
M8 — Memory router: local JSON key-value store.
Endpoints:
  GET    /api/memory            — list all memories
  POST   /api/memory            — add a memory
  PUT    /api/memory/{id}       — update a memory
  DELETE /api/memory/{id}       — delete a memory
  DELETE /api/memory            — clear all memories
"""
from __future__ import annotations
import json, uuid, time, logging, asyncio
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from config import MEMORY_FILE
from utils.activity import log_activity

log = logging.getLogger(__name__)
router = APIRouter()

_lock = asyncio.Lock()


def _load() -> list[dict]:
    if MEMORY_FILE.exists():
        try:
            return json.loads(MEMORY_FILE.read_text(encoding="utf-8"))
        except Exception:
            return []
    return []


def _save(data: list[dict]) -> None:
    MEMORY_FILE.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")


class MemoryCreate(BaseModel):
    content: str
    category: Optional[str] = "general"   # e.g. "preference", "fact", "task"
    tags: Optional[list[str]] = []


class MemoryUpdate(BaseModel):
    content: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[list[str]] = None


@router.get("/memory")
async def list_memories(category: Optional[str] = None):
    async with _lock:
        memories = _load()
    if category:
        memories = [m for m in memories if m.get("category") == category]
    return {"memories": memories, "total": len(memories)}


@router.post("/memory", status_code=201)
async def add_memory(body: MemoryCreate):
    async with _lock:
        memories = _load()
        entry = {
            "id": str(uuid.uuid4()),
            "content": body.content,
            "category": body.category or "general",
            "tags": body.tags or [],
            "created_at": time.time(),
            "updated_at": time.time(),
        }
        memories.append(entry)
        _save(memories)

    await log_activity("memory", "Memory added", {"id": entry["id"], "category": entry["category"]})
    return entry


@router.put("/memory/{memory_id}")
async def update_memory(memory_id: str, body: MemoryUpdate):
    async with _lock:
        memories = _load()
        for m in memories:
            if m["id"] == memory_id:
                if body.content is not None:
                    m["content"] = body.content
                if body.category is not None:
                    m["category"] = body.category
                if body.tags is not None:
                    m["tags"] = body.tags
                m["updated_at"] = time.time()
                _save(memories)
                await log_activity("memory", "Memory updated", {"id": memory_id})
                return m
    raise HTTPException(404, f"Memory '{memory_id}' not found")


@router.delete("/memory/{memory_id}", status_code=204)
async def delete_memory(memory_id: str):
    async with _lock:
        memories = _load()
        before = len(memories)
        memories = [m for m in memories if m["id"] != memory_id]
        if len(memories) == before:
            raise HTTPException(404, f"Memory '{memory_id}' not found")
        _save(memories)
    await log_activity("memory", "Memory deleted", {"id": memory_id})


@router.delete("/memory", status_code=204)
async def clear_all_memories():
    async with _lock:
        count = len(_load())
        _save([])
    await log_activity("memory", "All memories cleared", {"count": count})
