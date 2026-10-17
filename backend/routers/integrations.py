"""
ZAID Integrations Router
Exposes endpoints for catalog listing, MCP server configuration, testing connections,
discovering capabilities, managing tool permissions, and executing tools.
"""
from __future__ import annotations
import time
import logging
from typing import Any, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from integrations.catalog import get_catalog, get_catalog_item
from integrations.storage import (
    storage,
    StoredIntegration,
    StoredTool,
    sanitize_integration_for_client,
)
from integrations.mcp_client import (
    McpServerConfig,
    test_mcp_connection,
    McpConnectionResult,
)
from integrations.api_integrations import (
    test_github_credentials,
    test_notion_credentials,
    test_slack_credentials,
)
from integrations.tool_registry import (
    get_all_registered_tools,
    execute_tool,
    route_user_request,
)
from utils.activity import log_activity

log = logging.getLogger("zaid.routers.integrations")
router = APIRouter(prefix="/integrations", tags=["Integrations & MCP"])


# ── Schemas ───────────────────────────────────────────────────────────────────
class McpTestRequest(BaseModel):
    name: str = "Custom MCP Server"
    transport: str = Field(..., description="'stdio' or 'sse'")
    command: Optional[str] = None
    args: list[str] = Field(default_factory=list)
    env: dict[str, str] = Field(default_factory=dict)
    cwd: Optional[str] = None
    url: Optional[str] = None
    headers: dict[str, str] = Field(default_factory=dict)
    timeout_seconds: float = 12.0


class SaveMcpIntegrationRequest(BaseModel):
    id: str
    name: str
    category: str = "custom_mcp"
    transport: str
    command: Optional[str] = None
    args: list[str] = Field(default_factory=list)
    env: dict[str, str] = Field(default_factory=dict)
    cwd: Optional[str] = None
    url: Optional[str] = None
    headers: dict[str, str] = Field(default_factory=dict)
    timeout_seconds: float = 12.0
    tools: list[dict[str, Any]] = Field(default_factory=list)


class ApiTestRequest(BaseModel):
    service_id: str  # "github", "notion", "slack"
    token: str


class SaveApiIntegrationRequest(BaseModel):
    service_id: str
    token: str


class ToolToggleRequest(BaseModel):
    enabled: bool


class ToolExecuteRequest(BaseModel):
    integration_id: str
    tool_name: str
    arguments: dict[str, Any] = Field(default_factory=dict)


class IntentRouteRequest(BaseModel):
    prompt: str


# ── Endpoints ─────────────────────────────────────────────────────────────────
@router.get("/catalog")
async def list_catalog():
    """Return the complete integration directory with real-time connection status."""
    catalog = get_catalog()
    connected = {item.id: item for item in storage.load_all()}

    output = []
    for item in catalog:
        entry = item.model_dump()
        if item.id in connected:
            conn = connected[item.id]
            entry["status"] = conn.status
            entry["connected_at"] = conn.connected_at
            entry["last_sync"] = conn.last_sync
            entry["account_identity"] = conn.account_identity
            entry["tool_count"] = len([t for t in conn.tools if t.enabled])
        output.append(entry)

    return {"catalog": output}


@router.get("/connected")
async def list_connected():
    """Return all configured and connected integrations with sanitized credentials."""
    items = storage.load_all()
    sanitized = [sanitize_integration_for_client(i) for i in items]
    return {
        "integrations": sanitized,
        "total": len(sanitized),
    }


@router.post("/mcp/test")
async def test_mcp_server(req: McpTestRequest):
    """
    Test connection to an MCP server without saving.
    Negotiates capabilities and discovers tools.
    """
    cfg = McpServerConfig(
        id="test-probe",
        name=req.name,
        transport=req.transport,
        command=req.command,
        args=req.args,
        env=req.env,
        cwd=req.cwd,
        url=req.url,
        headers=req.headers,
        timeout_seconds=req.timeout_seconds,
    )
    result = await test_mcp_connection(cfg)
    return result


@router.post("/mcp/save")
async def save_mcp_server(req: SaveMcpIntegrationRequest):
    """
    Save and verify a new or updated MCP server integration.
    Performs a connection test before persisting.
    """
    cfg = McpServerConfig(
        id=req.id,
        name=req.name,
        transport=req.transport,
        command=req.command,
        args=req.args,
        env=req.env,
        cwd=req.cwd,
        url=req.url,
        headers=req.headers,
        timeout_seconds=req.timeout_seconds,
    )
    test_res = await test_mcp_connection(cfg)
    if not test_res.success:
        raise HTTPException(status_code=400, detail=f"Failed to connect to MCP server: {test_res.error}")

    # Build stored tools list from discovered tools
    stored_tools = []
    for t in test_res.tools:
        # Check if caller specified enabled status
        override = next((ot for ot in req.tools if ot.get("name") == t.name), None)
        is_enabled = override.get("enabled", True) if override else True
        stored_tools.append(
            StoredTool(
                name=t.name,
                description=t.description or "",
                input_schema=t.input_schema,
                enabled=is_enabled,
            )
        )

    integration = StoredIntegration(
        id=req.id,
        name=req.name,
        category=req.category,
        type="mcp_server",
        status="connected",
        account_identity=f"MCP: {test_res.server_name or req.name}",
        last_sync=time.time(),
        connected_at=time.time(),
        tools=stored_tools,
        config={
            "transport": req.transport,
            "command": req.command,
            "args": req.args,
            "env": req.env,
            "cwd": req.cwd,
            "url": req.url,
            "headers": req.headers,
            "timeout_seconds": req.timeout_seconds,
        },
    )
    storage.upsert(integration)
    await log_activity(
        "integration",
        f"Connected MCP server: {req.name}",
        {"id": req.id, "tools": len(stored_tools)},
    )

    return {
        "success": True,
        "integration": sanitize_integration_for_client(integration),
    }


@router.post("/api/test")
async def test_api_service(req: ApiTestRequest):
    """Test credentials for an official API service (GitHub, Notion, Slack)."""
    if req.service_id == "github":
        return await test_github_credentials(req.token)
    elif req.service_id == "notion":
        return await test_notion_credentials(req.token)
    elif req.service_id == "slack":
        return await test_slack_credentials(req.token)
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported API service: {req.service_id}")


@router.post("/api/save")
async def save_api_service(req: SaveApiIntegrationRequest):
    """Verify credentials and save an official API integration."""
    cat_item = get_catalog_item(req.service_id)
    if not cat_item:
        raise HTTPException(status_code=404, detail="Service not found in catalog.")

    if req.service_id == "github":
        test_res = await test_github_credentials(req.token)
        if not test_res.get("success"):
            raise HTTPException(status_code=400, detail=test_res.get("error", "GitHub verification failed."))

        tools = [
            StoredTool(name="list_repositories", description="List user repositories", enabled=True),
            StoredTool(name="search_issues", description="Search GitHub issues and pull requests", enabled=True),
        ]
        integration = StoredIntegration(
            id="github",
            name="GitHub",
            category="developer_tools",
            type="official_api",
            status="connected",
            account_identity=test_res.get("account_identity"),
            connected_at=time.time(),
            last_sync=time.time(),
            tools=tools,
            config={"token": req.token.strip()},
        )
        storage.upsert(integration)
        await log_activity("integration", "Connected GitHub account", {"account": test_res.get("account_identity")})
        return {"success": True, "integration": sanitize_integration_for_client(integration)}

    elif req.service_id == "notion":
        test_res = await test_notion_credentials(req.token)
        if not test_res.get("success"):
            raise HTTPException(status_code=400, detail=test_res.get("error", "Notion verification failed."))

        tools = [
            StoredTool(name="search_notion", description="Search Notion pages and databases", enabled=True),
        ]
        integration = StoredIntegration(
            id="notion",
            name="Notion",
            category="productivity",
            type="official_api",
            status="connected",
            account_identity=test_res.get("account_identity"),
            connected_at=time.time(),
            last_sync=time.time(),
            tools=tools,
            config={"token": req.token.strip()},
        )
        storage.upsert(integration)
        await log_activity("integration", "Connected Notion workspace", {"account": test_res.get("account_identity")})
        return {"success": True, "integration": sanitize_integration_for_client(integration)}

    elif req.service_id == "slack":
        test_res = await test_slack_credentials(req.token)
        if not test_res.get("success"):
            raise HTTPException(status_code=400, detail=test_res.get("error", "Slack verification failed."))

        tools = [
            StoredTool(name="slack_messages", description="Read Slack conversations and alerts", enabled=True),
        ]
        integration = StoredIntegration(
            id="slack",
            name="Slack",
            category="messaging",
            type="official_api",
            status="connected",
            account_identity=test_res.get("account_identity"),
            connected_at=time.time(),
            last_sync=time.time(),
            tools=tools,
            config={"token": req.token.strip()},
        )
        storage.upsert(integration)
        await log_activity("integration", "Connected Slack workspace", {"account": test_res.get("account_identity")})
        return {"success": True, "integration": sanitize_integration_for_client(integration)}

    else:
        raise HTTPException(status_code=400, detail=f"Cannot save service {req.service_id}: not supported.")


@router.post("/{integration_id}/test")
async def test_existing_integration(integration_id: str):
    """Re-test an existing integration and update its sync status."""
    item = storage.get_by_id(integration_id)
    if not item:
        raise HTTPException(status_code=404, detail="Integration not found.")

    if item.type == "mcp_server":
        cfg = McpServerConfig(
            id=item.id,
            name=item.name,
            transport=item.config.get("transport", "stdio"),
            command=item.config.get("command"),
            args=item.config.get("args", []),
            env=item.config.get("env", {}),
            cwd=item.config.get("cwd"),
            url=item.config.get("url"),
            headers=item.config.get("headers", {}),
            timeout_seconds=item.config.get("timeout_seconds", 12.0),
        )
        res = await test_mcp_connection(cfg)
        if res.success:
            item.status = "connected"
            item.last_sync = time.time()
            item.last_error = None
            # Refresh discovered tools, preserving enabled toggles
            existing_enabled = {t.name: t.enabled for t in item.tools}
            refreshed_tools = []
            for dt in res.tools:
                refreshed_tools.append(StoredTool(
                    name=dt.name,
                    description=dt.description or "",
                    input_schema=dt.input_schema,
                    enabled=existing_enabled.get(dt.name, True),
                ))
            item.tools = refreshed_tools
            storage.upsert(item)
            return {"success": True, "latency_ms": res.latency_ms, "tools_count": len(refreshed_tools)}
        else:
            item.status = "error"
            item.last_error = res.error
            storage.upsert(item)
            return {"success": False, "error": res.error}

    elif item.type == "official_api":
        token = item.config.get("token", "")
        if item.id == "github":
            res = await test_github_credentials(token)
        elif item.id == "notion":
            res = await test_notion_credentials(token)
        elif item.id == "slack":
            res = await test_slack_credentials(token)
        elif item.id == "web-search":
            res = {"success": True}
        else:
            res = {"success": False, "error": "Unknown API integration"}

        if res.get("success"):
            item.status = "connected"
            item.last_sync = time.time()
            item.last_error = None
            storage.upsert(item)
            return {"success": True}
        else:
            item.status = "error"
            item.last_error = res.get("error")
            storage.upsert(item)
            return {"success": False, "error": res.get("error")}

    elif item.type == "native":
        item.last_sync = time.time()
        storage.upsert(item)
        return {"success": True, "message": "Native Windows bridge operational."}

    return {"success": True}


@router.delete("/{integration_id}")
async def disconnect_integration(integration_id: str):
    """Disconnect and remove an integration safely."""
    # Prevent deletion of core native integration
    if integration_id == "windows-native":
        raise HTTPException(status_code=400, detail="Cannot disconnect core Windows native integration.")

    item = storage.get_by_id(integration_id)
    if not item:
        raise HTTPException(status_code=404, detail="Integration not found.")

    storage.delete(integration_id)
    await log_activity("integration", f"Disconnected integration: {item.name}", {"id": integration_id})
    return {"success": True, "disconnected_id": integration_id}


@router.patch("/{integration_id}/tools/{tool_name}")
async def toggle_integration_tool(integration_id: str, tool_name: str, req: ToolToggleRequest):
    """Enable or disable a specific tool on an integration."""
    success = storage.toggle_tool(integration_id, tool_name, req.enabled)
    if not success:
        raise HTTPException(status_code=404, detail="Integration or tool not found.")
    return {"success": True, "integration_id": integration_id, "tool_name": tool_name, "enabled": req.enabled}


@router.get("/tools")
async def list_tools():
    """Return all available registered tools across all integrations."""
    tools = get_all_registered_tools()
    return {"tools": [t.model_dump() for t in tools]}


@router.post("/tools/execute")
async def execute_tool_endpoint(req: ToolExecuteRequest):
    """Execute an authorized tool."""
    res = await execute_tool(req.integration_id, req.tool_name, req.arguments)
    return res


@router.post("/route-intent")
async def route_intent_endpoint(req: IntentRouteRequest):
    """Test user intent routing for tools or missing integrations."""
    result = await route_user_request(req.prompt)
    return {"routed": result is not None, "data": result}
