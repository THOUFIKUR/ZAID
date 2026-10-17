"""
Activity log router — append-only local JSON log of all ZAID actions.
Endpoints:
  GET    /api/activity           — list recent entries (newest first)
  DELETE /api/activity           — clear the log
"""
from __future__ import annotations
import json, time, asyncio, logging
from typing import Optional

from fastapi import APIRouter

from config import ACTIVITY_FILE, MAX_ACTIVITY_ENTRIES

log = logging.getLogger(__name__)
router = APIRouter()

_lock = asyncio.Lock()


def _load() -> list[dict]:
    if ACTIVITY_FILE.exists():
        try:
            return json.loads(ACTIVITY_FILE.read_text(encoding="utf-8"))
        except Exception:
            return []
    return []


def _save(data: list[dict]) -> None:
    ACTIVITY_FILE.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")


@router.get("/activity")
async def list_activity(limit: int = 50, category: Optional[str] = None):
    async with _lock:
        entries = _load()
    if category:
        entries = [e for e in entries if e.get("category") == category]
    entries = list(reversed(entries))   # newest first
    return {"entries": entries[:limit], "total": len(entries)}


@router.delete("/activity", status_code=204)
async def clear_activity():
    async with _lock:
        _save([])
