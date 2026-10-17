// ============================================================
// ZAID Shared Types — src/types/index.ts
// ============================================================

export type StatusVariant =
  | 'connected'
  | 'disconnected'
  | 'unavailable'
  | 'demo'
  | 'unimplemented';

export interface NavItem {
  label: string;
  path: string;
}

export interface QuickLaunchItem {
  id: string;
  label: string;
  path?: string;   // if present, navigate; otherwise show toast
  icon: string;    // SVG path data or key
}

export interface IntegrationItem {
  id: string;
  label: string;
  status: StatusVariant;
}

export interface DemoGauge {
  label: string;
  value: number;      // 0-100
  unit: string;
  color: string;      // CSS var token name
}

export interface DemoStorageItem {
  label: string;
  used: number;       // GB
  total: number;      // GB
  color: string;
}

export interface DemoNetworkItem {
  ssid: string;
  ip: string;
  download: string;
  upload: string;
  signal: number;     // 0-100
}

export interface DemoTask {
  id: string;
  label: string;
  progress: number;
}

export interface DemoEvent {
  id: string;
  title: string;
  time: string;
  tag: string;
}

export interface DemoActivity {
  id: string;
  text: string;
  time: string;
  type: 'info' | 'warn' | 'ok';
}

export interface ToastItem {
  id: string;
  message: string;
  variant?: 'info' | 'warn' | 'error';
}

// Chat types
export type ChatRole = 'user' | 'assistant' | 'system-notice';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  timestamp: number;
}

// API types
export type BackendStatus = 'checking' | 'online' | 'offline' | 'error';
export type ModelStatus   = 'checking' | 'ready' | 'missing' | 'unavailable';
