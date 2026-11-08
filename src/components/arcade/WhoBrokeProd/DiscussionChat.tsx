import React, { useState, useEffect, useRef } from 'react';

export interface PostmortemChatMessage {
  id: string;
  senderName: string;
  senderId: string;
  text: string;
  isQuestion?: boolean;
}

interface DiscussionChatProps {
  messages: PostmortemChatMessage[];
  timeLeft: number;
  onSendMessage: (text: string) => void;
  onAdvanceToVote: () => void;
  isHost: boolean;
}

export const DiscussionChat: React.FC<DiscussionChatProps> = ({
  messages,
  timeLeft,
  onSendMessage,
  onAdvanceToVote,
  isHost,
}) => {
  const [inputText, setInputText] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed) return;
    onSendMessage(trimmed);
    setInputText('');
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="discussion-chat-wrap">
      <div className="chat-top-bar">
        <div className="timer-tag">
          <span>⏱️ Investigation Time:</span>
          <strong>{minutes}:{seconds.toString().padStart(2, '0')}</strong>
        </div>

        {isHost && (
          <button
            type="button"
            onClick={onAdvanceToVote}
            className="call-vote-btn"
            title="End discussion and start voting"
          >
            🗳️ Call Team Vote Now
          </button>
        )}
      </div>

      <div className="chat-stream">
        {messages.map((m) => (
          <div key={m.id} className="chat-row">
            <strong className="sender-tag">{m.senderName}:</strong>
            <span className="msg-content">{m.text}</span>
          </div>
        ))}
        {messages.length === 0 && (
          <div className="empty-discussion">
            <span>Ask questions: "What tier service was hit?", "Did we deploy Friday?", "Was it CPU or Memory?"</span>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="chat-input-bar">
        <input
          type="text"
          value={inputText}
          placeholder="Ask a question or provide an answer..."
          onChange={(e) => setInputText(e.target.value)}
          className="chat-input"
        />
        <button type="submit" disabled={!inputText.trim()} className="chat-btn">
          Send
        </button>
      </form>

      <style>{`
        .discussion-chat-wrap {
          background: #0f172a;
          border: 1px solid #1e293b;
          border-radius: var(--radius-md);
          display: flex;
          flex-direction: column;
          height: 320px;
          overflow: hidden;
        }

        .chat-top-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 12px;
          background: #1e293b;
          border-bottom: 1px solid #334155;
          font-size: 11.5px;
        }

        .timer-tag {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #94a3b8;
        }

        .timer-tag strong {
          font-family: var(--font-mono, monospace);
          font-size: 13px;
          color: #38bdf8;
        }

        .call-vote-btn {
          background: #f97316;
          color: #ffffff;
          border: none;
          padding: 4px 10px;
          border-radius: var(--radius-sm);
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
        }

        .call-vote-btn:hover {
          filter: brightness(1.1);
        }

        .chat-stream {
          flex: 1;
          padding: 10px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 6px;
          font-size: 13px;
        }

        .chat-row {
          padding: 4px 8px;
          background: #1e293b;
          border-radius: 4px;
          color: #f1f5f9;
        }

        .sender-tag {
          color: #38bdf8;
          margin-right: 6px;
        }

        .empty-discussion {
          padding: 24px;
          text-align: center;
          font-size: 12px;
          color: #64748b;
        }

        .chat-input-bar {
          display: flex;
          gap: 6px;
          padding: 8px;
          background: #1e293b;
          border-top: 1px solid #334155;
        }

        .chat-input {
          flex: 1;
          background: #0f172a;
          border: 1px solid #334155;
          color: #ffffff;
          padding: 8px 10px;
          border-radius: var(--radius-sm);
          font-size: 13px;
          outline: none;
        }

        .chat-input:focus {
          border-color: var(--accent-default);
        }

        .chat-btn {
          padding: 8px 14px;
          background: var(--accent-default);
          color: #ffffff;
          border: none;
          border-radius: var(--radius-sm);
          font-weight: 700;
          font-size: 12px;
          cursor: pointer;
        }

        .chat-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};
