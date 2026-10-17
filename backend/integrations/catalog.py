"""
ZAID Integrations Catalog
Defines the directory of all supported and future integrations with category,
connection type, prerequisites, capabilities, and guided setup instructions.
"""
from __future__ import annotations
from typing import Literal, Optional
from pydantic import BaseModel, Field

CategoryType = Literal[
    "productivity",
    "email_calendar",
    "files_storage",
    "developer_tools",
    "messaging",
    "browser_web",
    "local_tools",
    "custom_mcp",
]

IntegrationType = Literal[
    "native",
    "official_api",
    "oauth_connection",
    "mcp_server",
    "local_tool",
    "coming_soon",
]

StatusType = Literal[
    "connected",
    "disconnected",
    "available",
    "needs_setup",
    "coming_soon",
]


class CatalogItem(BaseModel):
    id: str
    name: str
    category: CategoryType
    type: IntegrationType
    status: StatusType
    description: str
    capabilities: list[str]
    icon: str
    setup_guide: str
    permissions_needed: list[str] = Field(default_factory=list)
    doc_url: Optional[str] = None
    default_config: Optional[dict] = None


INTEGRATION_CATALOG: list[CatalogItem] = [
    # ── Local Computer Tools ──────────────────────────────────────────────────
    CatalogItem(
        id="zaid-local-tools",
        name="ZAID Local Tools MCP",
        category="local_tools",
        type="mcp_server",
        status="available",
        description="Official high-speed local MCP server providing Windows system health, CPU/RAM stats, secure math calculation, and quick scratchpad notes.",
        capabilities=[
            "get_system_summary",
            "evaluate_math",
            "read_or_append_scratchpad",
            "list_running_app_windows",
        ],
        icon="chip",
        setup_guide="Built directly into ZAID. Connects instantly via local Python stdio transport with zero cloud dependency.",
        permissions_needed=["Read system metrics", "Execute math evaluation", "Write local quick notes"],
        default_config={
            "transport": "stdio",
            "command": "python",
            "args": ["D:/ZAID/backend/integrations/local_mcp_server.py"],
        },
    ),
    CatalogItem(
        id="windows-native",
        name="Windows System Automation",
        category="local_tools",
        type="native",
        status="connected",
        description="Direct local Windows operating system bridge for launching approved applications (Calculator, Notepad, Explorer, Terminal) and monitoring processes.",
        capabilities=[
            "Launch approved desktop apps",
            "Monitor background processes",
            "Browse local user documents",
        ],
        icon="terminal",
        setup_guide="Native Windows integration built directly into the ZAID core. Always connected locally.",
        permissions_needed=["Launch allowed desktop applications", "Read directory trees"],
    ),

    # ── Browser & Web Research ───────────────────────────────────────────────
    CatalogItem(
        id="web-search",
        name="DuckDuckGo Web Search",
        category="browser_web",
        type="official_api",
        status="connected",
        description="Real-time web search and live internet lookup using DuckDuckGo search engine with instant summary extraction.",
        capabilities=[
            "Search current web results",
            "Fetch news and technical docs",
            "Query public API documentation",
        ],
        icon="globe",
        setup_guide="Active native search engine powered by duckduckgo-search in backend virtual environment. No API key needed.",
        permissions_needed=["Internet access to DuckDuckGo search API"],
    ),

    # ── Developer Tools ──────────────────────────────────────────────────────
    CatalogItem(
        id="github",
        name="GitHub",
        category="developer_tools",
        type="official_api",
        status="needs_setup",
        description="Connect your GitHub account using an official Personal Access Token to search repositories, inspect issues, and view commit logs.",
        capabilities=[
            "List user repositories",
            "Search issues and pull requests",
            "Inspect repository README and details",
        ],
        icon="github",
        setup_guide="Create a Personal Access Token (classic or fine-grained) at github.com/settings/tokens with 'repo' and 'read:user' permissions, then paste it here.",
        permissions_needed=["repo (Repository read access)", "read:user (Profile identity verification)"],
        doc_url="https://github.com/settings/tokens",
    ),
    CatalogItem(
        id="mcp-filesystem",
        name="Filesystem MCP Server",
        category="files_storage",
        type="mcp_server",
        status="available",
        description="Official Anthropic Model Context Protocol server for secure, sandboxed file system operations across specified directory paths.",
        capabilities=[
            "read_file",
            "write_file",
            "list_directory",
            "directory_tree",
            "search_files",
        ],
        icon="folder",
        setup_guide="Requires Node.js installed. Uses 'npx -y @modelcontextprotocol/server-filesystem <path>' to provide sandboxed filesystem tools.",
        permissions_needed=["Read/Write access within configured allowed folders"],
        default_config={
            "transport": "stdio",
            "command": "npx",
            "args": ["-y", "@modelcontextprotocol/server-filesystem", "D:/ZAID"],
        },
    ),

    # ── Productivity & Notes ─────────────────────────────────────────────────
    CatalogItem(
        id="notion",
        name="Notion",
        category="productivity",
        type="official_api",
        status="needs_setup",
        description="Connect your Notion workspace using an official Notion Internal Integration Secret to query pages, databases, and tasks.",
        capabilities=[
            "Search workspace pages",
            "Query database records",
            "Read page blocks and content",
        ],
        icon="book",
        setup_guide="Go to notion.so/profile/integrations to create an internal integration and copy your Internal Integration Secret (ntn_...). Share relevant pages with your integration.",
        permissions_needed=["Read content", "Read user information without email"],
        doc_url="https://www.notion.so/profile/integrations",
    ),

    # ── Messaging ────────────────────────────────────────────────────────────
    CatalogItem(
        id="slack",
        name="Slack",
        category="messaging",
        type="official_api",
        status="needs_setup",
        description="Connect your Slack workspace using a Bot User OAuth Token to read permitted channels and deliver AI alerts.",
        capabilities=[
            "Read channel history",
            "Post notification messages",
            "Search channel conversations",
        ],
        icon="message-square",
        setup_guide="Create a Slack App at api.slack.com/apps with bot scopes 'channels:history', 'chat:write', and install it into your workspace.",
        permissions_needed=["channels:history", "chat:write", "users:read"],
        doc_url="https://api.slack.com/apps",
    ),

    # ── Email & Calendar ─────────────────────────────────────────────────────
    CatalogItem(
        id="google-workspace",
        name="Google Workspace (Gmail & Calendar)",
        category="email_calendar",
        type="oauth_connection",
        status="needs_setup",
        description="Access Gmail messages, upcoming calendar events, and Google Drive files via official Google Cloud OAuth 2.0 or Google MCP server.",
        capabilities=[
            "List upcoming calendar events",
            "Search inbox messages",
            "Access Google Drive files",
        ],
        icon="mail",
        setup_guide="Configure a Google Cloud Project with Gmail API and Google Calendar API enabled, create OAuth 2.0 Client credentials, or configure the official Google MCP server.",
        permissions_needed=["https://www.googleapis.com/auth/calendar.readonly", "https://www.googleapis.com/auth/gmail.readonly"],
        doc_url="https://console.cloud.google.com/apis/credentials",
    ),
    CatalogItem(
        id="microsoft-365",
        name="Microsoft 365 (Outlook & Calendar)",
        category="email_calendar",
        type="oauth_connection",
        status="needs_setup",
        description="Connect Microsoft Outlook email and Microsoft Calendar through Microsoft Graph API with secure Azure App Registration.",
        capabilities=[
            "Read calendar events",
            "View recent emails",
            "Sync agenda",
        ],
        icon="calendar",
        setup_guide="Register an application in Microsoft Entra ID (Azure Portal) with 'Calendars.Read' and 'Mail.Read' permissions.",
        permissions_needed=["Calendars.Read", "Mail.Read"],
        doc_url="https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade",
    ),

    # ── Custom MCP Server ────────────────────────────────────────────────────
    CatalogItem(
        id="custom-mcp",
        name="Custom MCP Server",
        category="custom_mcp",
        type="mcp_server",
        status="available",
        description="Connect any standard Model Context Protocol server via local command line process (stdio) or remote Server-Sent Events (SSE) endpoint.",
        capabilities=[
            "Dynamic capability negotiation",
            "Automatic tool schema discovery",
            "Granular per-tool permissions",
            "Execution diagnostics",
        ],
        icon="server",
        setup_guide="Specify your command line executable or remote SSE endpoint. ZAID automatically negotiates protocols, validates schemas, and maps tools.",
        permissions_needed=["Execution authorization for configured tools"],
    ),
]


def get_catalog() -> list[CatalogItem]:
    return INTEGRATION_CATALOG


def get_catalog_item(item_id: str) -> Optional[CatalogItem]:
    for item in INTEGRATION_CATALOG:
        if item.id == item_id:
            return item
    return None
