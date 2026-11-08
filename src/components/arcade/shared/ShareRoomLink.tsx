import React, { useState } from 'react';

interface ShareRoomLinkProps {
  roomId: string;
  gameTitle?: string;
}

export const ShareRoomLink: React.FC<ShareRoomLinkProps> = ({ roomId, gameTitle = 'game' }) => {
  const [copied, setCopied] = useState(false);

  const getFullUrl = () => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('room', roomId);
      return url.toString();
    }
    return `https://devscrolls.dev/games/?room=${roomId}`;
  };

  const handleCopy = async () => {
    const fullUrl = getFullUrl();
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(fullUrl);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = fullUrl;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    } catch (err) {
      console.error('Failed to copy room link:', err);
    }
  };

  return (
    <div className="share-room-container">
      <div className="room-code-tag">
        <span className="room-code-label">Room Code:</span>
        <code className="room-code-value">{roomId}</code>
      </div>

      <button
        type="button"
        onClick={handleCopy}
        className={`share-copy-btn ${copied ? 'copied' : ''}`}
        title="Copy invitation link to clipboard"
      >
        {copied ? (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <span>Link Copied!</span>
          </>
        ) : (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
            </svg>
            <span>Invite Team / Copy Link</span>
          </>
        )}
      </button>

      <style>{`
        .share-room-container {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
          background: var(--surface-raised);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          padding: 10px 14px;
        }

        .room-code-tag {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .room-code-label {
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-muted);
          font-weight: 600;
        }

        .room-code-value {
          font-family: var(--font-mono, monospace);
          font-size: 15px;
          font-weight: 700;
          color: var(--accent-default);
          background: color-mix(in srgb, var(--accent-default) 10%, transparent);
          padding: 2px 8px;
          border-radius: var(--radius-sm);
          letter-spacing: 0.1em;
        }

        .share-copy-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px;
          border-radius: var(--radius-sm);
          border: 1px solid var(--accent-default);
          background: var(--accent-default);
          color: #ffffff;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .share-copy-btn:hover {
          filter: brightness(1.1);
          transform: translateY(-1px);
        }

        .share-copy-btn.copied {
          background: #10b981;
          border-color: #10b981;
        }
      `}</style>
    </div>
  );
};
