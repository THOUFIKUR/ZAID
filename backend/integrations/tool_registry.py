"""
ZAID Unified Tool Registry
Binds native Windows automation, connected MCP servers, and official API integrations.
Exposes tool discovery, intent resolution, permission enforcement, and tool execution.
"""
from __future__ import annotations
import re
import logging
from typing import Any, Optional
from pydantic import BaseModel, Field

from integrations.storage import storage, StoredIntegration
from integrations.mcp_client import McpServerConfig, invoke_mcp_tool
from integrations.api_integrations import (
    search_duckduckgo,
    execute_github_tool,
)
from routers.desktop import launch_approved_app, APPROVED_APPS
from utils.activity import log_activity

log = logging.getLogger("zaid.integrations.registry")


class RegisteredTool(BaseModel):
    id: str
    name: str
    description: str
    integration_id: str
    integration_name: str
    category: str
    enabled: bool
    input_schema: dict[str, Any] = Field(default_factory=dict)


def get_all_registered_tools() -> list[RegisteredTool]:
    """Return all tools from all connected integrations."""
    tools: list[RegisteredTool] = []
    connected = storage.load_all()

    for item in connected:
        if item.status != "connected":
            continue
        for t in item.tools:
            tools.append(
                RegisteredTool(
                    id=f"{item.id}:{t.name}",
                    name=t.name,
                    description=t.description,
                    integration_id=item.id,
                    integration_name=item.name,
                    category=item.category,
                    enabled=t.enabled,
                    input_schema=t.input_schema,
                )
            )
    return tools


async def execute_tool(
    integration_id: str,
    tool_name: str,
    arguments: dict[str, Any],
) -> dict[str, Any]:
    """
    Execute an authorized tool on a connected integration.
    Verifies that the integration is connected and the specific tool is enabled.
    """
    integration = storage.get_by_id(integration_id)
    if not integration:
        return {"success": False, "error": f"Integration '{integration_id}' is not configured."}

    if integration.status != "connected":
        return {"success": False, "error": f"Integration '{integration.name}' is currently {integration.status}."}

    # Verify tool is enabled
    tool_entry = next((t for t in integration.tools if t.name == tool_name), None)
    if tool_entry and not tool_entry.enabled:
        return {
            "success": False,
            "error": f"Tool '{tool_name}' is disabled in {integration.name} settings. Please enable it under Integrations.",
        }

    # Log tool execution attempt
    await log_activity(
        "tool_call",
        f"Executing tool {tool_name} on {integration.name}",
        {"integration_id": integration_id, "tool_name": tool_name},
    )

    # 1. Native Windows actions
    if integration.type == "native":
        if tool_name == "launch_desktop_app":
            app_id = arguments.get("app_id") or arguments.get("app")
            if not app_id or app_id not in APPROVED_APPS:
                return {
                    "success": False,
                    "error": f"App '{app_id}' is not in the approved apps list ({', '.join(APPROVED_APPS.keys())}).",
                }
            res = launch_approved_app(app_id)
            return {"success": True, "result": res}
        else:
            return {"success": False, "error": f"Unknown native tool '{tool_name}'."}

    # 2. Official API integrations
    elif integration.type == "official_api":
        if integration_id == "web-search":
            query = arguments.get("query", "")
            return search_duckduckgo(query)
        elif integration_id == "github":
            token = integration.config.get("token", "")
            return await execute_github_tool(token, tool_name, arguments)
        else:
            return {"success": False, "error": f"API execution not implemented for {integration_id}."}

    # 3. MCP Server integrations
    elif integration.type == "mcp_server":
        cfg = McpServerConfig(
            id=integration.id,
            name=integration.name,
            transport=integration.config.get("transport", "stdio"),
            command=integration.config.get("command"),
            args=integration.config.get("args", []),
            env=integration.config.get("env", {}),
            cwd=integration.config.get("cwd"),
            url=integration.config.get("url"),
            headers=integration.config.get("headers", {}),
            timeout_seconds=integration.config.get("timeout_seconds", 12.0),
        )
        return await invoke_mcp_tool(cfg, tool_name, arguments)

    return {"success": False, "error": f"Unhandled integration type: {integration.type}"}


async def route_user_request(prompt: str) -> Optional[dict[str, Any]]:
    """
    Examines the user query to detect if an action, tool, or external integration is needed.
    Returns:
    - Tool execution result if tool is connected and run.
    - Missing integration guidance if integration is NOT connected.
    - None if query is a normal conversational prompt.
    """
    p = prompt.strip().lower()

    # 1. Direct App Launch (e.g. "open calculator", "launch notepad")
    match_launch = re.search(r"\b(open|launch|run|start)\s+(calculator|notepad|paint|explorer|terminal|vscode|chrome|firefox|edge)\b", p)
    if match_launch:
        app_name = match_launch.group(2)
        exec_res = await execute_tool("windows-native", "launch_desktop_app", {"app_id": app_name})
        return {
            "type": "tool_result",
            "action": f"Launch {app_name.capitalize()}",
            "integration_id": "windows-native",
            "integration_name": "Windows System Automation",
            "result": exec_res,
        }

    # 2. Math Calculation (e.g. "calculate 25 * 45", "what is 1024 * 768")
    match_calc = re.search(r"^(?:calculate|compute|solve|math|what is)\s+([0-9\.\+\-\*\/\^\(\)\s%]+)$", p)
    if match_calc:
        expr = match_calc.group(1).strip()
        # Check if zaid-local-tools MCP is connected
        local_mcp = storage.get_by_id("zaid-local-tools")
        if local_mcp and local_mcp.status == "connected":
            res = await execute_tool("zaid-local-tools", "evaluate_math", {"expression": expr})
            return {
                "type": "tool_result",
                "action": f"Evaluate Math: {expr}",
                "integration_id": "zaid-local-tools",
                "integration_name": "ZAID Local Tools MCP",
                "result": res,
            }
        else:
            # Fallback simpleeval
            try:
                from simpleeval import simple_eval
                calc_val = simple_eval(expr.replace("^", "**"))
                return {
                    "type": "tool_result",
                    "action": f"Evaluate Math: {expr}",
                    "integration_id": "zaid-local-tools",
                    "integration_name": "Local Math Engine",
                    "result": {"success": True, "expression": expr, "result": calc_val},
                }
            except Exception as e:
                return {
                    "type": "tool_result",
                    "action": f"Evaluate Math: {expr}",
                    "result": {"success": False, "error": str(e)},
                }

    # 3. Web Search (e.g. "search the web for ...", "web search: ...")
    match_search = re.search(r"^(?:search(?:\s+the\s+web)?\s+for|google|lookup|search:)\s+(.+)$", p)
    if match_search:
        query = match_search.group(1).strip()
        search_res = await execute_tool("web-search", "duckduckgo_search", {"query": query})
        return {
            "type": "tool_result",
            "action": f"Web Search: {query}",
            "integration_id": "web-search",
            "integration_name": "DuckDuckGo Web Search",
            "result": search_res,
        }

    # 4. GitHub Repositories
    if any(k in p for k in ("github repos", "github repositories", "my repositories", "show my github", "list my github")):
        github_item = storage.get_by_id("github")
        if not github_item or github_item.status != "connected":
            return {
                "type": "missing_integration",
                "integration_id": "github",
                "service_name": "GitHub",
                "message": "GitHub is not connected yet. Connect your GitHub account with a Personal Access Token to search repositories and inspect issues.",
                "required_credentials": "Personal Access Token (classic or fine-grained) with 'repo' and 'read:user' permissions",
                "connection_type": "Official API Integration",
            }
        # Run tool
        res = await execute_tool("github", "list_repositories", {"limit": 10})
        return {
            "type": "tool_result",
            "action": "List GitHub Repositories",
            "integration_id": "github",
            "integration_name": "GitHub",
            "result": res,
        }

    # 5. Google Calendar / Drive / Gmail
    if any(k in p for k in ("google calendar", "my calendar", "tomorrow's events", "my agenda", "upcoming meetings")):
        gcal = storage.get_by_id("google-workspace")
        if not gcal or gcal.status != "connected":
            return {
                "type": "missing_integration",
                "integration_id": "google-workspace",
                "service_name": "Google Calendar",
                "message": "Google Calendar is not connected yet. Configure Google Workspace credentials or an authorized Google MCP server to view your schedule.",
                "required_credentials": "OAuth 2.0 Client credentials with 'https://www.googleapis.com/auth/calendar.readonly' permission or Google MCP Server",
                "connection_type": "OAuth 2.0 Connection or MCP Server",
            }

    if any(k in p for k in ("google drive", "files in my drive", "drive files")):
        gdrive = storage.get_by_id("google-workspace")
        if not gdrive or gdrive.status != "connected":
            return {
                "type": "missing_integration",
                "integration_id": "google-workspace",
                "service_name": "Google Drive",
                "message": "Google Drive is not connected yet. Connect Google Workspace via OAuth or an authorized Google Drive MCP server to search and list cloud files.",
                "required_credentials": "Google Drive OAuth 2.0 credentials or @modelcontextprotocol/server-gdrive",
                "connection_type": "OAuth 2.0 Connection or MCP Server",
            }

    # 6. Notion Workspace
    if any(k in p for k in ("notion", "notion workspace", "search my notion")):
        notion_item = storage.get_by_id("notion")
        if not notion_item or notion_item.status != "connected":
            return {
                "type": "missing_integration",
                "integration_id": "notion",
                "service_name": "Notion",
                "message": "Notion is not connected yet. Provide your Notion Internal Integration Secret to query pages and databases.",
                "required_credentials": "Internal Integration Secret ('ntn_...') with page read permissions",
                "connection_type": "Official API Integration",
            }

    # 7. Slack Workspace
    if any(k in p for k in ("slack", "slack channel", "slack messages")):
        slack_item = storage.get_by_id("slack")
        if not slack_item or slack_item.status != "connected":
            return {
                "type": "missing_integration",
                "integration_id": "slack",
                "service_name": "Slack",
                "message": "Slack is not connected yet. Connect your Slack workspace with a Bot User OAuth Token ('xoxb-...') to read messages and receive alerts.",
                "required_credentials": "Bot User OAuth Token with 'channels:history' and 'chat:write' scopes",
                "connection_type": "Official API Integration",
            }

    return None
