import React, { useEffect, useRef, useState, useCallback } from 'react';
import type { NodePoint, GraphEdge } from './constants';
import { NODE_RADIUS, HIT_RADIUS } from './constants';
import { evaluateCrossings } from './IntersectionEngine';

interface GraphCanvasProps {
  nodes: NodePoint[];
  edges: GraphEdge[];
  onCrossingsUpdate: (crossings: number) => void;
  onMoveComplete: () => void;
  onVictory: () => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  alpha: number;
  size: number;
}

export const GraphCanvas: React.FC<GraphCanvasProps> = ({
  nodes,
  edges,
  onCrossingsUpdate,
  onMoveComplete,
  onVictory,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const draggedNodeIdRef = useRef<number | null>(null);
  const hasMovedSinceDownRef = useRef(false);
  const isWonRef = useRef(false);

  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number>(0);

  // Trigger victory confetti burst
  const triggerVictoryParticles = useCallback((cx: number, cy: number) => {
    const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#ffffff'];
    const pList: Particle[] = [];
    for (let i = 0; i < 48; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 6;
      pList.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        size: 3 + Math.random() * 4,
      });
    }
    particlesRef.current = pList;
  }, []);

  // Main Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isRunning = true;

    const render = () => {
      if (!isRunning) return;

      const dpr = window.devicePixelRatio || 1;
      const width = canvas.width / dpr;
      const height = canvas.height / dpr;

      ctx.clearRect(0, 0, width, height);

      // Evaluate crossings
      const { crossingCount, crossedEdgeIds } = evaluateCrossings(nodes, edges);

      // 1. Draw Edges
      edges.forEach((edge) => {
        const n1 = nodes.find((n) => n.id === edge.from);
        const n2 = nodes.find((n) => n.id === edge.to);
        if (!n1 || !n2) return;

        const isCrossed = crossedEdgeIds.has(edge.id);

        ctx.beginPath();
        ctx.moveTo(n1.x, n1.y);
        ctx.lineTo(n2.x, n2.y);
        ctx.lineWidth = isCrossed ? 2.5 : 3;

        if (isCrossed) {
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.75)'; // Red
          ctx.setLineDash([6, 6]);
        } else {
          ctx.strokeStyle = 'rgba(16, 185, 129, 0.85)'; // Green
          ctx.setLineDash([]);
        }

        ctx.stroke();
        ctx.setLineDash([]);
      });

      // 2. Draw Nodes
      nodes.forEach((node) => {
        const isDragged = draggedNodeIdRef.current === node.id;

        // Node Glow / Shadow
        ctx.save();
        ctx.shadowColor = isDragged ? node.color : 'rgba(0, 0, 0, 0.4)';
        ctx.shadowBlur = isDragged ? 20 : 8;

        // Node Circle
        ctx.beginPath();
        ctx.arc(node.x, node.y, isDragged ? NODE_RADIUS + 3 : NODE_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = node.color;
        ctx.fill();

        // White border
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();
        ctx.restore();

        // Node Hash label
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(node.hash.slice(0, 5), node.x, node.y);

        // Branch Tag near leaf or key node
        if (node.id % 3 === 0) {
          ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
          ctx.font = '600 9px sans-serif';
          const text = node.branch;
          const textWidth = ctx.measureText(text).width;
          const bx = node.x - textWidth / 2 - 4;
          const by = node.y - NODE_RADIUS - 16;

          ctx.beginPath();
          ctx.roundRect(bx, by, textWidth + 8, 14, 3);
          ctx.fill();

          ctx.fillStyle = '#94a3b8';
          ctx.fillText(text, node.x, by + 7);
        }
      });

      // 3. Render Particles (if won)
      if (particlesRef.current.length > 0) {
        particlesRef.current.forEach((p) => {
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.12; // gravity
          p.alpha -= 0.015;

          ctx.save();
          ctx.globalAlpha = Math.max(0, p.alpha);
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        });

        particlesRef.current = particlesRef.current.filter((p) => p.alpha > 0);
      }

      // Check win condition
      if (crossingCount === 0 && !isWonRef.current && nodes.length > 0) {
        isWonRef.current = true;
        triggerVictoryParticles(width / 2, height / 2);
        onVictory();
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      isRunning = false;
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [nodes, edges, onVictory, triggerVictoryParticles]);

  // Sync canvas size with DPR
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
    }
  }, []);

  useEffect(() => {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    isWonRef.current = false;
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [resizeCanvas]);

  // Pointer Interaction Handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isWonRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    // Find clicked node
    for (let i = nodes.length - 1; i >= 0; i--) {
      const n = nodes[i];
      const dist = Math.hypot(n.x - px, n.y - py);
      if (dist <= HIT_RADIUS) {
        draggedNodeIdRef.current = n.id;
        hasMovedSinceDownRef.current = false;
        canvas.setPointerCapture(e.pointerId);
        break;
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const draggedId = draggedNodeIdRef.current;
    if (draggedId === null) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const px = Math.max(NODE_RADIUS, Math.min(rect.width - NODE_RADIUS, e.clientX - rect.left));
    const py = Math.max(NODE_RADIUS, Math.min(rect.height - NODE_RADIUS, e.clientY - rect.top));

    const node = nodes.find((n) => n.id === draggedId);
    if (node) {
      node.x = px;
      node.y = py;
      hasMovedSinceDownRef.current = true;

      // Recount crossings
      const { crossingCount } = evaluateCrossings(nodes, edges);
      onCrossingsUpdate(crossingCount);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (draggedNodeIdRef.current !== null) {
      if (hasMovedSinceDownRef.current) {
        onMoveComplete();
      }
      draggedNodeIdRef.current = null;
      try {
        canvasRef.current?.releasePointerCapture(e.pointerId);
      } catch {}

      // Final recount
      const { crossingCount } = evaluateCrossings(nodes, edges);
      onCrossingsUpdate(crossingCount);
    }
  };

  return (
    <div className="graph-canvas-container" ref={containerRef}>
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="graph-canvas"
      />

      <style>{`
        .graph-canvas-container {
          width: 100%;
          height: 100%;
          min-height: 480px;
          background: #090e1a;
          border: 1px solid #1e293b;
          border-radius: var(--radius-lg);
          position: relative;
          overflow: hidden;
          touch-action: none;
          box-shadow: inset 0 0 40px rgba(0, 0, 0, 0.4);
        }

        .graph-canvas {
          display: block;
          width: 100%;
          height: 100%;
          cursor: grab;
        }

        .graph-canvas:active {
          cursor: grabbing;
        }
      `}</style>
    </div>
  );
};
