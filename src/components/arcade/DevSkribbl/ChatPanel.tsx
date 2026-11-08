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

const REACTIONS = ['🔥', '😂', '👏', '🤔', '💩', '💀', '🚀'];

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
    <div className="chat-panel-container">
      <div className="chat-header">
        <span className="chat-title">CHAT & GUESSES</span>
        {hasGuessedCorrectly && <span className="guessed-status">✓ Solved</span>}
      </div>

      <div className="messages-stream">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`chat-msg ${
              msg.isCorrect
                ? 'msg-correct'
                : msg.isClose
                ? 'msg-close'
                : msg.isSystem
                ? 'msg-system'
                : msg.isSolvedChat
                ? 'msg-solved-chat'
                : ''
            }`}
          >
            {msg.isSystem ? (
              <span className="system-text">📢 {msg.text}</span>
            ) : msg.isClose ? (
              <span className="close-text">🤏 <strong>{msg.text}</strong> is super close!</span>
            ) : msg.isCorrect ? (
              <span className="correct-text">🎉 <strong>{msg.senderName}</strong> guessed the word!</span>
            ) : msg.isSolvedChat ? (
              <span>
                <span className="solved-badge">SOLVED</span>
                <strong className="sender-name">{msg.senderName}:</strong> {msg.text}
              </span>
            ) : (
              <span>
                <strong className="sender-name">{msg.senderName}:</strong> {msg.text}
              </span>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Floating Reaction Bar */}
      <div className="reaction-strip">
        {REACTIONS.map((em) => (
          <button
            key={em}
            type="button"
            onClick={() => handleReactionClick(em)}
            className="reaction-btn"
            title={`Send ${em}`}
          >
            {em}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="chat-input-bar">
        <input
          type="text"
          value={inputText}
          maxLength={40}
          disabled={isArtist}
          placeholder={
            isArtist
              ? 'You are drawing! You cannot guess.'
              : hasGuessedCorrectly
              ? 'Chat with other solvers...'
              : 'Type your guess here...'
          }
          onChange={(e) => setInputText(e.target.value)}
          className="chat-field"
        />
        <button
          type="submit"
          disabled={isArtist || !inputText.trim()}
          className="chat-send-btn"
        >
          Send
        </button>
      </form>

      <style>{`
        .chat-panel-container {
          background: var(--surface-raised);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-md);
          display: flex;
          flex-direction: column;
          height: 100%;
          min-height: 240px;
          overflow: hidden;
        }

        .chat-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 12px;
          background: var(--surface-sunken);
          border-bottom: 1px solid var(--border-subtle);
          font-size: 11px;
        }

        .chat-title {
          font-weight: 800;
          color: var(--text-muted);
          letter-spacing: 0.05em;
        }

        .guessed-status {
          font-size: 10px;
          font-weight: 800;
          color: #10b981;
          background: rgba(16, 185, 129, 0.15);
          padding: 2px 6px;
          border-radius: 4px;
        }

        .messages-stream {
          flex: 1;
          padding: 8px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 6px;
          font-size: 12.5px;
        }

        .chat-msg {
          padding: 6px 9px;
          border-radius: var(--radius-sm);
          background: var(--surface-sunken);
          color: var(--text-primary);
          word-break: break-word;
          line-height: 1.4;
        }

        .sender-name {
          color: var(--accent-default);
          font-weight: 750;
          margin-right: 4px;
        }

        .msg-correct {
          background: rgba(16, 185, 129, 0.12);
          border: 1px solid rgba(16, 185, 129, 0.35);
          color: #10b981;
          font-weight: 700;
        }

        .msg-close {
          background: rgba(245, 158, 11, 0.12);
          border: 1px solid rgba(245, 158, 11, 0.35);
          color: #d97706;
          font-weight: 700;
          animation: pulse 1s ease-in-out;
        }

        .msg-solved-chat {
          background: rgba(59, 130, 246, 0.1);
          border-left: 2px solid #3b82f6;
          color: var(--text-primary);
        }

        .solved-badge {
          background: #3b82f6;
          color: #ffffff;
          font-size: 9px;
          font-weight: 800;
          padding: 1px 4px;
          border-radius: 3px;
          margin-right: 6px;
        }

        .msg-system {
          background: var(--surface-sunken);
          color: var(--text-muted);
          font-size: 11.5px;
          font-style: italic;
        }

        .reaction-strip {
          display: flex;
          align-items: center;
          justify-content: space-around;
          background: var(--surface-sunken);
          border-top: 1px solid var(--border-subtle);
          padding: 4px 6px;
        }

        .reaction-btn {
          background: transparent;
          border: none;
          font-size: 16px;
          cursor: pointer;
          padding: 3px 6px;
          border-radius: 4px;
          transition: transform 0.15s ease, background 0.15s;
        }
        .reaction-btn:hover {
          transform: scale(1.25);
          background: var(--surface-raised);
        }

        .chat-input-bar {
          display: flex;
          gap: 6px;
          padding: 8px;
          background: var(--surface-sunken);
          border-top: 1px solid var(--border-subtle);
        }

        .chat-field {
          flex: 1;
          background: var(--surface-raised);
          border: 1px solid var(--border-default);
          color: var(--text-primary);
          padding: 7px 10px;
          border-radius: var(--radius-sm);
          font-size: 12.5px;
          outline: none;
        }

        .chat-field:focus {
          border-color: var(--accent-default);
        }

        .chat-field:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .chat-send-btn {
          padding: 7px 14px;
          background: var(--accent-default);
          color: #ffffff;
          border: none;
          border-radius: var(--radius-sm);
          font-size: 12.5px;
          font-weight: 750;
          cursor: pointer;
          transition: filter 0.15s;
        }
        .chat-send-btn:hover:not(:disabled) {
          filter: brightness(1.1);
        }

        .chat-send-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

