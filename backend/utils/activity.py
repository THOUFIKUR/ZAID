"""Shared activity logging utility used by all routers."""
from __future__ import annotations
import json, time, asyncio, uuid
from typing import Any

from config import ACTIVITY_FILE, MAX_ACTIVITY_ENTRIES

_lock = asyncio.Lock()


async def log_activity(category: str, description: str, meta: dict[str, Any] | None = None) -> None:
    """Append one entry to the activity log. Trims to MAX_ACTIVITY_ENTRIES."""
    entry = {
        "id": str(uuid.uuid4()),
        "category": category,
        "description": description,
        "meta": meta or {},
        "timestamp": time.time(),
    }
    async with _lock:
        try:
            if ACTIVITY_FILE.exists():
                data: list = json.loads(ACTIVITY_FILE.read_text(encoding="utf-8"))
            else:
                data = []
        except Exception:
            data = []

        data.append(entry)
        # Trim oldest entries beyond the cap
        if len(data) > MAX_ACTIVITY_ENTRIES:
            data = data[-MAX_ACTIVITY_ENTRIES:]

        try:
            ACTIVITY_FILE.write_text(
                json.dumps(data, indent=2, ensure_ascii=False),
                encoding="utf-8",
            )
        except Exception:
            pass   # never crash a router because logging failed
