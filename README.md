# ZAID — Personal AI System
## Milestone 1: Dashboard UI Preview

---

> **What ZAID is:** A personal AI assistant for Windows, designed to run entirely locally. ZAID will eventually chat with you, control your desktop, manage files, read messages, automate tasks, and more — all running on your own hardware with no cloud dependency.

---

## Current Status — Milestone 1

**This is a UI preview only.** There is no backend, no AI engine, no system access, and no network connectivity in this milestone.

### What works:
- Full dashboard HUD with all panels
- Real browser clock (local time, updated every second)
- Navigation between 13 routes
- Accessible menu drawer (keyboard, Escape, focus trap)
- Bottom dock navigation
- Chat page (Enter sends, Shift+Enter newlines, local state only)
- Toast notifications

### What does NOT work:
- AI chat (no model connected — "AI engine not connected" notice appears instead of a fake reply)
- Voice input (microphone is disabled — no permission requested)
- System metrics (all demo placeholder values)
- Weather (no API, no geolocation)
- Network detection (demo values only)
- Storage readings (demo values — no disk access)
- All integrations (Unimplemented)
- All launcher items that are not navigation routes

**Nothing in this dashboard reads from or writes to your filesystem, registry, network, microphone, camera, or any external service.**

---

## Prerequisites

| Tool    | Version detected |
|---------|-----------------|
| Node.js | v24.12.0        |
| npm     | 11.6.2          |
| Python  | 3.12.10 (future milestone) |
| Ollama  | 0.40.5 (future milestone) |

---

## Installation & Running

```powershell
cd D:\ZAID\frontend
npm install
npm run dev
```

Open: **http://127.0.0.1:5173** (Vite binds to 127.0.0.1 — loopback only)

### All npm scripts

| Script              | Command           | Description                        |
|---------------------|-------------------|------------------------------------|
| `npm run dev`       | `vite`            | Dev server on 127.0.0.1:5173       |
| `npm run build`     | `tsc -b && vite build` | Production build to dist/      |
| `npm run preview`   | `vite preview`    | Preview production build locally   |
| `npm run lint`      | `eslint src ...`  | Lint all TypeScript/React files    |
| `npm run test`      | `vitest run`      | Run all tests once                 |
| `npm run typecheck` | `tsc --noEmit`    | Type-check without emitting        |

---

## Folder Structure

```
D:\ZAID\
├── frontend/                 ← Vite + React + TypeScript app (Milestone 1)
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/       ← Panel, StatusBadge, DemoBadge, EmptyState, ErrorBoundary
│   │   │   ├── hud/          ← CoreOrb, RadialGauge, Sparkline, ProgressBar, WaveformStatic
│   │   │   ├── layout/       ← AppShell, TopBar, MenuDrawer, QuickLaunchRail, BottomDock, Toast
│   │   │   └── panels/       ← All dashboard panels
│   │   ├── data/
│   │   │   └── demo.ts       ← ALL fabricated values (must be labelled DEMO DATA in UI)
│   │   ├── pages/            ← One file per route
│   │   ├── styles/
│   │   │   ├── tokens.css    ← All CSS design tokens
│   │   │   └── global.css    ← Global reset and utilities
│   │   ├── test/             ← Vitest test suite
│   │   └── types/
│   │       └── index.ts      ← Shared TypeScript types
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
├── backend/                  ← Reserved for Milestone 2 (FastAPI + Ollama)
├── docs/reference/           ← Reference images (not committed)
├── shared/                   ← Reserved for shared utilities
├── config/                   ← Reserved for configuration
├── scripts/                  ← Reserved for build scripts
└── README.md
```

---

## DEMO DATA Policy

Every number, status, or list item that is not real:
1. Is defined in `src/data/demo.ts` — nowhere else
2. Is visibly labelled **DEMO DATA** in the UI using the `<DemoBadge>` component
3. No disk reads, no API calls, no geolocation — zero network activity at runtime

To toggle demo data panels to empty state, set `SHOW_DEMO_DATA = false` in `src/data/demo.ts`. There is no UI toggle.

---

## Roadmap

| Milestone | Scope |
|-----------|-------|
| **1 (Current)** | Dashboard UI — complete |
| **2** | Local Ollama chat — FastAPI backend + `qwen3.5:4b` streaming |
| **3** | File browsing (read-only, approved folders) |
| **4** | Desktop control (approved apps, user confirmation) |
| **5** | Voice input (Whisper/local STT) |
| **6** | Integrations (Google, GitHub, etc.) |
| **7** | Automation workflows |
| **8** | Memory and persistent context |

---

## Security Note

Milestone 1 makes **zero network requests** at runtime. The Vite dev server binds to `127.0.0.1` (loopback only). No external scripts, fonts, or CDN assets are loaded.
