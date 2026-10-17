"""
ZAID Backend Configuration
All tuneable values live here — never hard-coded in routers.
"""
import os
from pathlib import Path

# ── Ollama ────────────────────────────────────────────────────────────────────
OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434")
OLLAMA_MODEL: str    = os.getenv("OLLAMA_MODEL", "qwen3.5:4b")
OLLAMA_TIMEOUT: int  = int(os.getenv("OLLAMA_TIMEOUT", "120"))  # seconds

# System prompt — keep concise so context window is not wasted
SYSTEM_PROMPT: str = (
    "You are ZAID, a helpful personal AI assistant running locally on Windows. "
    "You are private, fast, and run entirely on the user's machine with no cloud access. "
    "Be concise, helpful, and honest. If you don't know something, say so."
)

# ── File browser ──────────────────────────────────────────────────────────────
_home = Path.home()

# Allowed root folders the file browser may access.
# Never includes system dirs, registry, or anything outside these roots.
ALLOWED_ROOTS: list[Path] = [
    p for p in [
        _home / "Documents",
        _home / "Downloads",
        _home / "Desktop",
        _home / "Pictures",
        _home / "Music",
        _home / "Videos",
        Path("D:/ZAID"),                  # project folder itself
    ]
    if p.exists()
]

# Extensions the file browser will NOT open/read (security)
BLOCKED_EXTENSIONS: set[str] = {
    ".exe", ".bat", ".cmd", ".ps1", ".vbs", ".lnk",
    ".dll", ".sys", ".drv", ".reg",
}

MAX_FILE_READ_BYTES: int = 512_000   # 512 KB max for reading text files
MAX_DIR_ENTRIES: int     = 500       # max items returned per directory listing

# ── App launcher (approved list only) ─────────────────────────────────────────
APPROVED_APPS: dict[str, str] = {
    "notepad":      "notepad.exe",
    "calculator":   "calc.exe",
    "explorer":     "explorer.exe",
    "paint":        "mspaint.exe",
    "wordpad":      "wordpad.exe",
    "terminal":     r"C:\Windows\System32\cmd.exe",
    "powershell":   r"C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe",
    "vscode":       r"C:\Users\thouf\AppData\Local\Programs\Microsoft VS Code\Code.exe",
    "chrome":       r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    "firefox":      r"C:\Program Files\Mozilla Firefox\firefox.exe",
    "edge":         r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
}

# ── Memory store ──────────────────────────────────────────────────────────────
MEMORY_FILE: Path = Path(__file__).parent / "memory_store.json"

# ── Activity log ──────────────────────────────────────────────────────────────
ACTIVITY_FILE: Path = Path(__file__).parent / "activity_log.json"
MAX_ACTIVITY_ENTRIES: int = 500

# ── Server ────────────────────────────────────────────────────────────────────
SERVER_HOST: str = "127.0.0.1"   # loopback ONLY
SERVER_PORT: int = 8000
