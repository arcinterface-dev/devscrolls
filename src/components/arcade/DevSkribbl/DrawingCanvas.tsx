import React, { useEffect, useRef, useCallback, useState } from 'react';

export type DrawingTool =
  | 'pencil'
  | 'eraser'
  | 'bucket'
  | 'line'
  | 'rectangle'
  | 'filled_rectangle'
  | 'circle'
  | 'filled_circle';

export interface StrokeData {
  id: string;
  tool: DrawingTool;
  color: string;
  size: number;
  points: [number, number][]; // points[0] is start, points[last] is end
}

interface DrawingCanvasProps {
  isArtist: boolean;
  currentColor: string;
  currentBrushSize: number;
  currentTool: DrawingTool;
  canvasBgColor?: string;
  strokes: StrokeData[];
  onStrokeCompleted: (stroke: StrokeData) => void;
}

// Convert Hex to 32-bit Little-Endian RGBA (0xAABBGGRR)
function hexToRgba32(hex: string): number {
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map((x) => x + x).join('');
  const r = parseInt(c.substring(0, 2), 16) || 0;
  const g = parseInt(c.substring(2, 4), 16) || 0;
  const b = parseInt(c.substring(4, 6), 16) || 0;
  return (255 << 24) | (b << 16) | (g << 8) | r;
}

// High-speed 32-bit BFS Flood Fill
function executeFloodFill(
  ctx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  fillColorHex: string,
  dpr: number
) {
  const canvas = ctx.canvas;
  const realX = Math.round(startX * dpr);
  const realY = Math.round(startY * dpr);
  const w = canvas.width;
  const h = canvas.height;

  if (realX < 0 || realX >= w || realY < 0 || realY >= h) return;

  const imgData = ctx.getImageData(0, 0, w, h);
  const data32 = new Uint32Array(imgData.data.buffer);
  const targetColor = data32[realY * w + realX];
  const fillColor = hexToRgba32(fillColorHex);

  if (targetColor === fillColor) return;

  // BFS Queue with pre-allocated buffer
  const queueX = new Int32Array(w * h);
  const queueY = new Int32Array(w * h);
  let head = 0;
  let tail = 0;

  queueX[tail] = realX;
  queueY[tail] = realY;
  tail++;
  data32[realY * w + realX] = fillColor;

  while (head < tail) {
    const cx = queueX[head];
    const cy = queueY[head];
    head++;

    // 4 cardinal neighbors
    if (cx + 1 < w && data32[cy * w + (cx + 1)] === targetColor) {
      data32[cy * w + (cx + 1)] = fillColor;
      queueX[tail] = cx + 1;
      queueY[tail] = cy;
      tail++;
    }
    if (cx - 1 >= 0 && data32[cy * w + (cx - 1)] === targetColor) {
      data32[cy * w + (cx - 1)] = fillColor;
      queueX[tail] = cx - 1;
      queueY[tail] = cy;
      tail++;
    }
    if (cy + 1 < h && data32[(cy + 1) * w + cx] === targetColor) {
      data32[(cy + 1) * w + cx] = fillColor;
      queueX[tail] = cx;
      queueY[tail] = cy + 1;
      tail++;
    }
    if (cy - 1 >= 0 && data32[(cy - 1) * w + cx] === targetColor) {
      data32[(cy - 1) * w + cx] = fillColor;
      queueX[tail] = cx;
      queueY[tail] = cy - 1;
      tail++;
    }
  }

  ctx.putImageData(imgData, 0, 0);
}

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({
  isArtist,
  currentColor,
  currentBrushSize,
  currentTool,
  canvasBgColor = '#ffffff',
  strokes,
  onStrokeCompleted,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDrawingRef = useRef(false);
  const currentPointsRef = useRef<[number, number][]>([]);
  const [livePreviewPoint, setLivePreviewPoint] = useState<[number, number] | null>(null);

  // Helper to draw a single stroke onto a context
  const renderStroke = useCallback(
    (ctx: CanvasRenderingContext2D, stroke: StrokeData, bg: string, dpr: number) => {
      const { points, tool, color, size } = stroke;
      if (!points || points.length === 0) return;

      if (tool === 'bucket') {
        executeFloodFill(ctx, points[0][0], points[0][1], color, dpr);
        return;
      }

      ctx.lineWidth = size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (tool === 'pencil' || tool === 'eraser') {
        if (points.length < 2) {
          // Single dot
          ctx.fillStyle = tool === 'eraser' ? bg : color;
          ctx.beginPath();
          ctx.arc(points[0][0], points[0][1], size / 2, 0, Math.PI * 2);
          ctx.fill();
          return;
        }

        ctx.strokeStyle = tool === 'eraser' ? bg : color;
        ctx.beginPath();
        ctx.moveTo(points[0][0], points[0][1]);
        for (let i = 1; i < points.length; i++) {
          ctx.lineTo(points[i][0], points[i][1]);
        }
        ctx.stroke();
      } else if (tool === 'line') {
        const start = points[0];
        const end = points[points.length - 1];
        ctx.strokeStyle = color;
        ctx.beginPath();
        ctx.moveTo(start[0], start[1]);
        ctx.lineTo(end[0], end[1]);
        ctx.stroke();
      } else if (tool === 'rectangle' || tool === 'filled_rectangle') {
        const start = points[0];
        const end = points[points.length - 1];
        const x = Math.min(start[0], end[0]);
        const y = Math.min(start[1], end[1]);
        const w = Math.abs(end[0] - start[0]);
        const h = Math.abs(end[1] - start[1]);

        if (tool === 'filled_rectangle') {
          ctx.fillStyle = color;
          ctx.fillRect(x, y, w, h);
        } else {
          ctx.strokeStyle = color;
          ctx.strokeRect(x, y, w, h);
        }
      } else if (tool === 'circle' || tool === 'filled_circle') {
        const start = points[0];
        const end = points[points.length - 1];
        const radiusX = Math.abs(end[0] - start[0]) / 2;
        const radiusY = Math.abs(end[1] - start[1]) / 2;
        const centerX = Math.min(start[0], end[0]) + radiusX;
        const centerY = Math.min(start[1], end[1]) + radiusY;

        ctx.beginPath();
        ctx.ellipse(centerX, centerY, Math.max(1, radiusX), Math.max(1, radiusY), 0, 0, Math.PI * 2);
        if (tool === 'filled_circle') {
          ctx.fillStyle = color;
          ctx.fill();
        } else {
          ctx.strokeStyle = color;
          ctx.stroke();
        }
      }
    },
    []
  );

  // Redraw all strokes on canvas
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.width / dpr;
    const height = canvas.height / dpr;

    // Background fill
    ctx.fillStyle = canvasBgColor;
    ctx.fillRect(0, 0, width, height);

    // Draw grid if blueprint mode
    if (canvasBgColor === '#1e3a8a') {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      const gridSize = 24;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
    }

    // Render committed strokes
    strokes.forEach((stroke) => {
      renderStroke(ctx, stroke, canvasBgColor, dpr);
    });

    // Render live shape preview for active artist
    if (isDrawingRef.current && currentPointsRef.current.length > 0) {
      const previewStroke: StrokeData = {
        id: 'live_preview',
        tool: currentTool,
        color: currentColor,
        size: currentBrushSize,
        points: currentPointsRef.current,
      };
      renderStroke(ctx, previewStroke, canvasBgColor, dpr);
    }
  }, [strokes, canvasBgColor, renderStroke, currentTool, currentColor, currentBrushSize]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  // Handle canvas resize with devicePixelRatio and ResizeObserver
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const dpr = window.devicePixelRatio || 1;

    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
    }
    redrawCanvas();
  }, [redrawCanvas]);

  useEffect(() => {
    resizeCanvas();

    const container = containerRef.current;
    if (!container) return;

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => {
        resizeCanvas();
      });
      ro.observe(container);
    } else {
      window.addEventListener('resize', resizeCanvas);
    }

    return () => {
      if (ro) ro.disconnect();
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [resizeCanvas]);

  // Coordinate mapper from clientX/clientY
  const getCanvasCoords = useCallback((clientX: number, clientY: number): [number, number] => {
    const canvas = canvasRef.current;
    if (!canvas) return [0, 0];
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    return [Math.round(x), Math.round(y)];
  }, []);

  // Central drawing operations
  const startDrawing = useCallback((coords: [number, number]) => {
    if (!isArtist) return;

    if (currentTool === 'bucket') {
      const fillStroke: StrokeData = {
        id: 's_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        points: [coords],
        color: currentColor,
        size: 1,
        tool: 'bucket',
      };
      onStrokeCompleted(fillStroke);
      return;
    }

    isDrawingRef.current = true;
    currentPointsRef.current = [coords];
    setLivePreviewPoint(coords);
    redrawCanvas();
  }, [isArtist, currentTool, currentColor, onStrokeCompleted, redrawCanvas]);

  const moveDrawing = useCallback((coords: [number, number]) => {
    if (!isArtist || !isDrawingRef.current) return;

    if (currentTool === 'pencil' || currentTool === 'eraser') {
      currentPointsRef.current.push(coords);
    } else {
      currentPointsRef.current = [currentPointsRef.current[0], coords];
    }

    setLivePreviewPoint(coords);
    redrawCanvas();
  }, [isArtist, currentTool, redrawCanvas]);

  const endDrawing = useCallback(() => {
    if (!isArtist || !isDrawingRef.current) return;
    isDrawingRef.current = false;
    setLivePreviewPoint(null);

    const pts = currentPointsRef.current;
    if (pts.length === 0) return;

    const newStroke: StrokeData = {
      id: 's_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      points: pts,
      color: currentColor,
      size: currentBrushSize,
      tool: currentTool,
    };

    onStrokeCompleted(newStroke);
    currentPointsRef.current = [];
  }, [isArtist, currentColor, currentBrushSize, currentTool, onStrokeCompleted]);

  // Native touch listeners with { passive: false } to guarantee smooth mobile drawing & prevent page scroll
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onTouchStart = (e: TouchEvent) => {
      if (!isArtist) return;
      e.preventDefault();
      if (e.touches.length === 0) return;
      const touch = e.touches[0];
      const coords = getCanvasCoords(touch.clientX, touch.clientY);
      startDrawing(coords);
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isArtist || !isDrawingRef.current) return;
      e.preventDefault();
      if (e.touches.length === 0) return;
      const touch = e.touches[0];
      const coords = getCanvasCoords(touch.clientX, touch.clientY);
      moveDrawing(coords);
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (!isArtist || !isDrawingRef.current) return;
      e.preventDefault();
      endDrawing();
    };

    const onTouchCancel = (e: TouchEvent) => {
      if (!isArtist || !isDrawingRef.current) return;
      e.preventDefault();
      endDrawing();
    };

    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    canvas.addEventListener('touchend', onTouchEnd, { passive: false });
    canvas.addEventListener('touchcancel', onTouchCancel, { passive: false });

    return () => {
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchmove', onTouchMove);
      canvas.removeEventListener('touchend', onTouchEnd);
      canvas.removeEventListener('touchcancel', onTouchCancel);
    };
  }, [isArtist, getCanvasCoords, startDrawing, moveDrawing, endDrawing]);

  // Desktop Pointer / Mouse event handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.pointerType === 'touch') return; // Handled by native touch listeners
    if (!isArtist) return;

    const canvas = canvasRef.current;
    if (canvas) {
      try {
        canvas.setPointerCapture(e.pointerId);
      } catch (_) {}
    }

    const coords = getCanvasCoords(e.clientX, e.clientY);
    startDrawing(coords);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.pointerType === 'touch') return;
    if (!isArtist || !isDrawingRef.current) return;
    const coords = getCanvasCoords(e.clientX, e.clientY);
    moveDrawing(coords);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.pointerType === 'touch') return;
    const canvas = canvasRef.current;
    if (canvas) {
      try {
        if (canvas.hasPointerCapture(e.pointerId)) {
          canvas.releasePointerCapture(e.pointerId);
        }
      } catch (_) {}
    }
    endDrawing();
  };

  return (
    <div className="canvas-container-outer" ref={containerRef}>
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className={`skribbl-canvas ${isArtist ? 'artist-active' : 'spectator'}`}
        style={{ cursor: isArtist ? (currentTool === 'eraser' ? 'cell' : 'crosshair') : 'default' }}
      />

      <style>{`
        .canvas-container-outer {
          flex: 1;
          width: 100%;
          min-height: 180px;
          height: 100%;
          background: #020617;
          border-radius: var(--radius-lg);
          border: 1px solid var(--border-default);
          overflow: hidden;
          position: relative;
          box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.4);
          touch-action: none;
          -webkit-touch-callout: none;
          user-select: none;
          -webkit-user-select: none;
        }

        .skribbl-canvas {
          display: block;
          touch-action: none;
          -webkit-touch-callout: none;
          user-select: none;
          -webkit-user-select: none;
          width: 100%;
          height: 100%;
        }

        .skribbl-canvas.artist-active {
          touch-action: none;
        }
      `}</style>
    </div>
  );
};
