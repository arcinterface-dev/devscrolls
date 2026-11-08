import type { NodePoint, GraphEdge } from './constants';

interface Point {
  x: number;
  y: number;
}

// Return orientation of ordered triplet (p, q, r)
// 0 -> Collinear
// 1 -> Clockwise
// 2 -> Counterclockwise
function orientation(p: Point, q: Point, r: Point): number {
  const val = (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y);
  if (Math.abs(val) < 1e-9) return 0;
  return val > 0 ? 1 : 2;
}

// Check if point q lies on segment pr
function onSegment(p: Point, q: Point, r: Point): boolean {
  return (
    q.x <= Math.max(p.x, r.x) &&
    q.x >= Math.min(p.x, r.x) &&
    q.y <= Math.max(p.y, r.y) &&
    q.y >= Math.min(p.y, r.y)
  );
}

// Check if segments p1-q1 and p2-q2 strictly intersect (sharing endpoints is NOT a crossing)
export function doSegmentsIntersect(p1: Point, q1: Point, p2: Point, q2: Point): boolean {
  // If they share an endpoint, they don't cross
  if (
    (p1.x === p2.x && p1.y === p2.y) ||
    (p1.x === q2.x && p1.y === q2.y) ||
    (q1.x === p2.x && q1.y === p2.y) ||
    (q1.x === q2.x && q1.y === q2.y)
  ) {
    return false;
  }

  const o1 = orientation(p1, q1, p2);
  const o2 = orientation(p1, q1, q2);
  const o3 = orientation(p2, q2, p1);
  const o4 = orientation(p2, q2, q1);

  // General case
  if (o1 !== o2 && o3 !== o4) {
    return true;
  }

  // Special Cases: collinear segments
  if (o1 === 0 && onSegment(p1, p2, q1)) return true;
  if (o2 === 0 && onSegment(p1, q2, q1)) return true;
  if (o3 === 0 && onSegment(p2, p1, q2)) return true;
  if (o4 === 0 && onSegment(p2, q1, q2)) return true;

  return false;
}

export function evaluateCrossings(
  nodes: NodePoint[],
  edges: GraphEdge[]
): { crossingCount: number; crossedEdgeIds: Set<string> } {
  const nodeMap = new Map<number, NodePoint>();
  nodes.forEach((n) => nodeMap.set(n.id, n));

  const crossedEdgeIds = new Set<string>();
  let count = 0;

  for (let i = 0; i < edges.length; i++) {
    const e1 = edges[i];
    const n1 = nodeMap.get(e1.from);
    const n2 = nodeMap.get(e1.to);
    if (!n1 || !n2) continue;

    for (let j = i + 1; j < edges.length; j++) {
      const e2 = edges[j];
      const n3 = nodeMap.get(e2.from);
      const n4 = nodeMap.get(e2.to);
      if (!n3 || !n4) continue;

      // Ignore edges that share a vertex
      if (e1.from === e2.from || e1.from === e2.to || e1.to === e2.from || e1.to === e2.to) {
        continue;
      }

      if (doSegmentsIntersect(n1, n2, n3, n4)) {
        count += 1;
        crossedEdgeIds.add(e1.id);
        crossedEdgeIds.add(e2.id);
      }
    }
  }

  return { crossingCount: count, crossedEdgeIds };
}
