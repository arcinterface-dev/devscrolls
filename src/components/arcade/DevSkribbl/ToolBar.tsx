import React from 'react';
import type { DrawingTool } from './DrawingCanvas';
import { sound } from './audio';

interface ToolBarProps {
  color: string;
  brushSize: number;
  tool: DrawingTool;
  canvasBgColor: string;
  onColorChange: (color: string) => void;
  onBrushSizeChange: (size: number) => void;
  onToolChange: (tool: DrawingTool) => void;
  onBgColorChange: (bgColor: string) => void;
  onUndo: () => void;
  onClear: () => void;
}

const PALETTE = [
  '#000000', '#475569', '#94a3b8', '#ffffff',
  '#ef4444', '#f97316', '#f59e0b', '#eab308',
  '#22c55e', '#10b981', '#06b6d4', '#38bdf8',
  '#3b82f6', '#8b5cf6', '#ec4899', '#78350f',
];

const BRUSH_SIZES = [2, 5, 10, 18, 30];

const CANVAS_BACKGROUNDS = [
  { label: 'White', color: '#ffffff', icon: '⚪' },
  { label: 'Dark Terminal', color: '#0f172a', icon: '⚫' },
  { label: 'Blueprint', color: '#1e3a8a', icon: '📐' },
  { label: 'Post-it', color: '#fef3c7', icon: '🟡' },
];

export const ToolBar: React.FC<ToolBarProps> = ({
  color,
  brushSize,
  tool,
  canvasBgColor,
  onColorChange,
  onBrushSizeChange,
  onToolChange,
  onBgColorChange,
  onUndo,
  onClear,
}) => {
  return (
    <div className="skribbl-paint-toolbar">
      {/* Group 1: Drawing & Shape Tools */}
      <div className="tool-cluster tools-group">
        <button
          type="button"
          onClick={() => {
            sound.playPop();
            onToolChange('pencil');
          }}
          className={`tool-icon-btn ${tool === 'pencil' ? 'active' : ''}`}
          title="Freehand Pencil / Brush"
        >
          ✏️
          <span className="tool-tooltip">Pencil</span>
        </button>

        <button
          type="button"
          onClick={() => {
            sound.playPop();
            onToolChange('eraser');
          }}
          className={`tool-icon-btn ${tool === 'eraser' ? 'active' : ''}`}
          title="Eraser"
        >
          🧹
          <span className="tool-tooltip">Eraser</span>
        </button>

        <button
          type="button"
          onClick={() => {
            sound.playPop();
            onToolChange('bucket');
          }}
          className={`tool-icon-btn ${tool === 'bucket' ? 'active' : ''}`}
          title="Paint Bucket (Flood Fill)"
        >
          🪣
          <span className="tool-tooltip">Fill</span>
        </button>

        <div className="cluster-divider"></div>

        <button
          type="button"
          onClick={() => {
            sound.playPop();
            onToolChange('line');
          }}
          className={`tool-icon-btn ${tool === 'line' ? 'active' : ''}`}
          title="Straight Line"
        >
          📏
          <span className="tool-tooltip">Line</span>
        </button>

        <button
          type="button"
          onClick={() => onToolChange('rectangle')}
          className={`tool-icon-btn ${tool === 'rectangle' ? 'active' : ''}`}
          title="Rectangle Box"
        >
          ⬜
          <span className="tool-tooltip">Box</span>
        </button>

        <button
          type="button"
          onClick={() => onToolChange('filled_rectangle')}
          className={`tool-icon-btn ${tool === 'filled_rectangle' ? 'active' : ''}`}
          title="Filled Rectangle"
        >
          ⬛
          <span className="tool-tooltip">Filled Box</span>
        </button>

        <button
          type="button"
          onClick={() => onToolChange('circle')}
          className={`tool-icon-btn ${tool === 'circle' ? 'active' : ''}`}
          title="Circle Outline"
        >
          ⭕
          <span className="tool-tooltip">Circle</span>
        </button>

        <button
          type="button"
          onClick={() => onToolChange('filled_circle')}
          className={`tool-icon-btn ${tool === 'filled_circle' ? 'active' : ''}`}
          title="Filled Circle"
        >
          🔴
          <span className="tool-tooltip">Filled Circle</span>
        </button>
      </div>

      {/* Group 2: Sizes */}
      <div className="tool-cluster sizes-group">
        <span className="group-label">Size:</span>
        {BRUSH_SIZES.map((sz) => (
          <button
            key={sz}
            type="button"
            onClick={() => onBrushSizeChange(sz)}
            className={`brush-size-btn ${brushSize === sz ? 'size-active' : ''}`}
            title={`${sz}px size`}
          >
            <span
              className="size-dot"
              style={{
                width: `${Math.min(20, Math.max(4, sz * 0.8))}px`,
                height: `${Math.min(20, Math.max(4, sz * 0.8))}px`,
                backgroundColor: tool === 'eraser' ? '#94a3b8' : color,
              }}
            />
          </button>
        ))}
      </div>

      {/* Group 3: Foreground Color Palette */}
      <div className="tool-cluster colors-group">
        <div className="swatches-wrap">
          {PALETTE.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => {
                onColorChange(c);
                if (tool === 'eraser') onToolChange('pencil');
              }}
              className={`color-swatch-btn ${color === c && tool !== 'eraser' ? 'swatch-active' : ''}`}
              style={{ backgroundColor: c }}
              title={`Color: ${c}`}
            />
          ))}

          {/* Custom Color Picker Input */}
          <label className="custom-color-picker" title="Custom color picker">
            <span className="picker-eyedropper">🎨</span>
            <input
              type="color"
              value={color}
              onChange={(e) => {
                onColorChange(e.target.value);
                if (tool === 'eraser') onToolChange('pencil');
              }}
              className="color-hidden-input"
            />
          </label>
        </div>
      </div>

      {/* Group 4: Canvas Backgrounds & Actions */}
      <div className="tool-cluster actions-group">
        <div className="bg-select-wrap">
          <span className="group-label">BG:</span>
          {CANVAS_BACKGROUNDS.map((bg) => (
            <button
              key={bg.color}
              type="button"
              onClick={() => onBgColorChange(bg.color)}
              className={`bg-toggle-btn ${canvasBgColor === bg.color ? 'active' : ''}`}
              title={`Canvas: ${bg.label}`}
            >
              {bg.icon}
            </button>
          ))}
        </div>

        <div className="cluster-divider"></div>

        <button type="button" onClick={onUndo} className="util-action-btn" title="Undo stroke (Ctrl+Z)">
          ↩ Undo
        </button>

        <button type="button" onClick={onClear} className="util-action-btn clear-btn" title="Clear entire canvas">
          🗑️ Clear
        </button>
      </div>

      <style>{`
        .skribbl-paint-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 8px;
          background: #0f172a;
          border: 1px solid #1e293b;
          border-radius: var(--radius-lg);
          padding: 6px 12px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
          flex-shrink: 0;
        }

        .tool-cluster {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .cluster-divider {
          width: 1px;
          height: 20px;
          background: #334155;
          margin: 0 4px;
        }

        .group-label {
          font-size: 11px;
          font-weight: 700;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        /* Tool buttons */
        .tool-icon-btn {
          width: 32px;
          height: 32px;
          border-radius: var(--radius-sm);
          background: #1e293b;
          border: 1px solid #334155;
          font-size: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          position: relative;
          transition: background 0.15s, border-color 0.15s, transform 0.1s;
        }
        .tool-icon-btn:hover {
          background: #334155;
          border-color: #475569;
          transform: translateY(-1px);
        }
        .tool-icon-btn.active {
          background: var(--accent-default);
          border-color: var(--accent-default);
          box-shadow: 0 0 0 2px rgba(217, 119, 6, 0.3);
        }

        .tool-tooltip {
          display: none;
        }

        /* Sizes */
        .brush-size-btn {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #1e293b;
          border: 1px solid #334155;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: border-color 0.15s;
        }
        .brush-size-btn:hover {
          border-color: #64748b;
        }
        .brush-size-btn.size-active {
          border-color: var(--accent-default);
          background: #334155;
        }

        .size-dot {
          border-radius: 50%;
          display: block;
        }

        /* Swatches */
        .swatches-wrap {
          display: grid;
          grid-template-columns: repeat(8, 1fr);
          gap: 4px;
        }

        .color-swatch-btn {
          width: 18px;
          height: 18px;
          border-radius: 4px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          cursor: pointer;
          padding: 0;
          transition: transform 0.1s, box-shadow 0.15s;
        }
        .color-swatch-btn:hover {
          transform: scale(1.18);
        }
        .color-swatch-btn.swatch-active {
          transform: scale(1.22);
          box-shadow: 0 0 0 2px #ffffff, 0 0 0 4px var(--accent-default);
          z-index: 2;
        }

        .custom-color-picker {
          width: 18px;
          height: 18px;
          border-radius: 4px;
          background: #1e293b;
          border: 1px solid #475569;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          position: relative;
          overflow: hidden;
        }
        .picker-eyedropper {
          font-size: 10px;
        }
        .color-hidden-input {
          position: absolute;
          opacity: 0;
          width: 100%;
          height: 100%;
          cursor: pointer;
        }

        /* BG Select */
        .bg-select-wrap {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .bg-toggle-btn {
          width: 26px;
          height: 26px;
          border-radius: 4px;
          background: #1e293b;
          border: 1px solid #334155;
          font-size: 11px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: border-color 0.15s;
        }
        .bg-toggle-btn:hover {
          border-color: #64748b;
        }
        .bg-toggle-btn.active {
          border-color: #38bdf8;
          background: #334155;
          box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.3);
        }

        /* Actions */
        .util-action-btn {
          background: #1e293b;
          border: 1px solid #334155;
          color: #f1f5f9;
          font-size: 12px;
          font-weight: 700;
          padding: 6px 12px;
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: background 0.15s, border-color 0.15s;
        }
        .util-action-btn:hover {
          background: #334155;
          border-color: #475569;
        }
        .util-action-btn.clear-btn:hover {
          background: #ef4444;
          border-color: #ef4444;
          color: #ffffff;
        }
      `}</style>
    </div>
  );
};
