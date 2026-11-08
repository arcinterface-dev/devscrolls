import React, { useEffect, useRef } from 'react';

interface GaugeCanvasProps {
  label: string;
  value: number; // 0 to 100
  unit?: string;
  height?: number;
}

export const GaugeCanvas: React.FC<GaugeCanvasProps> = ({
  label,
  value,
  unit = '%',
  height = 16,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const currentValRef = useRef<number>(value);
  const targetValRef = useRef<number>(value);
  const animFrameRef = useRef<number>(0);

  useEffect(() => {
    targetValRef.current = Math.max(0, Math.min(100, value));
  }, [value]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isRunning = true;

    const render = () => {
      if (!isRunning) return;

      // Smooth lerp (linear interpolation) towards target for fluid 60fps visual
      currentValRef.current += (targetValRef.current - currentValRef.current) * 0.15;
      const cur = currentValRef.current;

      const width = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, width, h);

      // Background track
      ctx.fillStyle = '#1e293b'; // Slate 800
      ctx.beginPath();
      ctx.roundRect(0, 0, width, h, 4);
      ctx.fill();

      // Determine color based on threshold
      let barColor = '#22c55e'; // Green
      if (cur > 80) {
        barColor = '#ef4444'; // Red
      } else if (cur > 50) {
        barColor = '#eab308'; // Yellow
      }

      // Fill bar
      const fillWidth = Math.max(0, Math.min(width, (cur / 100) * width));
      if (fillWidth > 0) {
        ctx.fillStyle = barColor;
        ctx.beginPath();
        ctx.roundRect(0, 0, fillWidth, h, 4);
        ctx.fill();

        // Subtle highlight sheen
        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, 'rgba(255, 255, 255, 0.25)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0.1)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(0, 0, fillWidth, h, 4);
        ctx.fill();
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      isRunning = false;
      cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  return (
    <div className="gauge-container">
      <div className="gauge-header">
        <span className="gauge-label">{label}</span>
        <span className={`gauge-val ${value > 85 ? 'val-danger' : value > 55 ? 'val-warn' : 'val-good'}`}>
          {Math.round(value)}{unit}
        </span>
      </div>
      <canvas
        ref={canvasRef}
        width={240}
        height={height}
        className="gauge-canvas"
      />

      <style>{`
        .gauge-container {
          display: flex;
          flex-direction: column;
          gap: 4px;
          width: 100%;
        }

        .gauge-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 11px;
        }

        .gauge-label {
          font-weight: 700;
          color: #94a3b8;
          letter-spacing: 0.05em;
        }

        .gauge-val {
          font-family: var(--font-mono, monospace);
          font-weight: 800;
        }

        .val-good { color: #22c55e; }
        .val-warn { color: #eab308; }
        .val-danger { color: #ef4444; }

        .gauge-canvas {
          width: 100%;
          height: ${height}px;
          border-radius: 4px;
          display: block;
        }
      `}</style>
    </div>
  );
};
