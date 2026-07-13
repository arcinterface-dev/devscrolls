import React, { useState, useEffect, useRef } from 'react';
import Editor, { DiffEditor, loader } from '@monaco-editor/react';
import { parseAndFormatJson, queryJsonPath, getSampleJson, sortJsonKeys } from './utils';

// Configure Monaco loader to use local self-hosted assets
if (typeof window !== 'undefined') {
  loader.config({
    paths: {
      vs: '/monaco/vs'
    }
  });
}

export default function JsonFormatter() {
  const [input, setInput] = useState('');
  const [diffOriginalInit, setDiffOriginalInit] = useState('');
  const [theme, setTheme] = useState('vs-dark');
  const [mode, setMode] = useState<'edit' | 'diff'>('edit');
  const [jsonPathQuery, setJsonPathQuery] = useState('');
  const [originalJson, setOriginalJson] = useState<string | null>(null); // snapshot before query
  const [metrics, setMetrics] = useState<{size: number, depth: number, keyCount: number} | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [fontsReady, setFontsReady] = useState(false);
  
  const editorRef = useRef<any>(null);

  useEffect(() => {
    const updateTheme = () => {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      setTheme(isDark ? 'vs-dark' : 'light');
    };
    
    updateTheme();
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    return () => observer.disconnect();
  }, []);

  // Wait for system fonts to load before mounting Monaco
  useEffect(() => {
    document.fonts.ready.then(() => setFontsReady(true));
  }, []);

  const updateMetrics = (val: string) => {
    if (!val.trim()) {
      setMetrics(null);
      setValidationError(null);
      return;
    }
    const result = parseAndFormatJson(val);
    if (result.isValid) {
      setValidationError(result.error); // Might be warning like auto-fixed
      if (result.metadata) {
        setMetrics(result.metadata);
      }
    } else {
      setValidationError(result.error || 'Invalid JSON');
      setMetrics(null);
    }
  };

  const handleEditorChange = (value: string | undefined) => {
    const val = value || '';
    setInput(val);
    updateMetrics(val);
  };

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    
    // Register format document shortcut (Shift + Alt + F)
    editor.addCommand(monaco.KeyMod.Shift | monaco.KeyMod.Alt | monaco.KeyCode.KeyF, () => {
      handleFormat();
    });

    editor.onDidPaste(() => {
      setTimeout(() => {
        handleFormat();
      }, 50);
    });
  };

  const applyEditorChange = (editor: any, newText: string) => {
    const model = editor.getModel();
    if (model) {
      model.pushEditOperations(
        [],
        [{ range: model.getFullModelRange(), text: newText }],
        () => null
      );
    } else {
      editor.setValue(newText);
    }
  };

  const handleFormat = () => {
    if (!input.trim()) return;
    const result = parseAndFormatJson(input);
    if (result.formatted && editorRef.current && mode === 'edit') {
      applyEditorChange(editorRef.current, result.formatted);
    }
  };

  const handleMinify = () => {
    if (!input.trim()) return;
    const result = parseAndFormatJson(input, 0);
    if (result.formatted && editorRef.current && mode === 'edit') {
      applyEditorChange(editorRef.current, result.formatted);
    }
  };

  const handleSortKeys = () => {
    if (!input.trim()) return;
    const result = sortJsonKeys(input);
    if (result.formatted && editorRef.current && mode === 'edit') {
      applyEditorChange(editorRef.current, result.formatted);
    }
  };

  const handleCopy = async () => {
    if (!input) return;
    try {
      await navigator.clipboard.writeText(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleClear = () => {
    if (editorRef.current && mode === 'edit') {
      applyEditorChange(editorRef.current, '');
    } else {
      setInput('');
      setMetrics(null);
      setValidationError(null);
    }
  };

  const loadSample = (type: 'simple' | 'nested' | 'large') => {
    const sample = getSampleJson(type);
    if (editorRef.current && mode === 'edit') {
      applyEditorChange(editorRef.current, sample);
    } else {
      setInput(sample);
      updateMetrics(sample);
    }
  };

  const executeQuery = () => {
    if (!jsonPathQuery.trim() || !input.trim()) return;
    
    // Snapshot the original JSON before the first query
    if (originalJson === null) {
      setOriginalJson(input);
    }
    
    const sourceJson = originalJson ?? input;
    const result = queryJsonPath(sourceJson, jsonPathQuery);
    if (result.formatted) {
      if (editorRef.current && mode === 'edit') {
        applyEditorChange(editorRef.current, result.formatted);
      }
    } else if (result.error) {
      alert(result.error);
    }
  };

  const resetQuery = () => {
    if (originalJson !== null && editorRef.current && mode === 'edit') {
      applyEditorChange(editorRef.current, originalJson);
    }
    setOriginalJson(null);
    setJsonPathQuery('');
  };

  const handleQueryChange = (value: string) => {
    setJsonPathQuery(value);
    // Auto-restore when user clears the query input
    if (!value.trim() && originalJson !== null) {
      resetQuery();
    }
  };

  const switchMode = (newMode: 'edit' | 'diff') => {
    if (newMode === 'diff') {
      setDiffOriginalInit(input);
    }
    setMode(newMode);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const sharedMonacoOptions = {
    minimap: { enabled: false },
    fontSize: 14,
    fontFamily: "'JetBrains Mono Variable', 'JetBrains Mono', 'SF Mono', Monaco, Menlo, Consolas, 'Ubuntu Mono', 'Liberation Mono', 'Courier New', monospace",
    fontLigatures: true,
    formatOnPaste: false,
    scrollBeyondLastLine: false,
    wordWrap: 'on' as const,
    padding: { top: 16, bottom: 16 },
    tabSize: 2,
    renderLineHighlight: 'all' as const,
    bracketPairColorization: { enabled: true },
    lineHeight: 22,
    cursorBlinking: 'smooth' as const,
    cursorSmoothCaretAnimation: 'on' as const,
    scrollbar: {
      vertical: 'visible' as const,
      horizontal: 'visible' as const,
      useShadows: false,
      verticalScrollbarSize: 10,
      horizontalScrollbarSize: 10,
    }
  };

  return (
    <div className="json-formatter-container vscode-style">
      <div className="jf-toolbar">
        <div className="jf-toolbar-left">
          <button className={`jf-btn-tab ${mode === 'edit' ? 'active' : ''}`} onClick={() => switchMode('edit')}>Editor</button>
          <button className={`jf-btn-tab ${mode === 'diff' ? 'active' : ''}`} onClick={() => switchMode('diff')}>Compare</button>
          <div className="jf-toolbar-divider"></div>
          
          <div className="jf-sample-dropdown">
            <span className="jf-label">Samples:</span>
            <select 
              className="jf-select-modern" 
              onChange={(e) => {
                if (e.target.value) {
                  loadSample(e.target.value as 'simple' | 'nested' | 'large');
                  e.target.value = ''; // reset so they can select it again
                }
              }}
            >
              <option value="">Load...</option>
              <option value="simple">Simple JSON</option>
              <option value="nested">Nested Hierarchy</option>
              <option value="large">Large API Response</option>
            </select>
          </div>
        </div>

        {mode === 'edit' && (
          <div className="jf-query-bar">
            <span className="jf-label">JSONPath:</span>
            <input 
              type="text" 
              className="jf-query-input" 
              placeholder="e.g. $.data[*].email"
              value={jsonPathQuery}
              onChange={e => handleQueryChange(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && executeQuery()}
            />
            <button className="jf-btn-modern" onClick={executeQuery}>Query</button>
            {originalJson !== null && (
              <button className="jf-btn-modern jf-btn-reset" onClick={resetQuery} title="Restore original JSON">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                Reset
              </button>
            )}
          </div>
        )}
      </div>

      <div className="jf-editor-split">
        <div className="jf-pane">
          <div className="jf-pane-header">
            <span className="jf-pane-title">
              {mode === 'diff' ? 'Modified Payload' : 'JSON Payload'}
            </span>
            <div className="jf-toolbar-actions">
              {mode === 'edit' && (
                <>
                  <button className="jf-btn-modern" onClick={handleFormat} title="Beautify & Auto-Fix (Shift+Alt+F)">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72Z"/><path d="m14 7 3 3"/><path d="M5 6v4"/><path d="M19 14v4"/><path d="M10 2v2"/><path d="M7 8H3"/><path d="M21 16h-4"/><path d="M11 3H9"/></svg>
                    Beautify
                  </button>
                  <button className="jf-btn-modern" onClick={handleMinify} title="Minify JSON">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/></svg>
                    Minify
                  </button>
                  <button className="jf-btn-modern" onClick={handleSortKeys} title="Sort Keys Alphabetically">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 16h10M3 12h14M3 8h18M3 4h21"/></svg>
                    Sort Keys
                  </button>
                  <div className="jf-toolbar-divider"></div>
                </>
              )}
              <div className="jf-copy-btn-container" style={{ position: 'relative' }}>
                <button className="jf-btn-icon" onClick={handleCopy} title="Copy to Clipboard">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                </button>
                {copied && <div className="jf-copied-toast">Copied!</div>}
              </div>
              <button className="jf-btn-icon" onClick={handleClear} title="Clear Editor">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
              </button>
            </div>
          </div>
          <div className="jf-editor-wrapper">
            {!fontsReady ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: 'var(--text-small)' }}>Loading editor...</div>
            ) : mode === 'edit' ? (
              <Editor
                height="100%"
                defaultLanguage="json"
                theme={theme}
                value={input}
                onChange={handleEditorChange}
                onMount={handleEditorDidMount}
                options={sharedMonacoOptions}
              />
            ) : (
              <DiffEditor
                height="100%"
                language="json"
                theme={theme}
                original={diffOriginalInit}
                modified={input}
                onMount={(editor) => {
                  editor.getModifiedEditor().onDidChangeModelContent(() => {
                     const val = editor.getModifiedEditor().getValue();
                     setInput(val);
                     updateMetrics(val);
                  });
                }}
                options={{
                  ...sharedMonacoOptions,
                  renderSideBySide: true,
                  originalEditable: true
                }}
              />
            )}
          </div>
        </div>
      </div>

      <div className={`jf-status-bar ${mode === 'edit' && validationError ? 'has-error' : ''}`}>
        <div className="jf-status-left">
          {mode === 'diff' ? (
            <span className="jf-status-success">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}><path d="M15 4h3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-3"/><path d="M9 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3"/><path d="M12 9v10"/><path d="M9 12h6"/></svg>
              Comparing...
            </span>
          ) : validationError ? (
            <span className="jf-status-error" title={validationError} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '800px' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px', flexShrink: 0 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {validationError}
            </span>
          ) : (
            <span className="jf-status-success">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              Ready
            </span>
          )}
        </div>
        <div className="jf-status-right">
          {mode === 'edit' && metrics ? (
            <>
              <span title="Nesting Depth">Depth: {metrics.depth}</span>
              <span className="jf-status-divider">|</span>
              <span title="Total Keys">Keys: {metrics.keyCount}</span>
              <span className="jf-status-divider">|</span>
              <span title="Payload Size">{formatSize(metrics.size)}</span>
            </>
          ) : (
            <span>UTF-8 <span className="jf-status-divider">|</span> JSON</span>
          )}
        </div>
      </div>
      
      <style>{`
        .json-formatter-container {
          display: flex;
          flex-direction: column;
          min-height: calc(100vh - 48px);
          flex-shrink: 0;
          width: 100%;
          background: var(--surface-base);
        }

        .jf-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0 var(--space-4);
          height: 48px;
          background: var(--surface-raised);
          border-bottom: 1px solid var(--border-subtle);
          flex-shrink: 0;
        }

        .jf-toolbar-left {
          display: flex;
          align-items: center;
          gap: var(--space-2);
        }

        .jf-btn-tab {
          background: transparent;
          border: none;
          color: var(--text-muted);
          font-family: inherit;
          font-size: var(--text-small);
          font-weight: 500;
          padding: var(--space-2) var(--space-3);
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: all 0.2s;
        }

        .jf-btn-tab:hover {
          color: var(--text-primary);
        }

        .jf-btn-tab.active {
          color: var(--accent-default);
          background: var(--surface-sunken);
        }

        .jf-sample-dropdown {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          margin-left: var(--space-2);
        }

        .jf-label {
          font-size: var(--text-xs);
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
        }

        .jf-select-modern {
          background: var(--surface-sunken);
          border: 1px solid var(--border-subtle);
          color: var(--text-primary);
          font-family: inherit;
          font-size: var(--text-xs);
          padding: var(--space-1) var(--space-2);
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: all 0.2s;
          outline: none;
        }

        .jf-select-modern:hover, .jf-select-modern:focus {
          background: var(--surface-raised);
          border-color: var(--border-default);
        }

        .jf-query-bar {
          display: flex;
          align-items: center;
          gap: var(--space-2);
        }

        .jf-query-input {
          background: var(--surface-sunken);
          border: 1px solid var(--border-subtle);
          color: var(--text-primary);
          font-family: var(--font-mono);
          font-size: var(--text-xs);
          padding: var(--space-1) var(--space-2);
          border-radius: var(--radius-sm);
          width: 200px;
        }

        .jf-query-input:focus {
          outline: none;
          border-color: var(--accent-default);
        }

        .jf-editor-split {
          display: flex;
          flex: 1;
          min-height: 0;
        }

        .jf-pane {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .jf-pane-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0 var(--space-4);
          height: 40px;
          background: var(--surface-raised);
          border-bottom: 1px solid var(--border-subtle);
          flex-shrink: 0;
        }

        .jf-pane-title {
          font-size: var(--text-xs);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-muted);
        }

        .jf-toolbar-actions {
          display: flex;
          align-items: center;
          gap: var(--space-2);
        }

        .jf-toolbar-divider {
          width: 1px;
          height: 16px;
          background: var(--border-default);
          margin: 0 var(--space-1);
        }

        .jf-btn-modern {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          background: transparent;
          border: none;
          color: var(--text-secondary);
          font-family: inherit;
          font-size: var(--text-xs);
          font-weight: 600;
          cursor: pointer;
          padding: var(--space-1) var(--space-2);
          border-radius: var(--radius-sm);
          transition: all 0.2s;
        }

        .jf-btn-modern:hover {
          color: var(--text-primary);
          background: var(--surface-sunken);
        }

        .jf-btn-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          padding: var(--space-1);
          border-radius: var(--radius-sm);
          transition: all 0.2s;
        }

        .jf-btn-icon:hover {
          color: var(--text-primary);
          background: var(--surface-sunken);
        }

        .jf-editor-wrapper {
          flex: 1;
          position: relative;
        }

        /* VS Code style status bar */
        .jf-status-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          height: 24px;
          background: #007acc;
          color: #ffffff;
          font-size: 11px;
          font-weight: 500;
          padding: 0 var(--space-4);
          flex-shrink: 0;
          user-select: none;
          transition: background-color 0.2s;
        }

        .jf-status-bar.has-error {
          background: #d32f2f; /* Dark red for high contrast with white text */
        }
        
        [data-theme="dark"] .jf-status-bar {
          background: #007acc;
          color: #ffffff;
        }

        [data-theme="dark"] .jf-status-bar.has-error {
          background: #d32f2f;
        }

        .jf-status-left, .jf-status-right {
          display: flex;
          align-items: center;
          gap: var(--space-2);
        }

        .jf-status-divider {
          opacity: 0.5;
        }

        .jf-status-error {
          display: flex;
          align-items: center;
          color: #ffffff;
          font-weight: 600;
        }

        .jf-status-success {
          display: flex;
          align-items: center;
          color: #ffffff;
        }

        /* Copied Toast */
        .jf-copied-toast {
          position: absolute;
          bottom: 100%;
          left: 50%;
          transform: translateX(-50%) translateY(-4px);
          background: var(--surface-inverse);
          color: var(--text-inverse);
          padding: 2px 8px;
          font-size: var(--text-xs);
          border-radius: var(--radius-sm);
          pointer-events: none;
          animation: jfFadeIn 0.15s ease-out;
          white-space: nowrap;
          z-index: 10;
        }

        @keyframes jfFadeIn {
          from { opacity: 0; transform: translateX(-50%) translateY(0); }
          to { opacity: 1; transform: translateX(-50%) translateY(-4px); }
        }
      `}</style>
    </div>
  );
}
