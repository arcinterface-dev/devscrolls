import React, { useState, useEffect, useRef } from 'react';
import { PRESET_PROMPTS } from './prompts';
import { storage } from '../shared/storage';

type Step = 'prompt' | 'drawing' | 'guessing' | 'album';

interface TelephoneEntry {
  originalPrompt: string;
  drawingDataUrl: string;
  guessText: string;
}

const COLORS = ['#000000', '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#ffffff'];

export const DevTelephone: React.FC = () => {
  const [step, setStep] = useState<Step>('prompt');
  const [promptText, setPromptText] = useState('');
  const [guessText, setGuessText] = useState('');
  const [history, setHistory] = useState<TelephoneEntry[]>([]);

  // Canvas drawing state
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const [currentColor, setCurrentColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(4);
  const [isEraser, setIsEraser] = useState(false);
  const [capturedDrawing, setCapturedDrawing] = useState('');

  // Random preset prompt
  const pickRandomPrompt = () => {
    const p = PRESET_PROMPTS[Math.floor(Math.random() * PRESET_PROMPTS.length)];
    setPromptText(p);
  };

  useEffect(() => {
    pickRandomPrompt();
  }, []);

  // Initialize canvas
  useEffect(() => {
    if (step !== 'drawing') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fill white bg
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, [step]);

  // Canvas Mouse / Touch events
  const getCoords = (e: React.PointerEvent<HTMLCanvasElement>): [number, number] => {
    const canvas = canvasRef.current;
    if (!canvas) return [0, 0];
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return [
      (e.clientX - rect.left) * scaleX,
      (e.clientY - rect.top) * scaleY,
    ];
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(e.pointerId);
    isDrawingRef.current = true;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const [x, y] = getCoords(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = isEraser ? '#ffffff' : currentColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const [x, y] = getCoords(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const handlePointerUp = () => {
    isDrawingRef.current = false;
  };

  const handleClearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  // Step transitions
  const handleStartDrawing = () => {
    if (!promptText.trim()) return;
    setStep('drawing');
  };

  const handleFinishDrawing = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    setCapturedDrawing(dataUrl);
    setStep('guessing');
  };

  const handleFinishGuessing = () => {
    if (!guessText.trim()) return;

    const entry: TelephoneEntry = {
      originalPrompt: promptText,
      drawingDataUrl: capturedDrawing,
      guessText: guessText.trim(),
    };

    setHistory((prev) => [entry, ...prev]);
    setStep('album');
  };

  const handlePlayAnotherRound = () => {
    pickRandomPrompt();
    setGuessText('');
    setCapturedDrawing('');
    setStep('prompt');
  };

  return (
    <div className="telephone-container">
      {/* Header */}
      <header className="telephone-header">
        <div className="brand-group">
          <span className="tel-icon">📞</span>
          <div>
            <h1 className="tel-title">Dev Telephone</h1>
            <span className="tel-sub">Gartic Phone for Engineers</span>
          </div>
        </div>

        <div className="step-stepper">
          <span className={`step-dot ${step === 'prompt' ? 'active' : ''}`}>1. Prompt</span>
          <span className="step-arrow">➔</span>
          <span className={`step-dot ${step === 'drawing' ? 'active' : ''}`}>2. Draw</span>
          <span className="step-arrow">➔</span>
          <span className={`step-dot ${step === 'guessing' ? 'active' : ''}`}>3. Guess</span>
          <span className="step-arrow">➔</span>
          <span className={`step-dot ${step === 'album' ? 'active' : ''}`}>4. Album</span>
        </div>
      </header>

      {/* PHASE 1: PROMPT */}
      {step === 'prompt' && (
        <main className="view-card prompt-card">
          <span className="card-badge">STEP 1: WRITE THE SCENARIO</span>
          <h2 className="card-title">What should be drawn?</h2>
          <p className="card-desc">Write a bizarre, funny dev situation or click randomize for inspiration:</p>

          <div className="input-group">
            <textarea
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              placeholder="e.g. Intern accidentally drops the production database"
              className="prompt-textarea"
              rows={3}
            />
            <button type="button" onClick={pickRandomPrompt} className="randomize-prompt-btn">
              🎲 Randomize
            </button>
          </div>

          <button type="button" onClick={handleStartDrawing} className="primary-action-btn">
            Start Drawing ❯
          </button>
        </main>
      )}

      {/* PHASE 2: DRAWING */}
      {step === 'drawing' && (
        <main className="view-card drawing-card">
          <div className="prompt-reminder-bar">
            <span className="prompt-reminder-tag">DRAW THIS:</span>
            <strong className="prompt-reminder-text">{promptText}</strong>
          </div>

          <div className="canvas-wrapper">
            <canvas
              ref={canvasRef}
              width={640}
              height={400}
              className="telephone-canvas"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
            />
          </div>

          {/* Drawing toolbar */}
          <div className="drawing-toolbar">
            <div className="colors-row">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    setCurrentColor(c);
                    setIsEraser(false);
                  }}
                  className={`color-pill ${currentColor === c && !isEraser ? 'color-active' : ''}`}
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
            </div>

            <div className="tools-row">
              <button
                type="button"
                onClick={() => setIsEraser(!isEraser)}
                className={`tool-toggle-btn ${isEraser ? 'active' : ''}`}
              >
                🧹 Eraser
              </button>

              <button type="button" onClick={handleClearCanvas} className="tool-toggle-btn">
                🗑️ Clear
              </button>

              <div className="size-selector">
                <span className="size-label">Size:</span>
                {[3, 6, 12, 20].map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => setBrushSize(sz)}
                    className={`sz-btn ${brushSize === sz ? 'sz-active' : ''}`}
                  >
                    {sz}px
                  </button>
                ))}
              </div>

              <button type="button" onClick={handleFinishDrawing} className="submit-drawing-btn">
                Done Drawing ❯
              </button>
            </div>
          </div>
        </main>
      )}

      {/* PHASE 3: GUESSING */}
      {step === 'guessing' && (
        <main className="view-card guessing-card">
          <span className="card-badge">STEP 3: PASS THE PHONE</span>
          <h2 className="card-title">What on earth is this?</h2>
          <p className="card-desc">Look at the masterpiece below and write your best guess:</p>

          <div className="artwork-preview-box">
            <img src={capturedDrawing} alt="Telephone Sketch" className="artwork-img" />
          </div>

          <div className="guess-input-wrap">
            <input
              type="text"
              value={guessText}
              onChange={(e) => setGuessText(e.target.value)}
              placeholder="e.g. Someone screaming at a broken server..."
              className="guess-input-field"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleFinishGuessing();
              }}
            />
            <button type="button" onClick={handleFinishGuessing} className="primary-action-btn">
              Submit Guess ❯
            </button>
          </div>
        </main>
      )}

      {/* PHASE 4: ALBUM REVEAL */}
      {step === 'album' && (
        <main className="view-card album-card">
          <span className="card-badge">ROUND COMPLETE</span>
          <h2 className="card-title">The Telephone Progression 🎉</h2>
          <p className="card-desc">See how the prompt mutated through the telephone line:</p>

          <div className="progression-flow">
            <div className="flow-step">
              <span className="flow-num">1</span>
              <div className="flow-content">
                <span className="flow-lbl">ORIGINAL PROMPT:</span>
                <strong className="flow-val">{promptText}</strong>
              </div>
            </div>

            <div className="flow-step sketch-step">
              <span className="flow-num">2</span>
              <div className="flow-content">
                <span className="flow-lbl">THE DRAWING:</span>
                <img src={capturedDrawing} alt="Result Drawing" className="album-img" />
              </div>
            </div>

            <div className="flow-step">
              <span className="flow-num">3</span>
              <div className="flow-content">
                <span className="flow-lbl">THE FINAL GUESS:</span>
                <strong className="flow-val guess-val">{guessText}</strong>
              </div>
            </div>
          </div>

          <div className="album-actions-row">
            <button type="button" onClick={handlePlayAnotherRound} className="primary-action-btn">
              Play Another Round ❯
            </button>
          </div>
        </main>
      )}

      <style>{`
        .telephone-container {
          max-width: 720px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 16px;
          padding: 12px 16px 36px;
          box-sizing: border-box;
          min-height: calc(100vh - 120px);
        }

        .telephone-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 12px;
          border-bottom: 1px solid #1e293b;
        }

        .brand-group {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .tel-icon {
          font-size: 28px;
        }

        .tel-title {
          font-size: 20px;
          font-weight: 850;
          color: #ffffff;
          margin: 0;
          line-height: 1.2;
        }

        .tel-sub {
          font-size: 11px;
          color: #94a3b8;
          font-weight: 600;
        }

        .step-stepper {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11.5px;
          font-weight: 750;
          color: #64748b;
        }

        .step-dot.active {
          color: #f97316;
        }

        .step-arrow {
          font-size: 9px;
          opacity: 0.6;
        }

        /* View Card */
        .view-card {
          background: #0f172a;
          border: 1px solid #1e293b;
          border-radius: var(--radius-lg);
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
        }

        .card-badge {
          font-size: 10.5px;
          font-weight: 800;
          color: #f97316;
          background: rgba(249, 115, 22, 0.12);
          border: 1px solid rgba(249, 115, 22, 0.3);
          padding: 3px 8px;
          border-radius: var(--radius-full);
          align-self: flex-start;
          letter-spacing: 0.05em;
        }

        .card-title {
          font-size: 22px;
          font-weight: 850;
          color: #ffffff;
          margin: 0;
        }

        .card-desc {
          font-size: 13.5px;
          color: #94a3b8;
          margin: 0;
        }

        /* Prompt */
        .input-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .prompt-textarea {
          width: 100%;
          background: #090d16;
          border: 1px solid #334155;
          color: #ffffff;
          padding: 12px;
          border-radius: var(--radius-sm);
          font-size: 15px;
          font-family: inherit;
          box-sizing: border-box;
          resize: vertical;
        }

        .randomize-prompt-btn {
          align-self: flex-start;
          background: #1e293b;
          border: 1px solid #334155;
          color: #cbd5e1;
          font-size: 12px;
          font-weight: 700;
          padding: 6px 12px;
          border-radius: var(--radius-sm);
          cursor: pointer;
        }
        .randomize-prompt-btn:hover {
          background: #334155;
          color: #ffffff;
        }

        .primary-action-btn {
          align-self: flex-end;
          background: #f97316;
          color: #ffffff;
          border: none;
          font-size: 14px;
          font-weight: 800;
          padding: 10px 24px;
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: background 0.15s;
        }
        .primary-action-btn:hover {
          background: #ea580c;
        }

        /* Drawing */
        .prompt-reminder-bar {
          background: #1e293b;
          border: 1px solid #334155;
          padding: 8px 12px;
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .prompt-reminder-tag {
          font-size: 11px;
          font-weight: 800;
          color: #f97316;
        }

        .prompt-reminder-text {
          font-size: 14px;
          color: #ffffff;
        }

        .canvas-wrapper {
          width: 100%;
          border: 1px solid #334155;
          border-radius: var(--radius-sm);
          overflow: hidden;
          background: #ffffff;
          touch-action: none;
        }

        .telephone-canvas {
          width: 100%;
          height: auto;
          display: block;
          cursor: crosshair;
        }

        .drawing-toolbar {
          display: flex;
          flex-direction: column;
          gap: 10px;
          background: #1e293b;
          border: 1px solid #334155;
          padding: 10px 14px;
          border-radius: var(--radius-sm);
        }

        .colors-row {
          display: flex;
          gap: 8px;
        }

        .color-pill {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          border: 2px solid transparent;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }

        .color-pill.color-active {
          border-color: #ffffff;
          transform: scale(1.15);
        }

        .tools-row {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .tool-toggle-btn {
          background: #0f172a;
          border: 1px solid #334155;
          color: #cbd5e1;
          font-size: 12px;
          font-weight: 700;
          padding: 6px 10px;
          border-radius: var(--radius-sm);
          cursor: pointer;
        }
        .tool-toggle-btn.active {
          background: #f97316;
          color: #ffffff;
          border-color: #f97316;
        }

        .size-selector {
          display: flex;
          align-items: center;
          gap: 4px;
          margin-left: auto;
        }

        .size-label {
          font-size: 11px;
          color: #94a3b8;
          font-weight: 700;
        }

        .sz-btn {
          background: #0f172a;
          border: 1px solid #334155;
          color: #cbd5e1;
          font-size: 10px;
          font-weight: 700;
          padding: 3px 6px;
          border-radius: 3px;
          cursor: pointer;
        }
        .sz-btn.sz-active {
          border-color: #f97316;
          color: #f97316;
        }

        .submit-drawing-btn {
          background: #22c55e;
          color: #042f2e;
          font-weight: 800;
          border: none;
          font-size: 12.5px;
          padding: 6px 14px;
          border-radius: var(--radius-sm);
          cursor: pointer;
        }
        .submit-drawing-btn:hover {
          background: #16a34a;
          color: #ffffff;
        }

        /* Guessing */
        .artwork-preview-box {
          width: 100%;
          border: 1px solid #334155;
          border-radius: var(--radius-sm);
          overflow: hidden;
          background: #ffffff;
        }

        .artwork-img {
          width: 100%;
          height: auto;
          display: block;
        }

        .guess-input-wrap {
          display: flex;
          gap: 10px;
        }

        .guess-input-field {
          flex: 1;
          background: #090d16;
          border: 1px solid #334155;
          color: #ffffff;
          padding: 10px 14px;
          font-size: 15px;
          border-radius: var(--radius-sm);
        }

        /* Album */
        .progression-flow {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .flow-step {
          display: flex;
          gap: 14px;
          background: #1e293b;
          border: 1px solid #334155;
          padding: 14px 18px;
          border-radius: var(--radius-md);
        }

        .flow-num {
          width: 28px;
          height: 28px;
          background: #f97316;
          color: #ffffff;
          font-weight: 850;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          flex-shrink: 0;
        }

        .flow-content {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .flow-lbl {
          font-size: 10px;
          font-weight: 800;
          color: #94a3b8;
          letter-spacing: 0.05em;
        }

        .flow-val {
          font-size: 16px;
          color: #ffffff;
        }

        .guess-val {
          color: #38bdf8;
        }

        .album-img {
          max-width: 100%;
          border-radius: var(--radius-sm);
          margin-top: 6px;
        }

        .album-actions-row {
          display: flex;
          justify-content: flex-end;
        }
      `}</style>
    </div>
  );
};

