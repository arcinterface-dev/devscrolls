import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { base64UrlDecode, verifyHmacJwt, verifyRsaJwt, type VerificationResult } from './crypto';
import { STANDARD_CLAIMS, formatTimestamp, formatRelativeTime, SAMPLE_JWT, SAMPLE_SECRET } from './claims';
import { trackToolPageView, trackToolEvent } from '../../../lib/analytics';
import styles from './JwtDebugger.module.css';

export default function JwtDebugger() {
  const [token, setToken] = useState(SAMPLE_JWT);
  const [secret, setSecret] = useState(SAMPLE_SECRET);
  const [showSecret, setShowSecret] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [copiedPayload, setCopiedPayload] = useState(false);
  const [copiedHeader, setCopiedHeader] = useState(false);
  const [copiedClaimKey, setCopiedClaimKey] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileTab, setMobileTab] = useState<'encoded' | 'decoded'>('decoded');

  // Track viewport size for mobile view
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Track page view once per session
  useEffect(() => {
    trackToolPageView('jwt-debugger');
  }, []);

  // Split token into 3 distinct parts
  const parts = useMemo(() => {
    const raw = token.trim();
    const segments = raw.split('.');
    return {
      headerB64: segments[0] || '',
      payloadB64: segments[1] || '',
      signatureB64: segments[2] || '',
      isValidStructure: segments.length === 3
    };
  }, [token]);

  // Decode Header
  const decodedHeader = useMemo(() => {
    if (!parts.headerB64) return null;
    try {
      const jsonStr = base64UrlDecode(parts.headerB64);
      return JSON.parse(jsonStr);
    } catch {
      return null;
    }
  }, [parts.headerB64]);

  // Decode Payload
  const decodedPayload = useMemo(() => {
    if (!parts.payloadB64) return null;
    try {
      const jsonStr = base64UrlDecode(parts.payloadB64);
      return JSON.parse(jsonStr);
    } catch {
      return null;
    }
  }, [parts.payloadB64]);

  // Emit decode event when a valid token is entered
  useEffect(() => {
    if (decodedHeader && decodedPayload) {
      trackToolEvent('jwt-debugger', 'action', 'decode_jwt', {
        algorithm: decodedHeader.alg || 'UNKNOWN'
      });
    }
  }, [decodedHeader?.alg]);

  // Handle signature verification
  const handleVerify = useCallback(async () => {
    if (!parts.isValidStructure || !decodedHeader) return;
    setIsVerifying(true);

    const alg = (decodedHeader.alg || 'HS256').toUpperCase();

    try {
      let res: VerificationResult;
      if (alg.startsWith('HS')) {
        res = await verifyHmacJwt(
          parts.headerB64,
          parts.payloadB64,
          parts.signatureB64,
          secret,
          alg as any
        );
      } else if (alg.startsWith('RS')) {
        res = await verifyRsaJwt(
          parts.headerB64,
          parts.payloadB64,
          parts.signatureB64,
          secret,
          alg as any
        );
      } else {
        res = { valid: false, algorithm: alg, error: `Algorithm ${alg} is not yet supported for client-side WebCrypto verification.` };
      }

      setVerificationResult(res);
      trackToolEvent('jwt-debugger', 'action', 'verify_signature', {
        algorithm: alg,
        valid: res.valid
      });
    } catch (err: any) {
      setVerificationResult({ valid: false, algorithm: alg, error: err?.message || 'Verification error' });
    } finally {
      setIsVerifying(false);
    }
  }, [parts, decodedHeader, secret]);

  // Expiration calculations
  const expirationInfo = useMemo(() => {
    if (!decodedPayload || typeof decodedPayload.exp !== 'number') return null;
    const exp = decodedPayload.exp;
    const iat = typeof decodedPayload.iat === 'number' ? decodedPayload.iat : exp - 3600;
    const now = Math.floor(Date.now() / 1000);
    const { text, isExpired } = formatRelativeTime(exp);

    // Percentage calculation
    let progress = 100;
    if (exp > iat) {
      const elapsed = Math.max(0, now - iat);
      const total = exp - iat;
      progress = Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
    }

    return { exp, iat, text, isExpired, progress };
  }, [decodedPayload]);

  const handleCopyPayload = useCallback(async () => {
    if (!decodedPayload) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(decodedPayload, null, 2));
      setCopiedPayload(true);
      trackToolEvent('jwt-debugger', 'action', 'copy_payload');
      setTimeout(() => setCopiedPayload(false), 2000);
    } catch (err) {
      console.error('Failed to copy payload:', err);
    }
  }, [decodedPayload]);

  const handleCopyHeader = useCallback(async () => {
    if (!decodedHeader) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(decodedHeader, null, 2));
      setCopiedHeader(true);
      setTimeout(() => setCopiedHeader(false), 2000);
    } catch (err) {
      console.error('Failed to copy header:', err);
    }
  }, [decodedHeader]);

  const handleCopyClaimValue = useCallback(async (key: string, value: any) => {
    try {
      const textToCopy = typeof value === 'object' ? JSON.stringify(value) : String(value);
      await navigator.clipboard.writeText(textToCopy);
      setCopiedClaimKey(key);
      setTimeout(() => setCopiedClaimKey(null), 1500);
    } catch (err) {
      console.error('Failed to copy claim:', err);
    }
  }, []);

  const handleLoadSample = useCallback(() => {
    setToken(SAMPLE_JWT);
    setSecret(SAMPLE_SECRET);
    setVerificationResult(null);
  }, []);

  const handleClear = useCallback(() => {
    setToken('');
    setSecret('');
    setVerificationResult(null);
  }, []);

  return (
    <div className={styles.container}>
      {/* Top Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <span className={styles.toolBadge}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            JWT Inspector & Offline Verifier
          </span>
          <span className={styles.privacyBadge} title="Cryptographic verification performed using window.crypto.subtle. Tokens never leave your device.">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            Web Crypto API
          </span>
        </div>

        <div className={styles.toolbarRight}>
          <button type="button" className={styles.btn} onClick={handleLoadSample}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            <span className={styles.btnLabel}>Sample Token</span>
          </button>
          {token && (
            <button type="button" className={styles.btn} onClick={handleClear}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
              <span className={styles.btnLabel}>Clear</span>
            </button>
          )}
          <button 
            type="button" 
            className={`${styles.btn} ${styles.btnPrimary} ${copiedPayload ? styles.btnCopied : ''}`}
            onClick={handleCopyPayload}
            disabled={!decodedPayload}
          >
            {copiedPayload ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                <span className={styles.btnLabel}>Copied JSON!</span>
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
                <span className={styles.btnLabel}>Copy Payload</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Tab Segmented Switcher (Screens <= 768px) */}
      <div className={styles.mobileTabBar}>
        <button
          type="button"
          className={`${styles.mobileTabBtn} ${mobileTab === 'encoded' ? styles.mobileTabBtnActive : ''}`}
          onClick={() => setMobileTab('encoded')}
        >
          Encoded Token
        </button>
        <button
          type="button"
          className={`${styles.mobileTabBtn} ${mobileTab === 'decoded' ? styles.mobileTabBtnActive : ''}`}
          onClick={() => setMobileTab('decoded')}
        >
          Decoded Claims {expirationInfo?.isExpired ? '⚠️' : '✓'}
        </button>
      </div>

      {/* Split Workspace */}
      <div className={styles.workspace}>
        {/* Left Pane: Raw Encoded Token & Colored Preview */}
        <div className={`${styles.pane} ${mobileTab !== 'encoded' ? styles.paneMobileHidden : ''}`}>
          <div className={styles.paneHeader}>
            <div className={styles.paneHeaderTitle}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="16 18 22 12 16 6"/>
                <polyline points="8 6 2 12 8 18"/>
              </svg>
              Encoded Token
            </div>
            <div className={styles.tokenLegend}>
              <span className={styles.legendItem}>
                <span style={{ color: '#ef4444' }}>●</span> Header
              </span>
              <span className={styles.legendItem}>
                <span style={{ color: '#a855f7' }}>●</span> Payload
              </span>
              <span className={styles.legendItem}>
                <span style={{ color: '#06b6d4' }}>●</span> Signature
              </span>
            </div>
          </div>

          <div className={styles.editorWrapper}>
            <textarea
              className={styles.tokenTextarea}
              placeholder="Paste encoded JWT string here (e.g. eyJhbGciOi...)..."
              value={token}
              onChange={(e) => {
                setToken(e.target.value);
                setVerificationResult(null);
              }}
              spellCheck={false}
            />
          </div>

          {parts.isValidStructure && (
            <div className={styles.tokenColorPreview} title="Segment breakdown">
              <span className={styles.tokenHeaderColor}>{parts.headerB64}</span>
              <span style={{ color: 'var(--text-muted)' }}>.</span>
              <span className={styles.tokenPayloadColor}>{parts.payloadB64}</span>
              <span style={{ color: 'var(--text-muted)' }}>.</span>
              <span className={styles.tokenSignatureColor}>{parts.signatureB64}</span>
            </div>
          )}
        </div>

        <div className={`${styles.paneDivider} ${isMobile ? styles.paneMobileHidden : ''}`} />

        {/* Right Pane: Decoded Header, Payload, Claims, Expiry & Verifier */}
        <div className={`${styles.pane} ${mobileTab !== 'decoded' ? styles.paneMobileHidden : ''}`}>
          <div className={styles.paneHeader}>
            <div className={styles.paneHeaderTitle}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Decoded Token & Verification
            </div>
            {decodedHeader?.alg && (
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Algorithm: <strong>{decodedHeader.alg}</strong>
              </span>
            )}
          </div>

          <div className={styles.decodedScrollArea}>
            {/* Expiration Gauge Card */}
            {expirationInfo && (
              <div className={styles.expMeterCard}>
                <div className={styles.expMeterTop}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <polyline points="12 6 12 12 16 14"/>
                    </svg>
                    <strong>Token Expiration:</strong> {formatTimestamp(expirationInfo.exp)}
                  </div>
                  {expirationInfo.isExpired ? (
                    <span className={styles.statusBadgeExpired}>● {expirationInfo.text}</span>
                  ) : (
                    <span className={styles.statusBadgeValid}>● {expirationInfo.text}</span>
                  )}
                </div>
                <div className={styles.expProgressBar}>
                  <div 
                    className={styles.expProgressFill} 
                    style={{ 
                      width: `${expirationInfo.progress}%`,
                      backgroundColor: expirationInfo.isExpired ? '#ef4444' : '#10b981'
                    }} 
                  />
                </div>
              </div>
            )}

            {/* Header Block */}
            <div className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <span className={styles.tokenHeaderColor}>HEADER: Algorithm & Token Type</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    type="button"
                    className={styles.miniBtn}
                    onClick={handleCopyHeader}
                    disabled={!decodedHeader}
                    title="Copy Header JSON"
                  >
                    {copiedHeader ? 'Copied!' : 'Copy JSON'}
                  </button>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>JSON</span>
                </div>
              </div>
              <pre className={styles.codeBlock}>
                {decodedHeader ? JSON.stringify(decodedHeader, null, 2) : '// Invalid or empty header'}
              </pre>
            </div>

            {/* Payload Block */}
            <div className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className={styles.tokenPayloadColor}>PAYLOAD: Data Claims</span>
                  {decodedPayload && (
                    <span className={styles.claimCountBadge}>
                      {Object.keys(decodedPayload).length} claims
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    type="button"
                    className={styles.miniBtn}
                    onClick={handleCopyPayload}
                    disabled={!decodedPayload}
                    title="Copy payload JSON"
                  >
                    {copiedPayload ? 'Copied!' : 'Copy JSON'}
                  </button>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>JSON</span>
                </div>
              </div>
              <pre className={styles.codeBlock}>
                {decodedPayload ? JSON.stringify(decodedPayload, null, 2) : '// Invalid or empty payload'}
              </pre>
            </div>

            {/* Standard Claims Inspector Table */}
            {decodedPayload && Object.keys(decodedPayload).length > 0 && (
              <div className={styles.sectionCard}>
                <div className={styles.sectionHeader}>
                  <span>Claims Inspector</span>
                </div>
                <table className={styles.claimsTable}>
                  <thead>
                    <tr>
                      <th>Claim</th>
                      <th>Value</th>
                      <th>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(decodedPayload).map(([key, val]) => {
                      const standard = STANDARD_CLAIMS[key];
                      const isDate = standard?.isDate && typeof val === 'number';
                      return (
                        <tr key={key}>
                          <td className={styles.claimKey}>{key}</td>
                          <td className={styles.claimValueCell}>
                            <div className={styles.claimValueRow}>
                              <div className={styles.claimValueText}>
                                {isDate ? (
                                  <>
                                    <span>{String(val)}</span>
                                    <span className={styles.claimTimestamp}>({formatTimestamp(val)})</span>
                                  </>
                                ) : (
                                  <span>{String(typeof val === 'object' ? JSON.stringify(val) : val)}</span>
                                )}
                              </div>
                              <button
                                type="button"
                                className={`${styles.claimCopyBtn} ${copiedClaimKey === key ? styles.claimCopyBtnSuccess : ''}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopyClaimValue(key, val);
                                }}
                                title="Copy claim value"
                              >
                                {copiedClaimKey === key ? (
                                  <>
                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                      <polyline points="20 6 9 17 4 12"/>
                                    </svg>
                                    <span>Copied!</span>
                                  </>
                                ) : (
                                  <>
                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                                      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
                                    </svg>
                                    <span>Copy</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </td>
                          <td style={{ color: 'var(--text-secondary)' }}>
                            {standard ? standard.description : 'Custom application claim'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Signature Verifier Box */}
            <div className={styles.verifySection}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '12px', fontWeight: 600 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                  Verify Signature (Offline Web Crypto)
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {decodedHeader?.alg || 'HS256'}
                </span>
              </div>

              <div className={styles.secretInputRow}>
                <input
                  type={showSecret ? 'text' : 'password'}
                  className={styles.secretInput}
                  placeholder={`Enter secret or public key to verify ${decodedHeader?.alg || 'HS256'}...`}
                  value={secret}
                  onChange={(e) => {
                    setSecret(e.target.value);
                    setVerificationResult(null);
                  }}
                />
                <button
                  type="button"
                  className={styles.btn}
                  onClick={() => setShowSecret(!showSecret)}
                  title={showSecret ? 'Hide secret' : 'Show secret'}
                >
                  {showSecret ? 'Hide' : 'Show'}
                </button>
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnPrimary}`}
                  onClick={handleVerify}
                  disabled={isVerifying || !parts.isValidStructure}
                >
                  {isVerifying ? 'Verifying...' : 'Verify'}
                </button>
              </div>

              {verificationResult && (
                <div>
                  {verificationResult.valid ? (
                    <div className={styles.verifyResultValid}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      Signature Verified Successfully! The token has not been tampered with.
                    </div>
                  ) : (
                    <div className={styles.verifyResultInvalid}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="15" y1="9" x2="9" y2="15"/>
                        <line x1="9" y1="9" x2="15" y2="15"/>
                      </svg>
                      {verificationResult.error || 'Invalid Signature: Key does not match token.'}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
