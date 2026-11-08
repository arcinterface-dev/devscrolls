import type { NodePoint, GraphEdge } from './constants';
import { BRANCH_NAMES, BRANCH_COLORS } from './constants';
import { evaluateCrossings } from './IntersectionEngine';

export interface LevelData {
  level: number;
  nodes: NodePoint[];
  edges: GraphEdge[];
  initialCrossings: number;
  parMoves: number;
}

function generateHash(): string {
  return Math.random().toString(16).substring(2, 9);
}

export function generateLevel(level: number, canvasWidth: number, canvasHeight: number): LevelData {
  const nodeCount = Math.min(18, 5 + level);
  const padding = 60;
  const usableWidth = Math.max(300, canvasWidth - padding * 2);
  const usableHeight = Math.max(300, canvasHeight - padding * 2);

  // Step 1: Generate nodes
  const nodes: NodePoint[] = [];
  for (let i = 0; i < nodeCount; i++) {
    const branchIndex = i % BRANCH_NAMES.length;
    nodes.push({
      id: i,
      x: 0,
      y: 0,
      hash: generateHash(),
      branch: BRANCH_NAMES[branchIndex],
      color: BRANCH_COLORS[branchIndex % BRANCH_COLORS.length],
    });
  }

  // Step 2: Generate planar base edges (ring + interior chords)
  const edges: GraphEdge[] = [];
  const edgeSet = new Set<string>();

  const addEdge = (u: number, v: number) => {
    if (u === v) return;
    const a = Math.min(u, v);
    const b = Math.max(u, v);
    const key = `${a}-${b}`;
    if (!edgeSet.has(key)) {
      edgeSet.add(key);
      edges.push({ id: `e-${edges.length}`, from: a, to: b });
    }
  };

  // Outer ring guarantees connectedness
  for (let i = 0; i < nodeCount; i++) {
    addEdge(i, (i + 1) % nodeCount);
  }

  // Add planar cross chords
  const desiredEdges = Math.floor(nodeCount * 1.35);
  let attempts = 0;
  while (edges.length < desiredEdges && attempts < 100) {
    attempts += 1;
    const u = Math.floor(Math.random() * nodeCount);
    const v = (u + 2 + Math.floor(Math.random() * (nodeCount - 4))) % nodeCount;
    addEdge(u, v);
  }

  // Step 3: Scramble positions until we have minimum crossings
  const minCrossings = Math.max(2, Math.floor(nodeCount * 0.7));
  let bestCrossings = 0;

  for (let scrambleTry = 0; scrambleTry < 40; scrambleTry++) {
    // Distribute nodes randomly within bounds
    nodes.forEach((node) => {
      node.x = padding + Math.random() * usableWidth;
      node.y = padding + Math.random() * usableHeight;
    });

    const { crossingCount } = evaluateCrossings(nodes, edges);
    if (crossingCount >= minCrossings) {
      bestCrossings = crossingCount;
      break;
    }
    if (crossingCount > bestCrossings) {
      bestCrossings = crossingCount;
    }
  }

  const parMoves = Math.max(3, Math.ceil(bestCrossings * 0.6));

  return {
    level,
    nodes,
    edges,
    initialCrossings: bestCrossings,
    parMoves,
  };
}
