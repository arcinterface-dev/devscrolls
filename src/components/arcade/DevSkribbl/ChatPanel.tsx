import React, { useState, useEffect, useRef } from 'react';

export interface ChatMessage {
  id: string;
  senderName: string;
  senderId: string;
  text: string;
  isCorrect?: boolean;
  isClose?: boolean;
  isSystem?: boolean;
  isSolvedChat?: boolean;
}

interface ChatPanelProps {
  messages: ChatMessage[];
  isArtist: boolean;
  hasGuessedCorrectly: boolean;
  onSendMessage: (text: string) => void;
  onSendReaction?: (emoji: string) => void;
}

const REACTIONS = ['🔥', '😂', '👏', '🤔', '💀', '🚀'];

export const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  isArtist,
  hasGuessedCorrectly,
  onSendMessage,
  onSendReaction,
}) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed || isArtist) return;
    onSendMessage(trimmed);
    setInputText('');
  };

  const handleReactionClick = (emoji: string) => {
    onSendReaction?.(emoji);
  };

  return (
    <div className="modern-chat-panel">
      {/* Header */}
      <div className="chat-panel-header">
        <div className="header-left">
          <span className="chat-header-title">Guesses</span>
          <span className="live-dot" title="Live chat active" />
        </div>
        {hasGuessedCorrectly && (
          <span className="solved-pill">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Solved
          </span>
        )}
      </div>

      {/* Message Feed */}
      <div className="messages-stream">
        {messages.length === 0 ? (
          <div className="chat-empty-state">
            <span>Type your guess below...</span>
          </div>
        ) : (
          messages.map((msg) => {
            if (msg.isSystem) {
              return (
                <div key={msg.id} className="chat-row row-system">
                  <span className="system-icon">📢</span>
                  <span className="system-text">{msg.text}</span>
                </div>
              );
            }

            if (msg.isCorrect) {
              return (
                <div key={msg.id} className="chat-row row-correct">
                  <span className="correct-icon">🎉</span>
                  <span className="correct-text">
                    <strong>{msg.senderName}</strong> guessed the word!
                  </span>
                </div>
              );
            }

            if (msg.isClose) {
              return (
                <div key={msg.id} className="chat-row row-close">
                  <span className="close-icon">🤏</span>
                  <span className="close-text">
                    &ldquo;{msg.text}&rdquo; is super close!
                  </span>
                </div>
              );
            }

            return (
              <div
                key={msg.id}
                className={`chat-row ${msg.isSolvedChat ? 'row-solver-chat' : ''}`}
              >
                {msg.isSolvedChat && <span className="solver-tag">Solver</span>}
                <span className="msg-sender">{msg.senderName}</span>
                <span className="msg-text">{msg.text}</span>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Reactions Bar (Compact Pill Row) */}
      <div className="compact-reactions-row">
        {REACTIONS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => handleReactionClick(emoji)}
            className="mini-rx-btn"
            title={`React ${emoji}`}
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Input Bar */}
      <form onSubmit={handleSubmit} className="modern-chat-form">
        <input
          type="text"
          value={inputText}
          maxLength={40}
          disabled={isArtist}
          placeholder={
            isArtist
              ? 'You are drawing! No guessing.'
              : hasGuessedCorrectly
              ? 'Chat with other solvers...'
              : 'Type a guess...'
          }
          onChange={(e) => setInputText(e.target.value)}
          className="chat-text-input"
        />
        <button
          type="submit"
          disabled={isArtist || !inputText.trim()}
          className="chat-submit-btn"
          aria-label="Send guess"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </form>

      <style>{`
        .modern-chat-panel {
          background: var(--surface-raised);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg);
          display: flex;
          flex-direction: column;
          height: 100%;
          min-height: 240px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
        }

        .chat-panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 14px;
          border-bottom: 1px solid var(--border-subtle);
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .chat-header-title {
          font-size: 11px;
          font-weight: 750;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        .live-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #10b981;
          display: inline-block;
          animation: pulse 2s infinite;
        }

        .solved-pill {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 10.5px;
          font-weight: 700;
          color: #10b981;
          background: rgba(16, 185, 129, 0.12);
          padding: 2px 8px;
          border-radius: var(--radius-full);
        }

        /* Stream */
        .messages-stream {
          flex: 1;
          padding: 8px 10px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 4px;
          font-size: 13px;
        }

        .chat-empty-state {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-muted);
          font-size: 12px;
          font-style: italic;
        }

        .chat-row {
          display: flex;
          align-items: baseline;
          gap: 6px;
          padding: 3px 6px;
          border-radius: var(--radius-sm);
          line-height: 1.4;
          word-break: break-word;
          transition: background 0.1s;
        }

        .chat-row:hover {
          background: var(--surface-sunken);
        }

        .msg-sender {
          font-weight: 700;
          color: var(--text-secondary);
          font-size: 12px;
          flex-shrink: 0;
        }

        .msg-sender::after {
          content: ':';
        }

        .msg-text {
          color: var(--text-primary);
        }

        /* Special message types */
        .row-correct {
          background: rgba(16, 185, 129, 0.1);
          border-left: 2px solid #10b981;
          color: #10b981;
          padding: 4px 8px;
          font-size: 12.5px;
        }

        .correct-text strong {
          color: #10b981;
        }

        .row-close {
          background: rgba(245, 158, 11, 0.1);
          border-left: 2px solid #f59e0b;
          color: #d97706;
          padding: 4px 8px;
          font-size: 12.5px;
        }

        .row-system {
          color: var(--text-muted);
          font-size: 11.5px;
          font-style: italic;
          padding: 2px 6px;
        }

        .row-solver-chat {
          background: rgba(59, 130, 246, 0.06);
          border-left: 2px solid #3b82f6;
        }

        .solver-tag {
          font-size: 9px;
          font-weight: 750;
          text-transform: uppercase;
          color: #3b82f6;
          background: rgba(59, 130, 246, 0.15);
          padding: 1px 4px;
          border-radius: 3px;
          margin-right: 2px;
        }

        /* Reactions */
        .compact-reactions-row {
          display: flex;
          align-items: center;
          justify-content: space-around;
          padding: 4px 8px;
          border-top: 1px solid var(--border-subtle);
          background: var(--surface-sunken);
        }

        .mini-rx-btn {
          background: transparent;
          border: none;
          font-size: 15px;
          cursor: pointer;
          padding: 2px 6px;
          border-radius: var(--radius-sm);
          transition: transform 0.15s, background 0.15s;
          line-height: 1;
        }

        .mini-rx-btn:hover {
          transform: scale(1.2);
          background: var(--surface-raised);
        }

        /* Input Form */
        .modern-chat-form {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 10px;
          border-top: 1px solid var(--border-subtle);
          background: var(--surface-raised);
        }

        .chat-text-input {
          flex: 1;
          background: var(--surface-sunken);
          border: 1px solid var(--border-subtle);
          color: var(--text-primary);
          padding: 7px 12px;
          border-radius: var(--radius-full);
          font-size: 12.5px;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
        }

        .chat-text-input:focus {
          border-color: var(--accent-default);
          box-shadow: 0 0 0 2px rgba(217, 119, 6, 0.15);
        }

        .chat-text-input:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .chat-submit-btn {
          width: 32px;
          height: 32px;
          border-radius: var(--radius-full);
          background: var(--accent-default);
          color: #ffffff;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: opacity 0.15s, transform 0.1s;
          flex-shrink: 0;
          padding: 0;
        }

        .chat-submit-btn:hover:not(:disabled) {
          transform: scale(1.05);
        }

        .chat-submit-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};
