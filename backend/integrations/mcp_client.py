"""
ZAID Backend MCP Client
Handles communication with Model Context Protocol (MCP) servers via stdio and SSE transports.
Built on the official `mcp` SDK (v2.x).
"""
from __future__ import annotations
import asyncio
import os
import sys
import logging
from typing import Any, Optional
from pydantic import BaseModel, Field

from mcp.client.session import ClientSession
from mcp.client.stdio import stdio_client, StdioServerParameters
from mcp.client.sse import sse_client

log = logging.getLogger("zaid.mcp")


class McpServerConfig(BaseModel):
    id: str
    name: str
    transport: str = Field(..., description="'stdio' or 'sse'")
    command: Optional[str] = None
    args: list[str] = Field(default_factory=list)
    env: dict[str, str] = Field(default_factory=dict)
    cwd: Optional[str] = None
    url: Optional[str] = None
    headers: dict[str, str] = Field(default_factory=dict)
    timeout_seconds: float = 12.0


class DiscoveredTool(BaseModel):
    name: str
    description: Optional[str] = ""
    input_schema: dict[str, Any] = Field(default_factory=dict)
    enabled: bool = True


class McpConnectionResult(BaseModel):
    success: bool
    server_name: Optional[str] = None
    server_version: Optional[str] = None
    tools: list[DiscoveredTool] = Field(default_factory=list)
    error: Optional[str] = None
    latency_ms: Optional[float] = None


async def test_mcp_connection(config: McpServerConfig) -> McpConnectionResult:
    """
    Test connection to an MCP server, negotiate capabilities, and discover tools.
    Times out after config.timeout_seconds.
    """
    import time
    start = time.perf_counter()

    try:
        if config.transport == "stdio":
            if not config.command:
                return McpConnectionResult(
                    success=False,
                    error="Stdio transport requires an executable command."
                )

            # Build environment: merge current os.environ with configured env
            full_env = dict(os.environ)
            full_env.update(config.env)

            # Resolve python if set to python / python.exe
            cmd = config.command
            if cmd in ("python", "python3", "python.exe") and sys.executable:
                cmd = sys.executable

            params = StdioServerParameters(
                command=cmd,
                args=config.args,
                env=full_env,
                cwd=config.cwd or None,
            )

            async def _run_stdio():
                async with stdio_client(params) as (read_stream, write_stream):
                    async with ClientSession(read_stream, write_stream) as session:
                        init_res = await session.initialize()
                        tools_res = await session.list_tools()
                        server_info = getattr(init_res, "server_info", None)
                        s_name = getattr(server_info, "name", config.name) if server_info else config.name
                        s_ver = getattr(server_info, "version", "") if server_info else ""

                        discovered = []
                        for t in tools_res.tools:
                            # inputSchema in mcp types
                            schema = getattr(t, "inputSchema", None) or getattr(t, "input_schema", {})
                            if hasattr(schema, "model_dump"):
                                schema = schema.model_dump()
                            elif not isinstance(schema, dict):
                                schema = {}
                            discovered.append(DiscoveredTool(
                                name=t.name,
                                description=t.description or "",
                                input_schema=schema,
                                enabled=True,
                            ))

                        return s_name, s_ver, discovered

            s_name, s_ver, discovered = await asyncio.wait_for(_run_stdio(), timeout=config.timeout_seconds)
            latency = round((time.perf_counter() - start) * 1000, 1)
            return McpConnectionResult(
                success=True,
                server_name=s_name,
                server_version=s_ver,
                tools=discovered,
                latency_ms=latency,
            )

        elif config.transport == "sse":
            if not config.url:
                return McpConnectionResult(
                    success=False,
                    error="SSE transport requires a valid endpoint URL."
                )

            async def _run_sse():
                async with sse_client(config.url, headers=config.headers, timeout=config.timeout_seconds) as (read_stream, write_stream):
                    async with ClientSession(read_stream, write_stream) as session:
                        init_res = await session.initialize()
                        tools_res = await session.list_tools()
                        server_info = getattr(init_res, "server_info", None)
                        s_name = getattr(server_info, "name", config.name) if server_info else config.name
                        s_ver = getattr(server_info, "version", "") if server_info else ""

                        discovered = []
                        for t in tools_res.tools:
                            schema = getattr(t, "inputSchema", None) or getattr(t, "input_schema", {})
                            if hasattr(schema, "model_dump"):
                                schema = schema.model_dump()
                            elif not isinstance(schema, dict):
                                schema = {}
                            discovered.append(DiscoveredTool(
                                name=t.name,
                                description=t.description or "",
                                input_schema=schema,
                                enabled=True,
                            ))

                        return s_name, s_ver, discovered

            s_name, s_ver, discovered = await asyncio.wait_for(_run_sse(), timeout=config.timeout_seconds)
            latency = round((time.perf_counter() - start) * 1000, 1)
            return McpConnectionResult(
                success=True,
                server_name=s_name,
                server_version=s_ver,
                tools=discovered,
                latency_ms=latency,
            )

        else:
            return McpConnectionResult(
                success=False,
                error=f"Unsupported transport: {config.transport}. Supported transports: 'stdio', 'sse'."
            )

    except asyncio.TimeoutError:
        return McpConnectionResult(
            success=False,
            error=f"Connection timed out after {config.timeout_seconds}s. Please check if the server is running."
        )
    except FileNotFoundError as fnf:
        return McpConnectionResult(
            success=False,
            error=f"Command or executable not found: {fnf}"
        )
    except Exception as exc:
        log.exception(f"MCP connection test failed for {config.name}")
        return McpConnectionResult(
            success=False,
            error=f"{type(exc).__name__}: {str(exc)}"
        )


async def invoke_mcp_tool(
    config: McpServerConfig,
    tool_name: str,
    arguments: dict[str, Any],
) -> dict[str, Any]:
    """
    Connect to the MCP server and call the specified tool with arguments.
    Returns structured results.
    """
    try:
        if config.transport == "stdio":
            cmd = config.command
            if cmd in ("python", "python3", "python.exe") and sys.executable:
                cmd = sys.executable

            full_env = dict(os.environ)
            full_env.update(config.env)

            params = StdioServerParameters(
                command=cmd,
                args=config.args,
                env=full_env,
                cwd=config.cwd or None,
            )

            async def _call():
                async with stdio_client(params) as (read_stream, write_stream):
                    async with ClientSession(read_stream, write_stream) as session:
                        await session.initialize()
                        result = await session.call_tool(tool_name, arguments)
                        # Extract content blocks
                        output_parts = []
                        for block in getattr(result, "content", []):
                            if hasattr(block, "text"):
                                output_parts.append(block.text)
                            else:
                                output_parts.append(str(block))
                        return {
                            "success": True,
                            "content": "\n".join(output_parts) if output_parts else str(result),
                            "is_error": getattr(result, "isError", False) or getattr(result, "is_error", False),
                        }

            return await asyncio.wait_for(_call(), timeout=config.timeout_seconds)

        elif config.transport == "sse":
            async def _call_sse():
                async with sse_client(config.url, headers=config.headers, timeout=config.timeout_seconds) as (read_stream, write_stream):
                    async with ClientSession(read_stream, write_stream) as session:
                        await session.initialize()
                        result = await session.call_tool(tool_name, arguments)
                        output_parts = []
                        for block in getattr(result, "content", []):
                            if hasattr(block, "text"):
                                output_parts.append(block.text)
                            else:
                                output_parts.append(str(block))
                        return {
                            "success": True,
                            "content": "\n".join(output_parts) if output_parts else str(result),
                            "is_error": getattr(result, "isError", False) or getattr(result, "is_error", False),
                        }

            return await asyncio.wait_for(_call_sse(), timeout=config.timeout_seconds)

        else:
            return {"success": False, "error": f"Unsupported transport {config.transport}"}

    except Exception as exc:
        return {"success": False, "error": f"Tool invocation error: {str(exc)}"}
