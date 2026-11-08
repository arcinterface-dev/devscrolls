export interface NodePoint {
  id: number;
  x: number;
  y: number;
  hash: string;
  branch: string;
  color: string;
}

export interface GraphEdge {
  id: string;
  from: number;
  to: number;
  isCrossed?: boolean;
}

export const BRANCH_NAMES = [
  'main',
  'feat/auth',
  'feat/ai',
  'fix/cors',
  'refactor/db',
  'feat/cache',
  'hotfix/500',
  'feat/search',
];

export const BRANCH_COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#ec4899', // pink
  '#8b5cf6', // purple
  '#06b6d4', // cyan
];

export const NODE_RADIUS = 22;
export const HIT_RADIUS = 30;
