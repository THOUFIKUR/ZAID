"""
ZAID Local Tools MCP Server
A high-performance local MCP server exposing approved system utilities to ZAID.
Uses MCP 2.x standard stdio transport.
"""
from __future__ import annotations
import os
import sys
import platform
import psutil
from pathlib import Path
from mcp.server.mcpserver import MCPServer

# Initialize MCP Server
server = MCPServer("zaid-local-tools")

@server.tool()
def get_system_summary() -> dict:
    """Get current Windows system specs, CPU load, memory usage, and battery status."""
    mem = psutil.virtual_memory()
    battery = psutil.sensors_battery()
    return {
        "os": f"{platform.system()} {platform.release()} (v{platform.version()})",
        "processor": platform.processor(),
        "cpu_count_logical": psutil.cpu_count(logical=True),
        "cpu_percent": psutil.cpu_percent(interval=0.1),
        "memory_total_gb": round(mem.total / (1024 ** 3), 2),
        "memory_used_gb": round(mem.used / (1024 ** 3), 2),
        "memory_percent": mem.percent,
        "battery_plugged": battery.power_plugged if battery else None,
        "battery_percent": battery.percent if battery else None,
    }

@server.tool()
def evaluate_math(expression: str) -> dict:
    """
    Safely evaluate a mathematical expression.
    Examples: '45 * 12 + 100', 'sqrt(144) + 2^3', '1024 * 768'.
    """
    import math
    # Safe namespace
    allowed = {
        "abs": abs, "round": round, "min": min, "max": max,
        "sum": sum, "pow": pow, "sqrt": math.sqrt, "sin": math.sin,
        "cos": math.cos, "tan": math.tan, "log": math.log, "pi": math.pi, "e": math.e
    }
    cleaned = expression.replace("^", "**")
    try:
        # Use simpleeval if available, otherwise limited eval with safe dict
        try:
            from simpleeval import simple_eval
            res = simple_eval(cleaned)
        except ImportError:
            res = eval(cleaned, {"__builtins__": None}, allowed)
        return {"expression": expression, "result": res, "success": True}
    except Exception as err:
        return {"expression": expression, "error": str(err), "success": False}

@server.tool()
def read_or_append_scratchpad(text_to_append: str = "") -> dict:
    """Read current quick notes, or append a new timestamped note."""
    import time
    scratch_dir = Path("D:/ZAID/config")
    scratch_dir.mkdir(parents=True, exist_ok=True)
    scratch_file = scratch_dir / "quick_notes.txt"
    
    if text_to_append.strip():
        timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
        entry = f"[{timestamp}] {text_to_append.strip()}\n"
        with open(scratch_file, "a", encoding="utf-8") as f:
            f.write(entry)
            
    content = ""
    if scratch_file.exists():
        content = scratch_file.read_text(encoding="utf-8")
        
    return {
        "file": str(scratch_file),
        "notes": content,
        "total_lines": len(content.splitlines()) if content else 0
    }

@server.tool()
def list_running_app_windows() -> list[dict]:
    """List major active window processes on the local Windows machine."""
    major_apps = []
    for proc in psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_percent']):
        try:
            name = proc.info['name']
            if name.lower().endswith('.exe') and name.lower() not in ('system', 'registry', 'smss.exe', 'csrss.exe'):
                major_apps.append({
                    "pid": proc.info['pid'],
                    "name": name,
                    "cpu_percent": proc.info['cpu_percent'],
                    "memory_percent": round(proc.info['memory_percent'] or 0, 2)
                })
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            continue
    # Sort by memory percent descending and return top 20
    major_apps.sort(key=lambda x: x['memory_percent'], reverse=True)
    return major_apps[:20]

if __name__ == "__main__":
    server.run(transport="stdio")
