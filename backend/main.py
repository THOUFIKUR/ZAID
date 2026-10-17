"""
ZAID Backend — FastAPI application entry point.
Run: uvicorn main:app --host 127.0.0.1 --port 8000 --reload

All endpoints are under /api/*
CORS is restricted to the Vite dev server (127.0.0.1:5173) and production preview (127.0.0.1:4173).
"""
from __future__ import annotations
import logging, time
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from routers import chat, system, files, desktop, memory, activity, integrations
from config import SERVER_HOST, SERVER_PORT, OLLAMA_MODEL, MEMORY_FILE, ACTIVITY_FILE

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
log = logging.getLogger("zaid")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure data files exist on startup
    for f in (MEMORY_FILE, ACTIVITY_FILE):
        if not f.exists():
            f.write_text("[]", encoding="utf-8")
    log.info(f"ZAID backend started — model: {OLLAMA_MODEL}")
    yield
    log.info("ZAID backend shutting down")


app = FastAPI(
    title="ZAID Backend API",
    description="Local-only API for ZAID personal AI assistant. Binds to 127.0.0.1 only.",
    version="2.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    lifespan=lifespan,
)

# CORS — allow only the Vite dev and preview servers (loopback only)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5173",
        "http://localhost:5173",
        "http://127.0.0.1:4173",
        "http://localhost:4173",
    ],
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Accept"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(chat.router,         prefix="/api", tags=["Chat (M2)"])
app.include_router(system.router,       prefix="/api", tags=["System (M3)"])
app.include_router(files.router,        prefix="/api", tags=["Files (M4)"])
app.include_router(desktop.router,      prefix="/api", tags=["Desktop (M5)"])
app.include_router(memory.router,       prefix="/api", tags=["Memory (M8)"])
app.include_router(activity.router,     prefix="/api", tags=["Activity (M8)"])
app.include_router(integrations.router, prefix="/api", tags=["Integrations & MCP"])


# ── Health ────────────────────────────────────────────────────────────────────
@app.get("/api/health", tags=["Health"])
async def health():
    return {
        "status": "ok",
        "service": "ZAID Backend",
        "version": "2.0.0",
        "model": OLLAMA_MODEL,
        "timestamp": time.time(),
    }


@app.get("/", include_in_schema=False)
async def root():
    return JSONResponse({"detail": "ZAID API — use /api/* endpoints. Docs at /api/docs"})


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=SERVER_HOST,
        port=SERVER_PORT,
        reload=True,
        log_level="info",
    )
