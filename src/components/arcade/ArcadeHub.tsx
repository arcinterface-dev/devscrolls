import React, { useState, useEffect, useMemo, useRef } from 'react';
import { GAMES, SOLO_GAMES, MULTIPLAYER_GAMES, type GameMeta } from './shared/constants';
import { storage } from './shared/storage';

export const ArcadeHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'solo' | 'multiplayer'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [scores, setScores] = useState<Record<string, { high: number; streak: number }>>({});
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [selectedGameForJoin, setSelectedGameForJoin] = useState('dev-skribbl');
  const [joinError, setJoinError] = useState('');

  const joinInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const scoresMap: Record<string, { high: number; streak: number }> = {};
    GAMES.forEach((game) => {
      scoresMap[game.id] = {
        high: storage.getHighScore(game.id),
        streak: storage.getStreak(game.id).count,
      };
    });
    setScores(scoresMap);
  }, []);

  useEffect(() => {
    if (isJoinModalOpen) {
      setTimeout(() => joinInputRef.current?.focus(), 50);
    }
  }, [isJoinModalOpen]);

  const filteredGames = useMemo(() => {
    return GAMES.filter((game) => {
      const matchesTab =
        activeTab === 'all' ||
        (activeTab === 'solo' && game.mode === 'solo') ||
        (activeTab === 'multiplayer' && game.mode === 'multiplayer');

      const matchesSearch =
        searchQuery === '' ||
        game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        game.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        game.tagline.toLowerCase().includes(searchQuery.toLowerCase()) ||
        game.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesTab && matchesSearch;
    });
  }, [activeTab, searchQuery]);

  const handleRandomPlay = () => {
    const pool = filteredGames.length > 0 ? filteredGames : GAMES;
    const randomGame = pool[Math.floor(Math.random() * pool.length)];
    if (randomGame) {
      window.location.href = randomGame.href;
    }
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = joinCode.trim().toUpperCase();
    if (!code) {
      setJoinError('Please enter a room code');
      return;
    }
    if (code.length < 3) {
      setJoinError('Room code too short');
      return;
    }
    const targetGame = GAMES.find((g) => g.id === selectedGameForJoin);
    const basePath = targetGame ? targetGame.href : `/games/${selectedGameForJoin}/`;
    window.location.href = `${basePath}?room=${encodeURIComponent(code)}`;
  };

  const multiplayerGames = useMemo(() => GAMES.filter((g) => g.mode === 'multiplayer'), []);

  return (
    <div className="games-console-container">
      {/* Page Header */}
      <header className="hub-page-header">
        <div className="hub-title-block">
          <div className="hub-title-row">
            <h1 className="hub-main-title">Developer Games</h1>
            <span className="hub-count-tag">{filteredGames.length}</span>
          </div>
          <p className="hub-lead-text">
            Zero install, zero login browser games for developers and teams.
          </p>
        </div>

        {/* Action Controls Bar */}
        <div className="hub-toolbar">
          {/* Segmented Filter Control */}
          <div className="hub-segmented-control" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'all'}
              className={`segmented-tab ${activeTab === 'all' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              All
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'solo'}
              className={`segmented-tab ${activeTab === 'solo' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('solo')}
            >
              Solo
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'multiplayer'}
              className={`segmented-tab ${activeTab === 'multiplayer' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('multiplayer')}
            >
              Multiplayer
            </button>
          </div>

          <div className="hub-actions-cluster">
            {/* Minimal Search Input */}
            <div className="hub-search-field">
              <svg className="hub-search-svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Search games or tech..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="hub-search-input"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="hub-clear-search"
                  aria-label="Clear search"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Quick Actions */}
            <button
              type="button"
              onClick={handleRandomPlay}
              className="hub-btn hub-btn-subtle"
              title="Pick a random game"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" />
                <path d="M16 8h.01" />
                <path d="M8 8h.01" />
                <path d="M8 16h.01" />
                <path d="M16 16h.01" />
                <path d="M12 12h.01" />
              </svg>
              <span>Random</span>
            </button>

            <button
              type="button"
              onClick={() => setIsJoinModalOpen(true)}
              className="hub-btn hub-btn-primary"
              title="Join a multiplayer room with code"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m21 2-2 2m-1.5 1.5L16 7l-1.5-1.5" />
                <path d="m15.5 8.5-3 3a4.5 4.5 0 1 1-6.36-6.36 4.5 4.5 0 0 1 6.36 0l3 3Z" />
              </svg>
              <span>Join Room</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Game Cards Grid */}
      <main className="hub-grid-wrapper">
        {filteredGames.length === 0 ? (
          <div className="hub-empty-state">
            <p className="empty-title">No games found matching "{searchQuery}"</p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setActiveTab('all');
              }}
              className="empty-reset-btn"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="hub-cards-grid">
            {filteredGames.map((game) => {
              const gameStats = scores[game.id] || { high: 0, streak: 0 };

              return (
                <a
                  key={game.id}
                  href={game.href}
                  className="modern-game-card"
                >
                  {/* Card Top: Icon & Meta */}
                  <div className="card-top-row">
                    <div className="card-icon-container">
                      <span className="card-icon">{game.icon}</span>
                    </div>

                    <div className="card-badge-wrap">
                      {game.mode === 'multiplayer' ? (
                        <span className="mode-pill pill-multi">
                          Multiplayer • {game.playerRange || '2-8p'}
                        </span>
                      ) : (
                        <span className="mode-pill pill-solo">
                          Solo
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="card-body">
                    <h2 className="card-title">{game.title}</h2>
                    <p className="card-description">{game.tagline}</p>
                  </div>

                  {/* Card Bottom / Footer */}
                  <div className="card-footer">
                    <div className="card-meta">
                      {gameStats.high > 0 ? (
                        <span className="meta-record">Best: {gameStats.high}</span>
                      ) : gameStats.streak > 0 ? (
                        <span className="meta-record">Streak: {gameStats.streak}d</span>
                      ) : (
                        <span className="meta-time">{game.timeEstimate}</span>
                      )}
                      <span className="meta-dot">•</span>
                      <span className="meta-tag">#{game.tags[0]}</span>
                    </div>

                    <div className="card-arrow-cta">
                      <span className="cta-label">Play</span>
                      <svg className="cta-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </main>

      {/* Join Room Modal */}
      {isJoinModalOpen && (
        <div className="hub-modal-overlay" onClick={() => setIsJoinModalOpen(false)}>
          <div className="hub-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="hub-modal-top">
              <h3 className="hub-modal-heading">Join Multiplayer Room</h3>
              <button
                type="button"
                onClick={() => setIsJoinModalOpen(false)}
                className="hub-modal-close"
                aria-label="Close dialog"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleJoinSubmit} className="hub-modal-form">
              <div className="modal-field-group">
                <label htmlFor="join-room-code" className="modal-label">Room Code</label>
                <input
                  id="join-room-code"
                  ref={joinInputRef}
                  type="text"
                  placeholder="e.g. AB12CD"
                  maxLength={8}
                  value={joinCode}
                  onChange={(e) => {
                    setJoinCode(e.target.value.toUpperCase());
                    setJoinError('');
                  }}
                  className="modal-input modal-code-input"
                />
                {joinError && <span className="modal-field-error">{joinError}</span>}
              </div>

              <div className="modal-field-group">
                <label htmlFor="select-game-target" className="modal-label">Game</label>
                <select
                  id="select-game-target"
                  value={selectedGameForJoin}
                  onChange={(e) => setSelectedGameForJoin(e.target.value)}
                  className="modal-input modal-select"
                >
                  {multiplayerGames.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.icon} {g.title} ({g.playerRange})
                    </option>
                  ))}
                </select>
              </div>

              <div className="modal-btn-row">
                <button
                  type="button"
                  onClick={() => setIsJoinModalOpen(false)}
                  className="modal-btn modal-btn-cancel"
                >
                  Cancel
                </button>
                <button type="submit" className="modal-btn modal-btn-submit">
                  Connect &rarr;
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .games-console-container {
          width: 100%;
          max-width: 1120px;
          margin: 0 auto;
          padding: 8px 0 40px 0;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        /* Page Header */
        .hub-page-header {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .hub-title-block {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .hub-title-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .hub-main-title {
          font-size: 26px;
          font-weight: 800;
          letter-spacing: -0.025em;
          color: var(--text-primary);
          margin: 0;
          line-height: 1.2;
        }

        .hub-count-tag {
          font-size: 11px;
          font-weight: 700;
          color: var(--text-muted);
          background: var(--surface-sunken);
          border: 1px solid var(--border-subtle);
          padding: 2px 8px;
          border-radius: var(--radius-full);
        }

        .hub-lead-text {
          font-size: 14px;
          color: var(--text-muted);
          margin: 0;
          line-height: 1.4;
        }

        /* Toolbar */
        .hub-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
          padding-bottom: 8px;
          border-bottom: 1px solid var(--border-subtle);
        }

        /* Segmented Control */
        .hub-segmented-control {
          display: flex;
          background: var(--surface-sunken);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          padding: 3px;
          gap: 2px;
        }

        .segmented-tab {
          background: transparent;
          border: none;
          color: var(--text-muted);
          font-size: 12.5px;
          font-weight: 650;
          padding: 6px 14px;
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .segmented-tab:hover {
          color: var(--text-primary);
        }

        .segmented-tab.is-active {
          background: var(--surface-raised);
          color: var(--text-primary);
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
        }

        /* Action cluster */
        .hub-actions-cluster {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        /* Search input */
        .hub-search-field {
          display: flex;
          align-items: center;
          background: var(--surface-raised);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          padding: 0 10px;
          height: 34px;
          width: 210px;
          transition: border-color 0.15s, box-shadow 0.15s;
        }

        .hub-search-field:focus-within {
          border-color: var(--accent-default);
          box-shadow: 0 0 0 2px rgba(217, 119, 6, 0.15);
        }

        .hub-search-svg {
          color: var(--text-muted);
          margin-right: 6px;
          flex-shrink: 0;
        }

        .hub-search-input {
          background: transparent;
          border: none;
          outline: none;
          font-size: 12.5px;
          color: var(--text-primary);
          width: 100%;
        }

        .hub-search-input::placeholder {
          color: var(--text-muted);
          opacity: 0.7;
        }

        .hub-clear-search {
          background: transparent;
          border: none;
          color: var(--text-muted);
          font-size: 11px;
          cursor: pointer;
          padding: 2px 4px;
        }

        /* Action buttons */
        .hub-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          height: 34px;
          padding: 0 12px;
          border-radius: var(--radius-md);
          font-size: 12.5px;
          font-weight: 650;
          cursor: pointer;
          transition: all 0.15s ease;
          border: 1px solid transparent;
        }

        .hub-btn-subtle {
          background: var(--surface-raised);
          border-color: var(--border-subtle);
          color: var(--text-secondary);
        }

        .hub-btn-subtle:hover {
          color: var(--text-primary);
          border-color: var(--border-default);
          background: var(--surface-sunken);
        }

        .hub-btn-primary {
          background: var(--accent-default);
          color: #ffffff;
        }

        .hub-btn-primary:hover {
          background: var(--accent-hover);
        }

        /* Grid */
        .hub-grid-wrapper {
          width: 100%;
        }

        .hub-cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(310px, 1fr));
          gap: 16px;
        }

        /* Modern Game Card */
        .modern-game-card {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          background: var(--surface-raised);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg);
          padding: 18px;
          text-decoration: none;
          color: inherit;
          min-height: 170px;
          box-sizing: border-box;
          transition: border-color 0.18s ease, transform 0.18s ease, box-shadow 0.18s ease;
          position: relative;
        }

        .modern-game-card:hover {
          transform: translateY(-2px);
          border-color: var(--accent-default);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.05);
        }

        /* Card Top */
        .card-top-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        .card-icon-container {
          width: 36px;
          height: 36px;
          border-radius: var(--radius-md);
          background: var(--surface-sunken);
          border: 1px solid var(--border-subtle);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: transform 0.15s ease;
        }

        .modern-game-card:hover .card-icon-container {
          transform: scale(1.05);
        }

        .card-icon {
          font-size: 18px;
          line-height: 1;
        }

        .card-badge-wrap {
          display: flex;
          align-items: center;
        }

        .mode-pill {
          font-size: 11px;
          font-weight: 650;
          padding: 2px 8px;
          border-radius: var(--radius-full);
          letter-spacing: 0.02em;
        }

        .pill-multi {
          color: var(--accent-default);
          background: rgba(217, 119, 6, 0.1);
        }

        .pill-solo {
          color: var(--text-muted);
          background: var(--surface-sunken);
        }

        /* Card Body */
        .card-body {
          display: flex;
          flex-direction: column;
          gap: 4px;
          margin-bottom: 14px;
          flex: 1;
        }

        .card-title {
          font-size: 15.5px;
          font-weight: 750;
          color: var(--text-primary);
          margin: 0;
          letter-spacing: -0.015em;
          line-height: 1.3;
        }

        .card-description {
          font-size: 12.5px;
          color: var(--text-muted);
          margin: 0;
          line-height: 1.45;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        /* Card Footer */
        .card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 12px;
          border-top: 1px solid var(--border-subtle);
          font-size: 11.5px;
        }

        .card-meta {
          display: flex;
          align-items: center;
          gap: 6px;
          color: var(--text-muted);
        }

        .meta-record {
          color: var(--accent-default);
          font-weight: 700;
          font-family: var(--font-mono, monospace);
        }

        .meta-time {
          color: var(--text-muted);
        }

        .meta-dot {
          opacity: 0.4;
          font-size: 9px;
        }

        .meta-tag {
          font-family: var(--font-mono, monospace);
          opacity: 0.75;
        }

        .card-arrow-cta {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          font-weight: 700;
          color: var(--text-muted);
          transition: color 0.15s ease, transform 0.15s ease;
        }

        .modern-game-card:hover .card-arrow-cta {
          color: var(--accent-default);
        }

        .cta-arrow {
          transition: transform 0.15s ease;
        }

        .modern-game-card:hover .cta-arrow {
          transform: translateX(3px);
        }

        /* Empty State */
        .hub-empty-state {
          text-align: center;
          padding: 48px 16px;
          background: var(--surface-raised);
          border: 1px dashed var(--border-subtle);
          border-radius: var(--radius-lg);
        }

        .empty-title {
          font-size: 14px;
          color: var(--text-muted);
          margin: 0 0 12px 0;
        }

        .empty-reset-btn {
          background: transparent;
          border: 1px solid var(--border-default);
          color: var(--text-primary);
          padding: 6px 14px;
          border-radius: var(--radius-md);
          font-size: 12px;
          font-weight: 650;
          cursor: pointer;
        }

        .empty-reset-btn:hover {
          border-color: var(--accent-default);
        }

        /* Modal */
        .hub-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.55);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 16px;
        }

        .hub-modal-box {
          background: var(--surface-raised);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-xl);
          width: 100%;
          max-width: 400px;
          padding: 22px;
          box-shadow: 0 20px 48px rgba(0, 0, 0, 0.25);
        }

        .hub-modal-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 18px;
        }

        .hub-modal-heading {
          margin: 0;
          font-size: 16px;
          font-weight: 750;
          color: var(--text-primary);
        }

        .hub-modal-close {
          background: transparent;
          border: none;
          font-size: 14px;
          color: var(--text-muted);
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
        }

        .hub-modal-close:hover {
          color: var(--text-primary);
        }

        .hub-modal-form {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .modal-field-group {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .modal-label {
          font-size: 11.5px;
          font-weight: 700;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .modal-input {
          background: var(--surface-sunken);
          border: 1px solid var(--border-subtle);
          color: var(--text-primary);
          padding: 8px 12px;
          border-radius: var(--radius-md);
          outline: none;
          font-size: 13px;
        }

        .modal-input:focus {
          border-color: var(--accent-default);
        }

        .modal-code-input {
          font-size: 16px;
          font-weight: 800;
          letter-spacing: 0.12em;
          text-align: center;
          text-transform: uppercase;
        }

        .modal-select {
          cursor: pointer;
        }

        .modal-field-error {
          font-size: 11px;
          color: #ef4444;
        }

        .modal-btn-row {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 8px;
          margin-top: 6px;
        }

        .modal-btn {
          padding: 7px 14px;
          border-radius: var(--radius-md);
          font-size: 12.5px;
          font-weight: 650;
          cursor: pointer;
          border: none;
        }

        .modal-btn-cancel {
          background: transparent;
          border: 1px solid var(--border-subtle);
          color: var(--text-muted);
        }

        .modal-btn-cancel:hover {
          color: var(--text-primary);
        }

        .modal-btn-submit {
          background: var(--accent-default);
          color: #ffffff;
        }

        .modal-btn-submit:hover {
          background: var(--accent-hover);
        }

        /* Mobile adjustments */
        @media (max-width: 768px) {
          .hub-toolbar {
            flex-direction: column;
            align-items: stretch;
          }
          .hub-segmented-control {
            width: 100%;
          }
          .segmented-tab {
            flex: 1;
            text-align: center;
          }
          .hub-actions-cluster {
            width: 100%;
          }
          .hub-search-field {
            width: 100%;
            box-sizing: border-box;
          }
          .hub-btn {
            flex: 1;
            justify-content: center;
          }
          .hub-cards-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};
