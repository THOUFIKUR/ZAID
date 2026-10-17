"""
ZAID Official API Integrations
Handlers for validating credentials and executing tools for official service APIs (GitHub, Notion, Slack, DuckDuckGo).
"""
from __future__ import annotations
import logging
from typing import Any
import httpx

log = logging.getLogger("zaid.integrations.api")


# ── DuckDuckGo Web Search ─────────────────────────────────────────────────────
def search_duckduckgo(query: str, max_results: int = 5) -> dict[str, Any]:
    """Execute live DuckDuckGo web search."""
    try:
        from duckduckgo_search import DDGS
        results = []
        with DDGS() as ddgs:
            for r in ddgs.text(query, max_results=max_results):
                results.append({
                    "title": r.get("title", ""),
                    "snippet": r.get("body", ""),
                    "url": r.get("href", ""),
                })
        return {
            "success": True,
            "query": query,
            "results": results,
            "count": len(results),
        }
    except Exception as e:
        log.error(f"DuckDuckGo search error: {e}")
        return {
            "success": False,
            "query": query,
            "error": f"Search failed: {str(e)}",
            "results": [],
        }


# ── GitHub Official API ───────────────────────────────────────────────────────
async def test_github_credentials(token: str) -> dict[str, Any]:
    """Validate GitHub token by querying the user profile endpoint."""
    if not token or not token.strip():
        return {"success": False, "error": "GitHub Personal Access Token is required."}

    headers = {
        "Authorization": f"Bearer {token.strip()}",
        "Accept": "application/vnd.github+json",
        "User-Agent": "ZAID-AI-Assistant",
    }
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get("https://api.github.com/user", headers=headers)
            if resp.status_code == 200:
                data = resp.json()
                return {
                    "success": True,
                    "account_identity": f"@{data.get('login', 'unknown')} ({data.get('name') or 'GitHub User'})",
                    "details": {
                        "login": data.get("login"),
                        "name": data.get("name"),
                        "public_repos": data.get("public_repos"),
                        "total_private_repos": data.get("total_private_repos"),
                    },
                }
            elif resp.status_code == 401:
                return {"success": False, "error": "Invalid Personal Access Token (HTTP 401 Unauthorized)."}
            elif resp.status_code == 403:
                return {"success": False, "error": "GitHub API rate limit exceeded or token lacks user permissions."}
            else:
                return {"success": False, "error": f"GitHub API error: HTTP {resp.status_code}"}
    except Exception as exc:
        return {"success": False, "error": f"Failed to reach GitHub API: {str(exc)}"}


async def execute_github_tool(token: str, tool_name: str, arguments: dict[str, Any]) -> dict[str, Any]:
    """Execute authenticated GitHub tools."""
    headers = {
        "Authorization": f"Bearer {token.strip()}",
        "Accept": "application/vnd.github+json",
        "User-Agent": "ZAID-AI-Assistant",
    }
    async with httpx.AsyncClient(timeout=12.0) as client:
        try:
            if tool_name == "list_repositories":
                limit = int(arguments.get("limit", 10))
                resp = await client.get(
                    f"https://api.github.com/user/repos?sort=updated&per_page={limit}",
                    headers=headers,
                )
                if resp.status_code != 200:
                    return {"success": False, "error": f"GitHub returned HTTP {resp.status_code}"}
                repos = resp.json()
                return {
                    "success": True,
                    "repositories": [
                        {
                            "name": r.get("full_name"),
                            "description": r.get("description"),
                            "stars": r.get("stargazers_count"),
                            "private": r.get("private"),
                            "url": r.get("html_url"),
                            "updated_at": r.get("updated_at"),
                        }
                        for r in repos
                    ],
                }

            elif tool_name == "search_issues":
                query = arguments.get("query", "")
                if not query:
                    return {"success": False, "error": "Search query is required."}
                resp = await client.get(
                    f"https://api.github.com/search/issues?q={query}",
                    headers=headers,
                )
                if resp.status_code != 200:
                    return {"success": False, "error": f"GitHub returned HTTP {resp.status_code}"}
                data = resp.json()
                return {
                    "success": True,
                    "total_count": data.get("total_count", 0),
                    "items": [
                        {
                            "title": item.get("title"),
                            "url": item.get("html_url"),
                            "state": item.get("state"),
                            "created_at": item.get("created_at"),
                        }
                        for item in data.get("items", [])[:10]
                    ],
                }

            else:
                return {"success": False, "error": f"Unknown GitHub tool: {tool_name}"}

        except Exception as exc:
            return {"success": False, "error": f"GitHub execution error: {str(exc)}"}


# ── Notion Official API ───────────────────────────────────────────────────────
async def test_notion_credentials(token: str) -> dict[str, Any]:
    """Validate Notion Internal Integration Secret."""
    if not token or not token.strip():
        return {"success": False, "error": "Notion Integration Secret is required."}

    headers = {
        "Authorization": f"Bearer {token.strip()}",
        "Notion-Version": "2022-06-28",
    }
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get("https://api.notion.com/v1/users/me", headers=headers)
            if resp.status_code == 200:
                data = resp.json()
                bot_name = data.get("name", "Notion Bot")
                workspace_name = data.get("bot", {}).get("workspace_name", "Connected Workspace")
                return {
                    "success": True,
                    "account_identity": f"{bot_name} ({workspace_name})",
                }
            elif resp.status_code == 401:
                return {"success": False, "error": "Invalid Notion token (HTTP 401 Unauthorized)."}
            else:
                return {"success": False, "error": f"Notion API error: HTTP {resp.status_code}"}
    except Exception as exc:
        return {"success": False, "error": f"Failed to connect to Notion: {str(exc)}"}


# ── Slack Official API ────────────────────────────────────────────────────────
async def test_slack_credentials(token: str) -> dict[str, Any]:
    """Validate Slack Bot User OAuth Token."""
    if not token or not token.strip():
        return {"success": False, "error": "Slack Bot Token is required."}

    headers = {"Authorization": f"Bearer {token.strip()}"}
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post("https://slack.com/api/auth.test", headers=headers)
            data = resp.json()
            if data.get("ok"):
                return {
                    "success": True,
                    "account_identity": f"@{data.get('user')} on {data.get('team')}",
                }
            else:
                return {"success": False, "error": f"Slack auth failed: {data.get('error')}"}
    except Exception as exc:
        return {"success": False, "error": f"Failed to reach Slack: {str(exc)}"}
