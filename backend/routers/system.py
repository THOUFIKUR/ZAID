"""
M3 — System metrics router.
Endpoint: GET /api/system  →  JSON with real CPU/RAM/disk/network data via psutil.
"""
from __future__ import annotations
import time
import logging

import psutil
from fastapi import APIRouter

log = logging.getLogger(__name__)
router = APIRouter()

_net_prev: dict = {}
_net_prev_time: float = 0.0


def _net_speed() -> dict:
    """Calculate network speed by comparing with previous sample."""
    global _net_prev, _net_prev_time

    now = time.monotonic()
    counters = psutil.net_io_counters()

    if _net_prev and (now - _net_prev_time) > 0:
        dt = now - _net_prev_time
        dl = (counters.bytes_recv - _net_prev.get("bytes_recv", 0)) / dt
        ul = (counters.bytes_sent - _net_prev.get("bytes_sent", 0)) / dt
    else:
        dl = ul = 0.0

    _net_prev = {"bytes_recv": counters.bytes_recv, "bytes_sent": counters.bytes_sent}
    _net_prev_time = now

    def fmt(bps: float) -> str:
        if bps >= 1_000_000:
            return f"{bps/1_000_000:.1f} MB/s"
        if bps >= 1_000:
            return f"{bps/1_000:.1f} KB/s"
        return f"{bps:.0f} B/s"

    return {"download": fmt(dl), "upload": fmt(ul), "download_bps": round(dl), "upload_bps": round(ul)}


def _disk_info() -> list[dict]:
    results = []
    try:
        partitions = psutil.disk_partitions(all=False)
        for p in partitions:
            try:
                usage = psutil.disk_usage(p.mountpoint)
                results.append({
                    "device": p.device,
                    "mountpoint": p.mountpoint,
                    "total_gb": round(usage.total / 1e9, 1),
                    "used_gb": round(usage.used / 1e9, 1),
                    "free_gb": round(usage.free / 1e9, 1),
                    "percent": round(usage.percent, 1),
                    "fstype": p.fstype,
                })
            except (PermissionError, OSError):
                continue
    except Exception:
        pass
    return results


def _gpu_info() -> dict | None:
    """Try to get GPU info; return None if unavailable (no hard dependency)."""
    try:
        import subprocess, json as _json, re
        result = subprocess.run(
            ["nvidia-smi", "--query-gpu=name,utilization.gpu,memory.used,memory.total,temperature.gpu",
             "--format=csv,noheader,nounits"],
            capture_output=True, text=True, timeout=3
        )
        if result.returncode == 0 and result.stdout.strip():
            parts = [p.strip() for p in result.stdout.strip().split(",")]
            if len(parts) >= 5:
                return {
                    "name": parts[0],
                    "utilization_pct": float(parts[1]),
                    "memory_used_mb": float(parts[2]),
                    "memory_total_mb": float(parts[3]),
                    "temperature_c": float(parts[4]),
                    "source": "nvidia-smi",
                }
    except Exception:
        pass
    return None


def _cpu_temp() -> float | None:
    """Get CPU temperature if available."""
    try:
        temps = psutil.sensors_temperatures()
        for key in ("coretemp", "k10temp", "cpu_thermal", "acpitz"):
            if key in temps and temps[key]:
                return round(temps[key][0].current, 1)
    except Exception:
        pass
    return None


@router.get("/system")
async def get_system_metrics():
    """
    Returns real system metrics sampled at call time.
    All values are live from the local machine — no fabrication.
    """
    cpu_pct = psutil.cpu_percent(interval=0.2)
    cpu_freq = psutil.cpu_freq()
    mem = psutil.virtual_memory()
    net = _net_speed()
    battery = psutil.sensors_battery()

    # Network interface info
    addrs = psutil.net_if_addrs()
    net_if_stats = psutil.net_if_stats()
    active_iface = None
    local_ip = None
    for iface, stats in net_if_stats.items():
        if stats.isup and iface.lower() not in ("lo", "loopback"):
            if iface in addrs:
                for addr in addrs[iface]:
                    if addr.family == 2:  # AF_INET
                        local_ip = addr.address
                        active_iface = iface
                        break
            if active_iface:
                break

    return {
        "cpu": {
            "percent": round(cpu_pct, 1),
            "freq_ghz": round(cpu_freq.current / 1000, 2) if cpu_freq else None,
            "freq_max_ghz": round(cpu_freq.max / 1000, 2) if cpu_freq else None,
            "cores_logical": psutil.cpu_count(logical=True),
            "cores_physical": psutil.cpu_count(logical=False),
            "temperature_c": _cpu_temp(),
        },
        "memory": {
            "total_gb": round(mem.total / 1e9, 1),
            "used_gb": round(mem.used / 1e9, 1),
            "available_gb": round(mem.available / 1e9, 1),
            "percent": round(mem.percent, 1),
        },
        "disk": _disk_info(),
        "network": {
            "iface": active_iface,
            "ip": local_ip,
            **net,
        },
        "battery": {
            "percent": round(battery.percent, 1) if battery else None,
            "plugged": battery.power_plugged if battery else None,
            "secs_left": battery.secsleft if battery else None,
        } if battery else None,
        "gpu": _gpu_info(),
        "sampled_at": time.time(),
    }
