"""
M4 — File browser router (read-only, approved folders only).
Endpoints:
  GET /api/files/roots          — list of allowed root folders
  GET /api/files/ls?path=...    — list directory contents
  GET /api/files/read?path=...  — read a text file (max 512 KB)
"""
from __future__ import annotations
import os, stat, mimetypes, logging
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from config import ALLOWED_ROOTS, BLOCKED_EXTENSIONS, MAX_FILE_READ_BYTES, MAX_DIR_ENTRIES
from utils.activity import log_activity

log = logging.getLogger(__name__)
router = APIRouter()


def _resolve_safe(path_str: str) -> Path:
    """Resolve a path and verify it's within an ALLOWED_ROOT. Raises 403 otherwise."""
    try:
        p = Path(path_str).resolve()
    except Exception:
        raise HTTPException(400, "Invalid path")

    for root in ALLOWED_ROOTS:
        try:
            p.relative_to(root.resolve())
            return p
        except ValueError:
            continue

    raise HTTPException(403, f"Path '{p}' is outside all allowed roots.")


class FileEntry(BaseModel):
    name: str
    path: str
    is_dir: bool
    size_bytes: Optional[int] = None
    modified: Optional[float] = None
    extension: Optional[str] = None
    readable: bool = True


@router.get("/files/roots")
async def list_roots():
    """Return the list of approved root folders the file browser can access."""
    return {
        "roots": [
            {"path": str(r), "name": r.name, "exists": r.exists()}
            for r in ALLOWED_ROOTS
        ]
    }


@router.get("/files/ls")
async def list_directory(path: str = Query(..., description="Absolute path to list")):
    """List contents of a directory within an approved root."""
    p = _resolve_safe(path)

    if not p.exists():
        raise HTTPException(404, f"Path does not exist: {p}")
    if not p.is_dir():
        raise HTTPException(400, "Path is not a directory")

    entries: list[FileEntry] = []
    try:
        items = sorted(p.iterdir(), key=lambda x: (not x.is_dir(), x.name.lower()))
        for item in items[:MAX_DIR_ENTRIES]:
            try:
                s = item.stat()
                entries.append(FileEntry(
                    name=item.name,
                    path=str(item),
                    is_dir=item.is_dir(),
                    size_bytes=s.st_size if item.is_file() else None,
                    modified=s.st_mtime,
                    extension=item.suffix.lower() if item.is_file() else None,
                    readable=item.suffix.lower() not in BLOCKED_EXTENSIONS,
                ))
            except (PermissionError, OSError):
                entries.append(FileEntry(
                    name=item.name,
                    path=str(item),
                    is_dir=item.is_dir(),
                    readable=False,
                ))
    except PermissionError:
        raise HTTPException(403, "Permission denied")

    await log_activity("files", "Directory listed", {"path": str(p), "count": len(entries)})

    return {
        "path": str(p),
        "entries": [e.model_dump() for e in entries],
        "truncated": len(list(p.iterdir())) > MAX_DIR_ENTRIES,
    }


@router.get("/files/read")
async def read_file(path: str = Query(..., description="Absolute path to read")):
    """Read a text file. Max 512 KB. Blocked extensions are refused."""
    p = _resolve_safe(path)

    if not p.exists():
        raise HTTPException(404, "File not found")
    if not p.is_file():
        raise HTTPException(400, "Path is not a file")
    if p.suffix.lower() in BLOCKED_EXTENSIONS:
        raise HTTPException(403, f"Reading '{p.suffix}' files is not allowed.")

    size = p.stat().st_size
    if size > MAX_FILE_READ_BYTES:
        raise HTTPException(413, f"File too large ({size} bytes). Max {MAX_FILE_READ_BYTES} bytes.")

    mime, _ = mimetypes.guess_type(str(p))
    is_binary = mime and not mime.startswith("text/") and mime not in (
        "application/json", "application/xml", "application/javascript",
    )

    if is_binary:
        raise HTTPException(415, "Binary files cannot be read as text.")

    try:
        content = p.read_text(encoding="utf-8", errors="replace")
    except PermissionError:
        raise HTTPException(403, "Permission denied")

    await log_activity("files", "File read", {"path": str(p), "bytes": size})

    return {
        "path": str(p),
        "name": p.name,
        "size_bytes": size,
        "mime": mime,
        "content": content,
    }
