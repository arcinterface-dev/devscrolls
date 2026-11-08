export interface ProcessConfig {
  name: string;
  baseRam: number;
}

export const PROCESS_NAMES = [
  'api-worker',
  'db-conn-pool',
  'cache-warmer',
  'log-rotate',
  'cron-scheduler',
  'auth-service',
  'webhook-dispatcher',
  'search-indexer',
  'session-gc',
  'metrics-agent',
  'kafka-consumer',
  'image-resizer',
];

export const INITIAL_SERVERS_COUNT = 3;
export const MAX_SERVERS_COUNT = 4;
export const TICK_INTERVAL_MS = 500;
export const SCALE_UP_DURATION_S = 30;
export const SCALE_UP_COOLDOWN_S = 60;
export const REBOOT_DURATION_S = 4;
export const CACHE_FLUSH_RAM_REDUCTION = 25;
export const CACHE_FLUSH_CPU_PENALTY = 20;

export const EVENT_TYPES = {
  MEMORY_LEAK: 'MEMORY_LEAK',
  DDOS_SPIKE: 'DDOS_SPIKE',
  DISK_WARNING: 'DISK_WARNING',
  CASCADING_FAILURE: 'CASCADING_FAILURE',
  NODE_REBOOTED: 'NODE_REBOOTED',
  PROCESS_KILLED: 'PROCESS_KILLED',
  SCALE_UP: 'SCALE_UP',
} as const;
