// ============================================================
// ZAID Demo Data — src/data/demo.ts
// ALL values here are fictional/placeholder.
// Every value from this file MUST be labelled "DEMO DATA" in the UI.
// Setting SHOW_DEMO_DATA to false renders EmptyState for panels
// that would otherwise show sample entries.
// ============================================================

import type {
  DemoGauge,
  DemoStorageItem,
  DemoNetworkItem,
  DemoTask,
  DemoEvent,
  DemoActivity,
} from '../types';

/** Toggle demo data display (no UI toggle — change this constant only). */
export const SHOW_DEMO_DATA = true;

// ── System Status gauges ─────────────────────────────────────
export const DEMO_GAUGES: DemoGauge[] = [
  { label: 'CPU',     value: 42, unit: '%',  color: 'var(--orange)' },
  { label: 'RAM',     value: 67, unit: '%',  color: 'var(--amber)' },
  { label: 'TEMP',    value: 58, unit: '°C', color: 'var(--red)' },
  { label: 'BATTERY', value: 83, unit: '%',  color: 'var(--cyan)' },
];

export const DEMO_CPU_CLOCK   = '3.6 GHz';
export const DEMO_RAM_USAGE   = '10.7 / 16 GB';
export const DEMO_CPU_TEMP    = '58°C';
export const DEMO_GPU_USAGE   = '12%';

// Sample sparkline data (arbitrary shape — not real CPU history)
export const DEMO_SPARKLINE_DATA: number[] = [
  20, 35, 28, 55, 40, 62, 45, 70, 52, 38, 48, 60, 42, 55, 38, 50, 44, 58, 36, 42,
];

// ── Storage ──────────────────────────────────────────────────
export const DEMO_STORAGE: DemoStorageItem[] = [
  { label: 'Windows (C:)',         used: 78,  total: 120, color: 'var(--orange)' },
  { label: 'Data (D:)',            used: 210, total: 500, color: 'var(--amber)' },
  { label: 'Ollama Models (D:)',   used: 12,  total: 100, color: 'var(--cyan)' },
];

// ── Network ──────────────────────────────────────────────────
export const DEMO_NETWORK: DemoNetworkItem = {
  ssid:     'HomeNetwork_5G',
  ip:       '192.168.x.x',
  download: '85 Mbps',
  upload:   '22 Mbps',
  signal:   78,
};

export const DEMO_NETWORK_SPARKLINE: number[] = [
  40, 55, 70, 65, 80, 72, 85, 90, 82, 75, 88, 92, 85, 78, 82, 88, 85, 91, 84, 86,
];

// ── Weather (placeholder — no API call, no geolocation) ──────
export const DEMO_WEATHER = {
  location:    'Your City',
  temperature: '28°C',
  condition:   'Partly Cloudy',
  humidity:    '72%',
  wind:        '14 km/h NE',
};

// ── Active Tasks ─────────────────────────────────────────────
export const DEMO_TASKS: DemoTask[] = [
  { id: 't1', label: 'Sample Task Alpha',   progress: 72 },
  { id: 't2', label: 'Sample Task Beta',    progress: 45 },
  { id: 't3', label: 'Sample Task Gamma',   progress: 91 },
  { id: 't4', label: 'Sample Task Delta',   progress: 18 },
];

// ── Upcoming Events ──────────────────────────────────────────
export const DEMO_EVENTS: DemoEvent[] = [
  { id: 'e1', title: 'Team Standup',         time: '09:00 AM', tag: 'Meeting' },
  { id: 'e2', title: 'Project Review',       time: '11:30 AM', tag: 'Work' },
  { id: 'e3', title: 'Lunch Break',          time: '01:00 PM', tag: 'Personal' },
  { id: 'e4', title: 'Code Review Session',  time: '03:00 PM', tag: 'Dev' },
  { id: 'e5', title: 'Evening Walk',         time: '06:30 PM', tag: 'Health' },
];

// ── Recent Activity ───────────────────────────────────────────
export const DEMO_ACTIVITY: DemoActivity[] = [
  { id: 'a1', text: 'Dashboard opened',            time: 'Just now',  type: 'info' },
  { id: 'a2', text: 'Sample file processed',       time: '2 min ago', type: 'ok'   },
  { id: 'a3', text: 'Demo mode active',            time: '5 min ago', type: 'info' },
  { id: 'a4', text: 'Settings loaded (defaults)',  time: '8 min ago', type: 'info' },
  { id: 'a5', text: 'System check — demo values',  time: '10 min ago',type: 'warn' },
];

// ── Integrations ─────────────────────────────────────────────
export const INTEGRATIONS = [
  { id: 'google',     label: 'Google'      },
  { id: 'gmail',      label: 'Gmail'       },
  { id: 'outlook',    label: 'Outlook'     },
  { id: 'calendar',   label: 'Calendar'    },
  { id: 'whatsapp',   label: 'WhatsApp'    },
  { id: 'instagram',  label: 'Instagram'   },
  { id: 'youtube',    label: 'YouTube'     },
  { id: 'github',     label: 'GitHub'      },
  { id: 'canva',      label: 'Canva'       },
  { id: 'cloud',      label: 'Cloud Drive' },
  { id: 'custom-api', label: 'Custom API'  },
  { id: 'mcp',        label: 'MCP Servers' },
] as const;

// ── Local AI Model (display only — status comes from backend API) ─
export const MODEL_NAME = 'qwen3.5:4b';
export const MODEL_NOTE = 'Configured target (not verified)';
