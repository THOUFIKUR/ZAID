"""
ZAID Integrations Storage
Persists integration configurations, credentials, tool states, and sync metadata.
Secrets are securely masked before sending to the frontend.
"""
from __future__ import annotations
import json
import time
import logging
from pathlib import Path
from typing import Any, Optional
from pydantic import BaseModel, Field

from utils.activity import log_activity

log = logging.getLogger("zaid.integrations.storage")
CONFIG_PATH = Path("D:/ZAID/config/integrations_config.json")


class StoredTool(BaseModel):
    name: str
    description: str = ""
    input_schema: dict[str, Any] = Field(default_factory=dict)
    enabled: bool = True


class StoredIntegration(BaseModel):
    id: str
    name: str
    category: str
    type: str  # 'mcp_server' | 'official_api' | 'native' | 'oauth_connection'
    status: str = "connected"  # 'connected' | 'disconnected' | 'error'
    account_identity: Optional[str] = None
    last_sync: float = Field(default_factory=time.time)
    connected_at: float = Field(default_factory=time.time)
    last_error: Optional[str] = None
    tools: list[StoredTool] = Field(default_factory=list)
    # Backend configuration (contains credentials / commands)
    config: dict[str, Any] = Field(default_factory=dict)


def mask_secret(val: str) -> str:
    """Mask a secret string (e.g., API key, token)."""
    if not val or not isinstance(val, str):
        return ""
    if len(val) <= 8:
        return "********"
    return f"{val[:4]}...{val[-4:]}"


def sanitize_integration_for_client(item: StoredIntegration) -> dict[str, Any]:
    """
    Sanitize an integration record so that sensitive tokens, keys, and env variables
    are masked before being returned in API responses to the frontend.
    """
    data = item.model_dump()
    cfg = data.get("config", {})

    sanitized_cfg = {}
    for k, v in cfg.items():
        if k in ("api_key", "token", "secret", "password", "client_secret"):
            sanitized_cfg[k] = mask_secret(str(v))
        elif k == "env" and isinstance(v, dict):
            # Mask environment variable values
            sanitized_cfg[k] = {ek: mask_secret(str(ev)) for ek, ev in v.items()}
        elif k == "headers" and isinstance(v, dict):
            sanitized_headers = {}
            for hk, hv in v.items():
                if "auth" in hk.lower() or "token" in hk.lower() or "key" in hk.lower():
                    sanitized_headers[hk] = mask_secret(str(hv))
                else:
                    sanitized_headers[hk] = hv
            sanitized_cfg[k] = sanitized_headers
        else:
            sanitized_cfg[k] = v

    data["config"] = sanitized_cfg
    return data


class IntegrationsStorage:
    def __init__(self, file_path: Path = CONFIG_PATH):
        self.file_path = file_path
        self._ensure_init()

    def _ensure_init(self):
        self.file_path.parent.mkdir(parents=True, exist_ok=True)
        if not self.file_path.exists():
            # Initial default integrations:
            # 1. Windows Native
            # 2. DuckDuckGo Web Search
            initial = [
                StoredIntegration(
                    id="windows-native",
                    name="Windows System Automation",
                    category="local_tools",
                    type="native",
                    status="connected",
                    account_identity="Windows User (Localhost)",
                    connected_at=time.time(),
                    last_sync=time.time(),
                    tools=[
                        StoredTool(name="launch_desktop_app", description="Launch approved local Windows app (calc, notepad, explorer, etc.)", enabled=True),
                        StoredTool(name="get_running_processes", description="Monitor active system processes and resource consumption", enabled=True),
                        StoredTool(name="read_allowed_file", description="Read permitted user documents and files", enabled=True),
                    ],
                    config={},
                ).model_dump(),
                StoredIntegration(
                    id="web-search",
                    name="DuckDuckGo Web Search",
                    category="browser_web",
                    type="official_api",
                    status="connected",
                    account_identity="DuckDuckGo Search Engine",
                    connected_at=time.time(),
                    last_sync=time.time(),
                    tools=[
                        StoredTool(name="duckduckgo_search", description="Search the web for up-to-date information, news, and technical answers", enabled=True),
                    ],
                    config={},
                ).model_dump(),
            ]
            self.file_path.write_text(json.dumps(initial, indent=2), encoding="utf-8")

    def load_all(self) -> list[StoredIntegration]:
        try:
            raw = json.loads(self.file_path.read_text(encoding="utf-8"))
            return [StoredIntegration(**item) for item in raw]
        except Exception as e:
            log.error(f"Error reading integrations config: {e}")
            return []

    def save_all(self, items: list[StoredIntegration]):
        data = [i.model_dump() for i in items]
        temp_file = self.file_path.with_suffix(".tmp")
        temp_file.write_text(json.dumps(data, indent=2), encoding="utf-8")
        temp_file.replace(self.file_path)

    def get_by_id(self, item_id: str) -> Optional[StoredIntegration]:
        for item in self.load_all():
            if item.id == item_id:
                return item
        return None

    def upsert(self, integration: StoredIntegration):
        items = self.load_all()
        found = False
        for idx, it in enumerate(items):
            if it.id == integration.id:
                items[idx] = integration
                found = True
                break
        if not found:
            items.append(integration)
        self.save_all(items)

    def delete(self, item_id: str) -> bool:
        items = self.load_all()
        new_items = [i for i in items if i.id != item_id]
        if len(new_items) != len(items):
            self.save_all(new_items)
            return True
        return False

    def toggle_tool(self, integration_id: str, tool_name: str, enabled: bool) -> bool:
        items = self.load_all()
        for item in items:
            if item.id == integration_id:
                for tool in item.tools:
                    if tool.name == tool_name:
                        tool.enabled = enabled
                        self.save_all(items)
                        return True
        return False


# Singleton instance
storage = IntegrationsStorage()
