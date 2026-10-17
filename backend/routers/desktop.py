"""
M5 — Desktop/App launcher router (approved list only).
Endpoints:
  GET  /api/desktop/apps          — list approved apps
  POST /api/desktop/launch        — launch an approved app
  GET  /api/desktop/processes     — running process list (read-only)
"""
from __future__ import annotations
import subprocess, logging, time
from pathlib import Path

import psutil
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from config import APPROVED_APPS
from utils.activity import log_activity

log = logging.getLogger(__name__)
router = APIRouter()


class LaunchRequest(BaseModel):
    app_id: str          # key from APPROVED_APPS


@router.get("/desktop/apps")
async def list_apps():
    """Return the approved app list with availability status."""
    result = []
    for app_id, exe_path in APPROVED_APPS.items():
        exists = Path(exe_path).exists() if "\\" in exe_path or "/" in exe_path else True
        result.append({
            "id": app_id,
            "label": app_id.replace("_", " ").title(),
            "exe": exe_path,
            "available": exists,
        })
    return {"apps": result}


def launch_approved_app(app_id: str) -> dict:
    """Launch an approved application by its app_id. Raises HTTPException on failure."""
    if app_id not in APPROVED_APPS:
        raise HTTPException(
            403,
            f"'{app_id}' is not in the approved app list. "
            f"Add it to config.py APPROVED_APPS to allow it."
        )

    exe = APPROVED_APPS[app_id]
    try:
        proc = subprocess.Popen(
            [exe],
            shell=False,
            creationflags=subprocess.DETACHED_PROCESS | subprocess.CREATE_NEW_PROCESS_GROUP,
        )
        return {"launched": True, "app_id": app_id, "exe": exe, "pid": proc.pid}
    except FileNotFoundError:
        raise HTTPException(404, f"Executable not found: {exe}")
    except PermissionError:
        raise HTTPException(403, f"Permission denied launching: {exe}")
    except Exception as e:
        raise HTTPException(500, f"Failed to launch {exe}: {e}")


@router.post("/desktop/launch")
async def launch_app(req: LaunchRequest):
    """
    Launch an approved application by its app_id.
    Only apps in APPROVED_APPS can be launched — no arbitrary paths.
    """
    res = launch_approved_app(req.app_id)
    await log_activity("desktop", f"Launched app: {req.app_id}", {"exe": res.get("exe"), "pid": res.get("pid")})
    return res


@router.get("/desktop/processes")
async def list_processes():
    """
    Return running processes (read-only snapshot).
    Returns top 50 by CPU usage. No kill or control operations.
    """
    procs = []
    for p in psutil.process_iter(["pid", "name", "cpu_percent", "memory_percent", "status"]):
        try:
            info = p.info
            procs.append({
                "pid": info["pid"],
                "name": info["name"],
                "cpu_pct": round(info["cpu_percent"] or 0, 1),
                "mem_pct": round(info["memory_percent"] or 0, 1),
                "status": info["status"],
            })
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            continue

    procs.sort(key=lambda x: x["cpu_pct"], reverse=True)
    return {"processes": procs[:50], "total": len(procs), "sampled_at": time.time()}
