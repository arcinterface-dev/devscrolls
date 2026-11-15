import React, { useState } from 'react';
import type { DrawingTool } from './DrawingCanvas';

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
  '#0f172a', // Dark Slate
  '#64748b', // Slate Gray
  '#ffffff', // White
  '#ef4444', // Red
  '#f97316', // Orange
  '#eab308', // Amber/Yellow
  '#10b981', // Emerald
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#8b5cf6', // Violet
];

const BRUSH_SIZES = [
  { size: 3, label: 'Fine' },
  { size: 7, label: 'Medium' },
  { size: 14, label: 'Thick' },
];

export const ToolBar: React.FC<ToolBarProps> = ({
  color,
  brushSize,
  tool,
  onColorChange,
  onBrushSizeChange,
  onToolChange,
  onUndo,
  onClear,
}) => {
  const [showShapes, setShowShapes] = useState(false);

  const isShapeTool = ['line', 'rectangle', 'filled_rectangle', 'circle', 'filled_circle'].includes(tool);

  return (
    <div className="skribbl-modern-toolbar">
      {/* Group 1: Core Drawing Tools */}
      <div className="toolbar-section tools-section">
        <button
          type="button"
          onClick={() => {
            onToolChange('pencil');
            setShowShapes(false);
          }}
          className={`tool-btn ${tool === 'pencil' ? 'active' : ''}`}
          title="Pencil / Freehand"
          aria-label="Pencil tool"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
            <path d="m15 5 4 4" />
          </svg>
        </button>

        <button
          type="button"
          onClick={() => {
            onToolChange('eraser');
            setShowShapes(false);
          }}
          className={`tool-btn ${tool === 'eraser' ? 'active' : ''}`}
          title="Eraser"
          aria-label="Eraser tool"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21" />
            <path d="M22 21H7" />
            <path d="m5 11 9 9" />
          </svg>
        </button>

        <button
          type="button"
          onClick={() => {
            onToolChange('bucket');
            setShowShapes(false);
          }}
          className={`tool-btn ${tool === 'bucket' ? 'active' : ''}`}
          title="Fill Bucket"
          aria-label="Fill Bucket tool"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m19 11-8-8-8.6 8.6a2 2 0 0 0 0 2.8l5.2 5.2c.8.8 2 .8 2.8 0L19 11Z" />
            <path d="m5 2 5 5" />
            <path d="M2 13h15" />
            <path d="M22 20a2 2 0 1 1-4 0c0-1.6 1.7-2.4 2-4 .3 1.6 2 2.4 2 4Z" />
          </svg>
        </button>

        {/* Shapes Selector Dropdown */}
        <div className="shapes-wrapper">
          <button
            type="button"
            onClick={() => setShowShapes(!showShapes)}
            className={`tool-btn ${isShapeTool ? 'active' : ''}`}
            title="Geometric Shapes"
            aria-label="Shapes tool"
          >
            {tool === 'line' ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="19" x2="19" y2="5" /></svg>
            ) : tool === 'circle' || tool === 'filled_circle' ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="12" cy="12" r="9" /></svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><rect x="3" y="3" width="18" height="18" rx="2" /></svg>
            )}
            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ marginLeft: 2, opacity: 0.7 }}>
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {showShapes && (
            <div className="shapes-popover">
              <button
                type="button"
                onClick={() => { onToolChange('line'); setShowShapes(false); }}
                className={`shape-opt-btn ${tool === 'line' ? 'shape-active' : ''}`}
                title="Line"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="4" y1="20" x2="20" y2="4" /></svg>
                <span>Line</span>
              </button>
              <button
                type="button"
                onClick={() => { onToolChange('rectangle'); setShowShapes(false); }}
                className={`shape-opt-btn ${tool === 'rectangle' ? 'shape-active' : ''}`}
                title="Box"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /></svg>
                <span>Box</span>
              </button>
              <button
                type="button"
                onClick={() => { onToolChange('filled_rectangle'); setShowShapes(false); }}
                className={`shape-opt-btn ${tool === 'filled_rectangle' ? 'shape-active' : ''}`}
                title="Filled Box"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="18" height="18" rx="2" /></svg>
                <span>Filled Box</span>
              </button>
              <button
                type="button"
                onClick={() => { onToolChange('circle'); setShowShapes(false); }}
                className={`shape-opt-btn ${tool === 'circle' ? 'shape-active' : ''}`}
                title="Circle"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /></svg>
                <span>Circle</span>
              </button>
              <button
                type="button"
                onClick={() => { onToolChange('filled_circle'); setShowShapes(false); }}
                className={`shape-opt-btn ${tool === 'filled_circle' ? 'shape-active' : ''}`}
                title="Filled Circle"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="9" /></svg>
                <span>Filled Circle</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="toolbar-divider" />

      {/* Group 2: Brush Sizes (Clean Minimalist Dots) */}
      <div className="toolbar-section sizes-section">
        {BRUSH_SIZES.map(({ size, label }) => (
          <button
            key={size}
            type="button"
            onClick={() => onBrushSizeChange(size)}
            className={`brush-dot-btn ${brushSize === size ? 'size-selected' : ''}`}
            title={`${label} (${size}px)`}
            aria-label={`${label} brush size`}
          >
            <span
              className="size-indicator"
              style={{
                width: `${size <= 4 ? 4 : size <= 8 ? 8 : 12}px`,
                height: `${size <= 4 ? 4 : size <= 8 ? 8 : 12}px`,
                backgroundColor: tool === 'eraser' ? 'var(--text-muted)' : color,
              }}
            />
          </button>
        ))}
      </div>

      <div className="toolbar-divider" />

      {/* Group 3: Curated Modern Palette */}
      <div className="toolbar-section palette-section">
        <div className="palette-row">
          {PALETTE.map((c) => {
            const isSelected = color === c && tool !== 'eraser';
            return (
              <button
                key={c}
                type="button"
                onClick={() => {
                  onColorChange(c);
                  if (tool === 'eraser') onToolChange('pencil');
                }}
                className={`palette-swatch ${isSelected ? 'swatch-selected' : ''}`}
                style={{ backgroundColor: c }}
                title={c}
                aria-label={`Select color ${c}`}
              />
            );
          })}

          {/* Color Picker Dot */}
          <label className="custom-picker-btn" title="Custom color">
            <span className="picker-gradient-ring" />
            <input
              type="color"
              value={color}
              onChange={(e) => {
                onColorChange(e.target.value);
                if (tool === 'eraser') onToolChange('pencil');
              }}
              className="hidden-color-input"
              aria-label="Pick custom color"
            />
          </label>
        </div>
      </div>

      <div className="toolbar-divider" />

      {/* Group 4: Undo & Clear Actions */}
      <div className="toolbar-section actions-section">
        <button
          type="button"
          onClick={onUndo}
          className="action-icon-btn"
          title="Undo (Ctrl+Z)"
          aria-label="Undo last stroke"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 7v6h6" />
            <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
          </svg>
        </button>

        <button
          type="button"
          onClick={onClear}
          className="action-icon-btn clear-danger-btn"
          title="Clear canvas"
          aria-label="Clear canvas"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18" />
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
          </svg>
        </button>
      </div>

      <style>{`
        .skribbl-modern-toolbar {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          background: var(--surface-raised);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-xl);
          padding: 6px 14px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
          user-select: none;
          max-width: 100%;
          box-sizing: border-box;
        }

        .toolbar-section {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .toolbar-divider {
          width: 1px;
          height: 18px;
          background: var(--border-subtle);
          margin: 0 2px;
          flex-shrink: 0;
        }

        /* Tool Buttons */
        .tool-btn {
          width: 32px;
          height: 32px;
          border-radius: var(--radius-md);
          background: transparent;
          border: 1px solid transparent;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.15s ease;
          padding: 0;
        }

        .tool-btn:hover {
          color: var(--text-primary);
          background: var(--surface-sunken);
        }

        .tool-btn.active {
          color: var(--accent-default);
          background: rgba(217, 119, 6, 0.12);
          border-color: rgba(217, 119, 6, 0.3);
        }

        /* Shapes Dropdown */
        .shapes-wrapper {
          position: relative;
        }

        .shapes-popover {
          position: absolute;
          bottom: calc(100% + 8px);
          left: 50%;
          transform: translateX(-50%);
          background: var(--surface-raised);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg);
          padding: 4px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.2);
          display: flex;
          flex-direction: column;
          gap: 2px;
          z-index: 50;
          min-width: 120px;
        }

        .shape-opt-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 10px;
          border-radius: var(--radius-sm);
          background: transparent;
          border: none;
          color: var(--text-secondary);
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          width: 100%;
          text-align: left;
          transition: background 0.12s, color 0.12s;
        }

        .shape-opt-btn:hover {
          background: var(--surface-sunken);
          color: var(--text-primary);
        }

        .shape-opt-btn.shape-active {
          color: var(--accent-default);
          background: rgba(217, 119, 6, 0.1);
        }

        /* Brush Size Dots */
        .brush-dot-btn {
          width: 26px;
          height: 26px;
          border-radius: var(--radius-full);
          background: transparent;
          border: 1px solid transparent;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: border-color 0.15s, background 0.15s;
          padding: 0;
        }

        .brush-dot-btn:hover {
          background: var(--surface-sunken);
        }

        .brush-dot-btn.size-selected {
          border-color: var(--accent-default);
          background: rgba(217, 119, 6, 0.08);
        }

        .size-indicator {
          border-radius: 50%;
          display: block;
          transition: transform 0.15s;
        }

        /* Swatches */
        .palette-row {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .palette-swatch {
          width: 18px;
          height: 18px;
          border-radius: var(--radius-full);
          border: 1px solid rgba(0, 0, 0, 0.15);
          cursor: pointer;
          padding: 0;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }

        .palette-swatch:hover {
          transform: scale(1.2);
        }

        .palette-swatch.swatch-selected {
          transform: scale(1.25);
          box-shadow: 0 0 0 2px var(--surface-raised), 0 0 0 4px var(--accent-default);
        }

        .custom-picker-btn {
          width: 18px;
          height: 18px;
          border-radius: var(--radius-full);
          cursor: pointer;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--border-subtle);
          background: conic-gradient(from 0deg, red, yellow, lime, aqua, blue, magenta, red);
          transition: transform 0.15s;
        }

        .custom-picker-btn:hover {
          transform: scale(1.2);
        }

        .hidden-color-input {
          position: absolute;
          opacity: 0;
          width: 100%;
          height: 100%;
          cursor: pointer;
        }

        /* Action Buttons */
        .action-icon-btn {
          width: 32px;
          height: 32px;
          border-radius: var(--radius-md);
          background: transparent;
          border: 1px solid transparent;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.15s ease;
          padding: 0;
        }

        .action-icon-btn:hover {
          color: var(--text-primary);
          background: var(--surface-sunken);
        }

        .clear-danger-btn:hover {
          color: #ef4444;
          background: rgba(239, 68, 68, 0.1);
        }

        @media (max-width: 768px) {
          .skribbl-modern-toolbar {
            gap: 6px;
            padding: 4px 8px;
            overflow-x: auto;
            justify-content: flex-start;
            scrollbar-width: none;
          }
          .skribbl-modern-toolbar::-webkit-scrollbar {
            display: none;
          }
          .palette-swatch {
            width: 16px;
            height: 16px;
          }
          .custom-picker-btn {
            width: 16px;
            height: 16px;
          }
        }
      `}</style>
    </div>
  );
};
