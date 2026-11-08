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
    // Populate high scores and streaks from localStorage
    const scoresMap: Record<string, { high: number; streak: number }> = {};
    GAMES.forEach((game) => {
      scoresMap[game.id] = {
        high: storage.getHighScore(game.id),
        streak: storage.getStreak(game.id).count,
      };
    });
    setScores(scoresMap);
  }, []);

  // Autofocus input when modal opens
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

  // Quick Play / Surprise Me
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
      {/* Sleek Top Control Strip */}
      <header className="console-header-strip">
        <div className="header-brand-block">
          <div className="brand-title-row">
            <span className="live-status-dot" title="Servers Live"></span>
            <h1 className="console-title">Developer Games</h1>
            <span className="count-badge">{GAMES.length} Instant Games</span>
          </div>
          <p className="console-subtitle">No signup, no installs. Pick a game and play.</p>
        </div>

        {/* Action & Filter Controls */}
        <div className="header-actions-group">
          {/* Filter Pills */}
          <div className="filter-pill-nav" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'all'}
              className={`pill-tab ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              All <span className="tab-count">{GAMES.length}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'solo'}
              className={`pill-tab ${activeTab === 'solo' ? 'active' : ''}`}
              onClick={() => setActiveTab('solo')}
            >
              ⚡ Solo <span className="tab-count">{SOLO_GAMES.length}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'multiplayer'}
              className={`pill-tab ${activeTab === 'multiplayer' ? 'active' : ''}`}
              onClick={() => setActiveTab('multiplayer')}
            >
              👥 Multiplayer <span className="tab-count">{MULTIPLAYER_GAMES.length}</span>
            </button>
          </div>

          {/* Search Field */}
          <div className="search-box-wrap">
            <svg className="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search by tech (e.g. Git, TypeScript)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="console-search-input"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="clear-search-btn"
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          {/* Quick Buttons */}
          <div className="action-buttons-wrap">
            <button
              type="button"
              onClick={handleRandomPlay}
              className="action-btn random-btn"
              title="Pick a random game for a quick 3-minute break"
            >
              <span className="btn-icon">🎲</span>
              <span className="btn-text">Quick Play</span>
            </button>

            <button
              type="button"
              onClick={() => setIsJoinModalOpen(true)}
              className="action-btn join-btn"
              title="Join a multiplayer room with code"
            >
              <span className="btn-icon">🔑</span>
              <span className="btn-text">Join Room</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main High-Density Game Grid */}
      <main className="games-grid-viewport">
        {filteredGames.length === 0 ? (
          <div className="empty-state-box">
            <span className="empty-icon">🔍</span>
            <h3>No games found for "{searchQuery}"</h3>
            <p>Try searching for "TypeScript", "DevOps", or reset your filters.</p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setActiveTab('all');
              }}
              className="reset-filters-btn"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="game-cards-grid">
            {filteredGames.map((game) => {
              const gameStats = scores[game.id] || { high: 0, streak: 0 };

              return (
                <a
                  key={game.id}
                  href={game.href}
                  className="game-launcher-card"
                  style={
                    {
                      '--accent': game.accentColor,
                      '--accent-bg': `color-mix(in srgb, ${game.accentColor} 12%, transparent)`,
                      '--accent-glow': `color-mix(in srgb, ${game.accentColor} 35%, transparent)`,
                    } as React.CSSProperties
                  }
                >
                  {/* Top Ambient Highlight Bar */}
                  <div className="card-top-accent"></div>

                  {/* Card Header: Icon + Meta Badges */}
                  <div className="card-head-row">
                    <div className="game-icon-box">
                      <span className="icon-symbol">{game.icon}</span>
                    </div>

                    <div className="badge-row">
                      {game.isNew && <span className="badge-pill new-tag">New</span>}
                      <span className={`badge-pill mode-tag ${game.mode}`}>
                        {game.mode === 'multiplayer' ? (game.playerRange || '2-10p') : 'Solo'}
                      </span>
                      <span className="badge-pill time-tag">{game.timeEstimate}</span>
                    </div>
                  </div>

                  {/* Game Title & Tagline */}
                  <div className="card-title-group">
                    <h3 className="game-name">{game.title}</h3>
                    <p className="game-tagline">{game.tagline}</p>
                  </div>

                  {/* Footer: Tags & Play CTA */}
                  <div className="card-footer-row">
                    {/* Tags or Personal Best */}
                    <div className="stats-or-tags">
                      {gameStats.high > 0 ? (
                        <span className="stat-pill best" title="Personal Record">
                          🏆 Best: <strong>{gameStats.high}</strong>
                        </span>
                      ) : gameStats.streak > 0 ? (
                        <span className="stat-pill streak" title="Daily Streak">
                          🔥 Streak: <strong>{gameStats.streak}d</strong>
                        </span>
                      ) : (
                        <span className="primary-tag">#{game.tags[0]}</span>
                      )}
                    </div>

                    {/* Instant Play Button */}
                    <span className="play-cta-chip">
                      <span>Play</span>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="5 3 19 12 5 21 5 3"></polygon>
                      </svg>
                    </span>
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </main>

      {/* Join Room Modal */}
      {isJoinModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsJoinModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-row">
                <span className="modal-icon">🔑</span>
                <h3>Join Multiplayer Room</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsJoinModalOpen(false)}
                className="modal-close-btn"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleJoinSubmit} className="modal-form">
              <div className="form-group">
                <label htmlFor="join-room-code">Room Invite Code</label>
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
                  className="modal-code-field"
                />
                {joinError && <span className="modal-error-msg">{joinError}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="select-game-target">Game Target</label>
                <select
                  id="select-game-target"
                  value={selectedGameForJoin}
                  onChange={(e) => setSelectedGameForJoin(e.target.value)}
                  className="modal-select-field"
                >
                  {multiplayerGames.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.icon} {g.title} ({g.playerRange})
                    </option>
                  ))}
                </select>
              </div>

              <div className="modal-actions-row">
                <button
                  type="button"
                  onClick={() => setIsJoinModalOpen(false)}
                  className="modal-cancel-btn"
                >
                  Cancel
                </button>
                <button type="submit" className="modal-submit-btn">
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
          max-width: 1140px;
          margin: 0 auto;
          padding: 8px 0 24px 0;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        /* Top Command Header */
        .console-header-strip {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 14px;
          padding: 12px 18px;
          background: var(--surface-raised);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
        }

        .header-brand-block {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .brand-title-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .live-status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #10b981;
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.25);
          animation: statusGlow 2s infinite ease-in-out;
        }

        @keyframes statusGlow {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(0.9); }
        }

        .console-title {
          font-size: 1.35rem;
          font-weight: 850;
          letter-spacing: -0.025em;
          margin: 0;
          color: var(--text-primary);
          line-height: 1.2;
        }

        .count-badge {
          font-size: 11px;
          font-weight: 750;
          color: var(--accent-default);
          background: color-mix(in srgb, var(--accent-default) 12%, transparent);
          border: 1px solid color-mix(in srgb, var(--accent-default) 28%, transparent);
          padding: 2px 7px;
          border-radius: var(--radius-full);
          letter-spacing: 0.02em;
        }

        .console-subtitle {
          font-size: 12px;
          color: var(--text-muted);
          margin: 0;
        }

        /* Actions & Filter Group */
        .header-actions-group {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 10px;
        }

        /* Tabs */
        .filter-pill-nav {
          display: flex;
          background: var(--surface-sunken);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          padding: 3px;
          gap: 2px;
        }

        .pill-tab {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: transparent;
          border: none;
          color: var(--text-muted);
          font-size: 12px;
          font-weight: 700;
          padding: 5px 11px;
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .pill-tab:hover {
          color: var(--text-primary);
        }

        .pill-tab.active {
          background: var(--surface-raised);
          color: var(--text-primary);
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.12);
        }

        .tab-count {
          font-size: 10px;
          opacity: 0.75;
          background: var(--surface-sunken);
          padding: 1px 5px;
          border-radius: var(--radius-full);
        }

        /* Search Input */
        .search-box-wrap {
          display: flex;
          align-items: center;
          background: var(--surface-sunken);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          padding: 0 10px;
          height: 34px;
          width: 220px;
          transition: border-color 0.15s;
        }

        .search-box-wrap:focus-within {
          border-color: var(--accent-default);
          background: var(--surface-raised);
        }

        .search-icon {
          color: var(--text-muted);
          margin-right: 6px;
          flex-shrink: 0;
        }

        .console-search-input {
          background: transparent;
          border: none;
          outline: none;
          font-size: 12px;
          color: var(--text-primary);
          width: 100%;
        }

        .console-search-input::placeholder {
          color: var(--text-muted);
          opacity: 0.7;
        }

        .clear-search-btn {
          background: transparent;
          border: none;
          color: var(--text-muted);
          font-size: 11px;
          cursor: pointer;
          padding: 2px 4px;
        }

        /* Action Buttons */
        .action-buttons-wrap {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .action-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          height: 34px;
          padding: 0 12px;
          border-radius: var(--radius-md);
          font-size: 12px;
          font-weight: 750;
          cursor: pointer;
          transition: all 0.15s ease;
          border: 1px solid var(--border-subtle);
        }

        .random-btn {
          background: var(--surface-sunken);
          color: var(--text-primary);
        }
        .random-btn:hover {
          border-color: var(--accent-default);
          background: var(--surface-base);
          transform: translateY(-1px);
        }

        .join-btn {
          background: var(--accent-default);
          border-color: var(--accent-default);
          color: #ffffff;
        }
        .join-btn:hover {
          background: var(--accent-hover);
          transform: translateY(-1px);
          box-shadow: 0 2px 8px color-mix(in srgb, var(--accent-default) 40%, transparent);
        }

        /* Main Game Grid */
        .games-grid-viewport {
          width: 100%;
        }

        .game-cards-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 12px;
        }

        @media (max-width: 1100px) {
          .game-cards-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        @media (max-width: 768px) {
          .console-header-strip {
            flex-direction: column;
            align-items: stretch;
            padding: 12px;
          }
          .header-actions-group {
            flex-direction: column;
            align-items: stretch;
          }
          .filter-pill-nav {
            width: 100%;
            justify-content: space-between;
          }
          .pill-tab {
            flex: 1;
            justify-content: center;
          }
          .search-box-wrap {
            width: 100%;
            box-sizing: border-box;
          }
          .action-buttons-wrap {
            width: 100%;
          }
          .action-btn {
            flex: 1;
            justify-content: center;
          }
          .game-cards-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
          }
        }

        @media (max-width: 480px) {
          .game-cards-grid {
            grid-template-columns: 1fr;
          }
        }

        /* Compact High-Density Game Card */
        .game-launcher-card {
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          background: var(--surface-raised);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-lg);
          padding: 14px 14px 12px 14px;
          text-decoration: none;
          color: inherit;
          min-height: 165px;
          box-sizing: border-box;
          overflow: hidden;
          transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
        }

        .card-top-accent {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: var(--accent);
          opacity: 0.75;
          transition: opacity 0.18s, height 0.18s;
        }

        .game-launcher-card:hover {
          transform: translateY(-3px);
          border-color: var(--accent);
          box-shadow: 0 10px 24px -6px var(--accent-glow);
        }

        .game-launcher-card:hover .card-top-accent {
          opacity: 1;
          height: 4px;
        }

        /* Head Row */
        .card-head-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
        }

        .game-icon-box {
          width: 38px;
          height: 38px;
          border-radius: var(--radius-md);
          background: var(--accent-bg);
          border: 1px solid color-mix(in srgb, var(--accent) 30%, transparent);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: transform 0.2s ease;
        }

        .game-launcher-card:hover .game-icon-box {
          transform: scale(1.08);
        }

        .icon-symbol {
          font-size: 19px;
          line-height: 1;
        }

        .badge-row {
          display: flex;
          align-items: center;
          gap: 4px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .badge-pill {
          font-size: 10px;
          font-weight: 750;
          padding: 2px 6px;
          border-radius: var(--radius-full);
          letter-spacing: 0.02em;
        }

        .new-tag {
          background: #ef4444;
          color: #ffffff;
        }

        .mode-tag.solo {
          background: var(--surface-sunken);
          color: var(--text-muted);
          border: 1px solid var(--border-subtle);
        }

        .mode-tag.multiplayer {
          background: color-mix(in srgb, var(--accent) 15%, transparent);
          color: var(--accent);
          border: 1px solid color-mix(in srgb, var(--accent) 30%, transparent);
        }

        .time-tag {
          background: transparent;
          color: var(--text-muted);
          opacity: 0.8;
          font-size: 9.5px;
        }

        /* Title & Tagline */
        .card-title-group {
          margin: 4px 0 12px 0;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .game-name {
          font-size: 15px;
          font-weight: 800;
          margin: 0;
          color: var(--text-primary);
          letter-spacing: -0.015em;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .game-tagline {
          font-size: 11.5px;
          color: var(--text-muted);
          margin: 0;
          line-height: 1.35;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        /* Footer Row */
        .card-footer-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 8px;
          border-top: 1px solid var(--border-subtle);
        }

        .stats-or-tags {
          display: flex;
          align-items: center;
          font-size: 11px;
        }

        .stat-pill {
          font-size: 10.5px;
          font-weight: 750;
          padding: 2px 5px;
          border-radius: 4px;
        }

        .stat-pill.best {
          background: rgba(245, 158, 11, 0.12);
          color: #f59e0b;
        }

        .stat-pill.streak {
          background: rgba(239, 68, 68, 0.12);
          color: #ef4444;
        }

        .primary-tag {
          font-size: 10.5px;
          color: var(--text-muted);
          opacity: 0.75;
          font-family: var(--font-mono, monospace);
        }

        .play-cta-chip {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          font-weight: 800;
          color: var(--text-muted);
          padding: 3px 8px;
          border-radius: var(--radius-sm);
          background: var(--surface-sunken);
          border: 1px solid var(--border-subtle);
          transition: all 0.15s ease;
        }

        .game-launcher-card:hover .play-cta-chip {
          background: var(--accent);
          color: #ffffff;
          border-color: var(--accent);
          transform: scale(1.04);
        }

        /* Empty state */
        .empty-state-box {
          text-align: center;
          padding: 48px 16px;
          background: var(--surface-raised);
          border: 1px dashed var(--border-default);
          border-radius: var(--radius-lg);
        }

        .empty-icon {
          font-size: 36px;
        }

        .empty-state-box h3 {
          margin: 12px 0 6px 0;
          color: var(--text-primary);
        }

        .empty-state-box p {
          color: var(--text-muted);
          font-size: 13px;
          margin: 0 0 16px 0;
        }

        .reset-filters-btn {
          background: var(--accent-default);
          color: #ffffff;
          border: none;
          padding: 8px 18px;
          border-radius: var(--radius-md);
          font-weight: 700;
          font-size: 12px;
          cursor: pointer;
        }

        /* Modal Backdrop & Card */
        .modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.65);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 16px;
        }

        .modal-card {
          background: var(--surface-raised);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-xl);
          width: 100%;
          max-width: 420px;
          padding: 24px;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4);
          animation: modalPop 0.18s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes modalPop {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }

        .modal-title-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .modal-title-row h3 {
          margin: 0;
          font-size: 16px;
          color: var(--text-primary);
        }

        .modal-icon {
          font-size: 18px;
        }

        .modal-close-btn {
          background: transparent;
          border: none;
          font-size: 16px;
          color: var(--text-muted);
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 4px;
        }
        .modal-close-btn:hover {
          color: var(--text-primary);
          background: var(--surface-sunken);
        }

        .modal-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .form-group label {
          font-size: 12px;
          font-weight: 700;
          color: var(--text-muted);
          letter-spacing: 0.02em;
        }

        .modal-code-field {
          background: var(--surface-sunken);
          border: 1px solid var(--border-default);
          color: var(--text-primary);
          font-size: 18px;
          font-weight: 800;
          letter-spacing: 0.15em;
          text-align: center;
          padding: 10px;
          border-radius: var(--radius-md);
          outline: none;
          text-transform: uppercase;
        }
        .modal-code-field:focus {
          border-color: var(--accent-default);
        }

        .modal-select-field {
          background: var(--surface-sunken);
          border: 1px solid var(--border-default);
          color: var(--text-primary);
          font-size: 13px;
          padding: 10px;
          border-radius: var(--radius-md);
          outline: none;
        }

        .modal-error-msg {
          font-size: 11px;
          color: #ef4444;
          font-weight: 600;
        }

        .modal-actions-row {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 8px;
          margin-top: 8px;
        }

        .modal-cancel-btn {
          background: transparent;
          border: 1px solid var(--border-subtle);
          color: var(--text-muted);
          padding: 8px 16px;
          border-radius: var(--radius-md);
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
        }
        .modal-cancel-btn:hover {
          color: var(--text-primary);
        }

        .modal-submit-btn {
          background: var(--accent-default);
          border: none;
          color: #ffffff;
          padding: 8px 18px;
          border-radius: var(--radius-md);
          font-size: 12px;
          font-weight: 750;
          cursor: pointer;
        }
        .modal-submit-btn:hover {
          background: var(--accent-hover);
        }
      `}</style>
    </div>
  );
};
