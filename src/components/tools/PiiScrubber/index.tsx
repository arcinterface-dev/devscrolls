import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { PII_PATTERNS, scrubPii, SAMPLE_DIRTY_LOG, type PatternRule } from './patterns';
import { trackToolPageView, trackToolEvent } from '../../../lib/analytics';
import styles from './PiiScrubber.module.css';

export default function PiiScrubber() {
  const [input, setInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileTab, setMobileTab] = useState<'input' | 'output'>('input');
  const [isDragging, setIsDragging] = useState(false);
  
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const outputRef = useRef<HTMLPreElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isSyncingScroll = useRef(false);

  // All patterns active by default
  const [activePatterns, setActivePatterns] = useState<Set<string>>(() => {
    return new Set(PII_PATTERNS.map(p => p.id));
  });

  // Track viewport size for mobile tab view
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Track page view once per session
  useEffect(() => {
    trackToolPageView('pii-scrubber');
  }, []);

  // Scrub computation with memoization
  const result = useMemo(() => {
    return scrubPii(input, activePatterns);
  }, [input, activePatterns]);

  // Debounced telemetry tracking on significant scrubs
  useEffect(() => {
    if (!input || result.totalRedactions === 0) return;

    const timer = setTimeout(() => {
      trackToolEvent('pii-scrubber', 'action', 'scrub_text', {
        char_count: input.length,
        secrets_found: result.categoryCounts
      });
    }, 1500);

    return () => clearTimeout(timer);
  }, [input, result.totalRedactions, result.categoryCounts]);

  // Synchronized scrolling between input and output panes on desktop
  const handleInputScroll = () => {
    if (isMobile || isSyncingScroll.current || !inputRef.current || !outputRef.current) return;
    isSyncingScroll.current = true;
    const inputEl = inputRef.current;
    const outputEl = outputRef.current;
    const maxInputScroll = inputEl.scrollHeight - inputEl.clientHeight;
    if (maxInputScroll > 0) {
      const scrollPct = inputEl.scrollTop / maxInputScroll;
      const maxOutputScroll = outputEl.scrollHeight - outputEl.clientHeight;
      outputEl.scrollTop = scrollPct * maxOutputScroll;
    }
    requestAnimationFrame(() => {
      isSyncingScroll.current = false;
    });
  };

  const handleOutputScroll = () => {
    if (isMobile || isSyncingScroll.current || !inputRef.current || !outputRef.current) return;
    isSyncingScroll.current = true;
    const inputEl = inputRef.current;
    const outputEl = outputRef.current;
    const maxOutputScroll = outputEl.scrollHeight - outputEl.clientHeight;
    if (maxOutputScroll > 0) {
      const scrollPct = outputEl.scrollTop / maxOutputScroll;
      const maxInputScroll = inputEl.scrollHeight - inputEl.clientHeight;
      inputEl.scrollTop = scrollPct * maxInputScroll;
    }
    requestAnimationFrame(() => {
      isSyncingScroll.current = false;
    });
  };

  const togglePattern = useCallback((id: string) => {
    setActivePatterns(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectAllPatterns = useCallback(() => {
    setActivePatterns(new Set(PII_PATTERNS.map(p => p.id)));
  }, []);

  const deselectAllPatterns = useCallback(() => {
    setActivePatterns(new Set());
  }, []);

  const handleCopy = useCallback(async () => {
    if (!result.scrubbedText) return;
    try {
      await navigator.clipboard.writeText(result.scrubbedText);
      setCopied(true);
      trackToolEvent('pii-scrubber', 'action', 'copy_scrubbed', {
        char_count: result.scrubbedText.length,
        redactions: result.totalRedactions
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy scrubbed text:', err);
    }
  }, [result.scrubbedText, result.totalRedactions]);

  const handleDownload = useCallback(() => {
    if (!result.scrubbedText) return;
    try {
      const blob = new Blob([result.scrubbedText], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `sanitized-log-${new Date().toISOString().slice(0, 10)}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download log:', err);
    }
  }, [result.scrubbedText]);

  const handleLoadSample = useCallback(() => {
    setInput(SAMPLE_DIRTY_LOG);
  }, []);

  const handleClear = useCallback(() => {
    setInput('');
  }, []);

  // File drag-and-drop support
  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (content) setInput(content);
      };
      reader.readAsText(file);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (content) setInput(content);
      };
      reader.readAsText(file);
    }
  }, []);

  // Stats computation
  const lineCount = input ? input.split('\n').length : 0;
  const charCount = input.length;

  // Visual Token Highlighting for Redacted Tokens
  const renderHighlightedOutput = useCallback((text: string) => {
    if (!text) return null;
    const tokenRegex = /(\[REDACTED_[A-Z0-9_]+\])/g;
    const parts = text.split(tokenRegex);

    return parts.map((part, i) => {
      if (part.startsWith('[REDACTED_') && part.endsWith(']')) {
        const pattern = PII_PATTERNS.find(p => p.mask.includes(part));
        const color = pattern?.color || '#ef4444';
        return (
          <mark
            key={i}
            className={styles.redactedToken}
            style={{
              color: color,
              borderColor: color,
              backgroundColor: `${color}1f`
            }}
            title={pattern ? `${pattern.label} Redacted` : 'Secret Redacted'}
          >
            {part}
          </mark>
        );
      }
      return part;
    });
  }, []);

  return (
    <div className={styles.container}>
      {/* Top Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <span className={styles.toolBadge}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            PII & Secret Scrubber
          </span>
          <span className={styles.privacyBadge} title="All regex processing executes purely inside your local browser. Zero log data is ever transmitted.">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            100% Client-Side
          </span>
        </div>

        <div className={styles.toolbarRight}>
          {/* Hidden file input for file uploading */}
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileSelect} 
            style={{ display: 'none' }} 
            accept=".log,.txt,.env,.json,.csv"
          />

          <button
            type="button"
            className={styles.btn}
            onClick={() => fileInputRef.current?.click()}
            title="Upload log or .env file from disk"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            <span className={styles.btnLabel}>Upload File</span>
          </button>

          <button 
            type="button"
            className={styles.btn} 
            onClick={handleLoadSample} 
            title="Load a test log snippet with realistic API keys, JWTs, and database URLs"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
            <span className={styles.btnLabel}>Sample Log</span>
          </button>
          
          {input && (
            <button 
              type="button"
              className={styles.btn} 
              onClick={handleClear} 
              title="Clear input and output buffers"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
              <span className={styles.btnLabel}>Clear</span>
            </button>
          )}

          {result.scrubbedText && (
            <button
              type="button"
              className={styles.btn}
              onClick={handleDownload}
              title="Download sanitized text as a clean log file"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              <span className={styles.btnLabel}>Download</span>
            </button>
          )}

          <button 
            type="button"
            className={`${styles.btn} ${styles.btnPrimary} ${copied ? styles.btnCopied : ''}`}
            onClick={handleCopy}
            disabled={!result.scrubbedText}
            title="Copy sanitized logs directly to clipboard ready for AI chatbots"
          >
            {copied ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                <span className={styles.btnLabel}>Copied Clean!</span>
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
                <span className={styles.btnLabel}>Copy Clean Text</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Pattern Filters Bar */}
      <div className={styles.filterBar}>
        <span className={styles.filterLabel}>Filters:</span>
        <button 
          type="button"
          className={styles.filterPill} 
          onClick={activePatterns.size === PII_PATTERNS.length ? deselectAllPatterns : selectAllPatterns}
          title="Toggle all filters"
        >
          {activePatterns.size === PII_PATTERNS.length ? 'Disable All' : 'Enable All'}
        </button>

        {PII_PATTERNS.map(pattern => {
          const isActive = activePatterns.has(pattern.id);
          const count = result.categoryCounts[pattern.id] || 0;
          return (
            <button
              key={pattern.id}
              type="button"
              className={`${styles.filterPill} ${isActive ? styles.filterPillActive : ''}`}
              onClick={() => togglePattern(pattern.id)}
              title={`${pattern.label}: ${pattern.description}`}
              style={{
                borderColor: isActive && count > 0 ? pattern.color : undefined
              }}
            >
              <span 
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  backgroundColor: isActive ? pattern.color : 'var(--text-muted)'
                }}
              />
              {pattern.label}
              {count > 0 && <span className={styles.filterCount}>{count}</span>}
            </button>
          );
        })}
      </div>

      {/* Mobile Segmented Tab Switcher (Visible only on <= 768px screens) */}
      <div className={styles.mobileTabBar}>
        <button
          type="button"
          className={`${styles.mobileTabBtn} ${mobileTab === 'input' ? styles.mobileTabBtnActive : ''}`}
          onClick={() => setMobileTab('input')}
        >
          Raw Logs ({lineCount} lines)
        </button>
        <button
          type="button"
          className={`${styles.mobileTabBtn} ${mobileTab === 'output' ? styles.mobileTabBtnActive : ''}`}
          onClick={() => setMobileTab('output')}
        >
          Clean Output {result.totalRedactions > 0 ? `(${result.totalRedactions} redacted)` : ''}
        </button>
      </div>

      {/* Split Workspace */}
      <div className={styles.workspace}>
        {/* Left Pane: Raw Dirty Log */}
        <div 
          className={`${styles.pane} ${mobileTab !== 'input' ? styles.paneMobileHidden : ''}`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleFileDrop}
        >
          {isDragging && (
            <div className={styles.dragOverlay}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              <span>Drop log or text file here</span>
            </div>
          )}

          <div className={styles.paneHeader}>
            <div className={styles.paneTitle}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
              Raw Logs / Text (Paste Here)
            </div>
            <span>{charCount > 0 ? `${lineCount} lines • ${charCount} chars` : 'Empty'}</span>
          </div>

          <div className={styles.editorWrapper}>
            <textarea
              ref={inputRef}
              className={styles.textArea}
              placeholder="Paste raw server logs, stack traces, shell outputs, or config files here... Or drag & drop a .log file directly."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onScroll={handleInputScroll}
              spellCheck={false}
              autoFocus
            />
          </div>
        </div>

        <div className={`${styles.paneDivider} ${isMobile ? styles.paneMobileHidden : ''}`} />

        {/* Right Pane: Sanitized Safe Output */}
        <div className={`${styles.pane} ${mobileTab !== 'output' ? styles.paneMobileHidden : ''}`}>
          <div className={styles.paneHeader}>
            <div className={styles.paneTitle}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Sanitized Safe Output (Ready for AI)
            </div>
            <span>
              {result.totalRedactions > 0 ? (
                <span className={styles.alertRedacted}>🛡 {result.totalRedactions} secrets redacted</span>
              ) : input ? (
                '✓ No secrets found'
              ) : (
                'Waiting for input'
              )}
            </span>
          </div>

          <div className={styles.editorWrapper}>
            {result.scrubbedText ? (
              <pre ref={outputRef} className={styles.outputArea} onScroll={handleOutputScroll}>
                {renderHighlightedOutput(result.scrubbedText)}
              </pre>
            ) : (
              <div className={styles.emptyState}>
                <svg className={styles.emptyStateIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                <div>
                  <strong>No logs to sanitize yet</strong>
                  <p style={{ margin: '4px 0 0 0', fontSize: '12px' }}>
                    Paste your text on the left or click "Sample Log" above to test.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Status Bar */}
      <div className={styles.summaryBar}>
        <div className={styles.summaryBadges}>
          <span className={styles.statItem}>
            Redactions: <span className={styles.statNumber}>{result.totalRedactions}</span>
          </span>
          {Object.entries(result.categoryCounts).map(([catId, count]) => {
            const pattern = PII_PATTERNS.find(p => p.id === catId);
            if (!pattern) return null;
            return (
              <span 
                key={catId} 
                className={styles.statItem} 
                style={{ 
                  backgroundColor: 'var(--surface-sunken)', 
                  padding: '2px 6px', 
                  borderRadius: 4, 
                  border: '1px solid var(--border-subtle)' 
                }}
              >
                <span style={{ color: pattern.color }}>●</span> {pattern.label}: <strong>{count}</strong>
              </span>
            );
          })}
        </div>

        <div className={styles.tipText}>
          Tip: Safely paste into ChatGPT, Claude, DeepSeek, or GitHub Copilot without leaking credentials.
        </div>
      </div>
    </div>
  );
}
