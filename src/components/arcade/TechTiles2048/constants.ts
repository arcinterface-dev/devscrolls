export interface TileMeta {
  value: number;
  label: string;
  bg: string;
  color: string;
  glow?: string;
  emoji: string;
}

export const TILE_THEMES: Record<number, TileMeta> = {
  2: { value: 2, label: 'Punch Card', bg: '#fef3c7', color: '#78350f', emoji: '⬜' },
  4: { value: 4, label: 'Floppy Disk', bg: '#fde68a', color: '#78350f', emoji: '🟨' },
  8: { value: 8, label: 'Dial-up', bg: '#fcd34d', color: '#78350f', emoji: '🟧' },
  16: { value: 16, label: 'CRT Monitor', bg: '#fbbf24', color: '#78350f', emoji: '🟧' },
  32: { value: 32, label: 'Server Rack', bg: '#f59e0b', color: '#ffffff', emoji: '🟧' },
  64: { value: 64, label: 'Ethernet', bg: '#d97706', color: '#ffffff', emoji: '🟧' },
  128: { value: 128, label: 'WiFi Router', bg: '#b45309', color: '#ffffff', emoji: '🟫' },
  256: { value: 256, label: 'Smartphone', bg: '#92400e', color: '#ffffff', emoji: '🟫' },
  512: { value: 512, label: 'Cloud VM', bg: '#3b82f6', color: '#ffffff', glow: '0 0 14px rgba(59, 130, 246, 0.6)', emoji: '🟦' },
  1024: { value: 1024, label: 'Container', bg: '#8b5cf6', color: '#ffffff', glow: '0 0 18px rgba(139, 92, 246, 0.7)', emoji: '🟪' },
  2048: { value: 2048, label: 'Quantum AI', bg: '#ec4899', color: '#ffffff', glow: '0 0 24px rgba(236, 72, 153, 0.9)', emoji: '✨' },
  4096: { value: 4096, label: 'Singularity', bg: '#ef4444', color: '#ffffff', glow: '0 0 30px rgba(239, 68, 68, 1)', emoji: '🔥' },
};

export const DEFAULT_TILE_META: TileMeta = {
  value: 0,
  label: '',
  bg: '#1e293b',
  color: '#94a3b8',
  emoji: '⬛',
};
