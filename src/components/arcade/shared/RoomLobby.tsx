import React, { useState, useEffect } from 'react';
import { storage } from './storage';
import { ShareRoomLink } from './ShareRoomLink';
import type { RoomPlayer } from './useSupabaseRoom';

interface RoomLobbyProps {
  gameTitle: string;
  gameIcon: string;
  minPlayers?: number;
  maxPlayers?: number;
  currentRoomId: string;
  inviteRoomCode?: string;
  players: RoomPlayer[];
  currentPlayerId: string;
  isHost: boolean;
  status: string;
  customSettings?: React.ReactNode;
  onJoinRoom: (roomId: string, displayName: string) => void;
  onCreateRoom: (displayName: string) => void;
  onStartGame: () => void;
  onLeaveRoom?: () => void;
}

const DEV_NAMES = [
  'Rustacean', 'NullPointer', 'ByteNinja', 'KernelPanic', 'GitMaster',
  'CssWizard', 'StackOverflow', 'AsyncAwait', 'DockerCaptain', 'PixelDev',
  'QueryMaster', 'TurboCoder', 'VimGuru', 'ReactDev'
];

function generateRandomDevName(): string {
  const prefix = DEV_NAMES[Math.floor(Math.random() * DEV_NAMES.length)];
  const num = Math.floor(Math.random() * 90) + 10;
  return `${prefix}${num}`;
}

export const RoomLobby: React.FC<RoomLobbyProps> = ({
  gameTitle,
  gameIcon,
  minPlayers = 2,
  maxPlayers = 10,
  currentRoomId,
  inviteRoomCode,
  players,
  currentPlayerId,
  isHost,
  status,
  customSettings,
  onJoinRoom,
  onCreateRoom,
  onStartGame,
  onLeaveRoom,
}) => {
  const [name, setName] = useState('');
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [validationError, setValidationError] = useState('');
  const [activeInviteCode, setActiveInviteCode] = useState<string>(inviteRoomCode || '');

  useEffect(() => {
    if (inviteRoomCode) {
      setActiveInviteCode(inviteRoomCode.trim().toUpperCase());
      setJoinCodeInput(inviteRoomCode.trim().toUpperCase());
    }
  }, [inviteRoomCode]);

  useEffect(() => {
    const existing = storage.getDisplayName();
    if (existing && existing.trim()) {
      setName(existing.trim());
    } else {
      setName(generateRandomDevName());
    }
  }, []);

  const handleRandomizeName = () => {
    const fresh = generateRandomDevName();
    setName(fresh);
    storage.setDisplayName(fresh);
    setValidationError('');
  };

  const handleSaveName = (newName: string) => {
    setName(newName);
    storage.setDisplayName(newName);
    setValidationError('');
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setValidationError('Please enter a display name first.');
      return;
    }
    storage.setDisplayName(trimmed);
    onCreateRoom(trimmed);
  };

  const handleJoinWithInvite = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setValidationError('Please enter a display name to join.');
      return;
    }
    const code = activeInviteCode.trim().toUpperCase();
    if (!code) {
      setValidationError('Invalid room code.');
      return;
    }
    storage.setDisplayName(trimmedName);
    onJoinRoom(code, trimmedName);
  };

  const handleJoinManual = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const code = joinCodeInput.trim().toUpperCase();
    if (!trimmedName) {
      setValidationError('Please enter a display name.');
      return;
    }
    if (!code || code.length < 4) {
      setValidationError('Please enter a valid room code (at least 4 characters).');
      return;
    }
    storage.setDisplayName(trimmedName);
    onJoinRoom(code, trimmedName);
  };

  const canStart = players.length >= minPlayers;

  // VIEW 1A: User arrived via Invite Link (?room=CODE) but hasn't joined yet
  if (!currentRoomId && activeInviteCode) {
    return (
      <div className="lobby-wrap">
        <div className="lobby-card invite-view">
          <div className="lobby-header">
            <span className="lobby-game-icon">{gameIcon}</span>
            <div className="invite-badge-wrap">
              <span className="invite-pulse"></span>
              <span className="invite-badge-text">ROOM INVITATION</span>
            </div>
            <h1 className="lobby-title">{gameTitle}</h1>
            <p className="lobby-subtitle">
              You've been invited to join private room <strong className="invite-code-strong">{activeInviteCode}</strong>
            </p>
          </div>

          <form onSubmit={handleJoinWithInvite} className="invite-join-form">
            <div className="lobby-form-section">
              <div className="name-header-row">
                <label className="lobby-label" htmlFor="invite-player-name">Your Player Name</label>
                <button 
                  type="button" 
                  onClick={handleRandomizeName} 
                  className="randomize-btn"
                  title="Generate a random name"
                >
                  🎲 Randomize
                </button>
              </div>

              <div className="name-input-group">
                <input
                  id="invite-player-name"
                  type="text"
                  value={name}
                  maxLength={20}
                  placeholder="e.g. ByteNinja42"
                  onChange={(e) => handleSaveName(e.target.value)}
                  className="lobby-input name-field"
                  autoFocus
                />
              </div>
              {validationError && <p className="lobby-error">{validationError}</p>}
            </div>

            <button type="submit" className="lobby-btn lobby-btn-primary join-large-btn">
              <span>Join Room {activeInviteCode}</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </button>
          </form>

          <div className="invite-switch-row">
            <button
              type="button"
              onClick={() => {
                setActiveInviteCode('');
                setJoinCodeInput('');
              }}
              className="invite-switch-link"
            >
              Or create your own room instead &rarr;
            </button>
          </div>
        </div>

        <style>{lobbyStyles}</style>
      </div>
    );
  }

  // VIEW 1B: Standard Lobby (No room joined yet & no invite code)
  if (!currentRoomId) {
    return (
      <div className="lobby-wrap">
        <div className="lobby-card">
          <div className="lobby-header">
            <span className="lobby-game-icon">{gameIcon}</span>
            <h1 className="lobby-title">{gameTitle}</h1>
            <p className="lobby-subtitle">Multiplayer Party Lobby &bull; No sign-up required</p>
          </div>

          {/* Player Name Input */}
          <div className="lobby-form-section name-box">
            <div className="name-header-row">
              <label className="lobby-label" htmlFor="player-name">Your Player Name</label>
              <button 
                type="button" 
                onClick={handleRandomizeName} 
                className="randomize-btn"
                title="Generate a random name"
              >
                🎲 Randomize
              </button>
            </div>
            <input
              id="player-name"
              type="text"
              value={name}
              maxLength={20}
              placeholder="e.g. Rustacean42"
              onChange={(e) => handleSaveName(e.target.value)}
              className="lobby-input name-field"
            />
            {validationError && <p className="lobby-error">{validationError}</p>}
          </div>

          {/* Action Choice Grid */}
          <div className="lobby-choice-grid">
            {/* Host Card */}
            <div className="choice-card host-card">
              <div className="choice-meta">
                <span className="choice-badge">OPTION 1</span>
                <h3>Host a Game</h3>
                <p>Create a private room & invite your teammates via link.</p>
              </div>
              <button
                type="button"
                onClick={handleCreate}
                className="lobby-btn lobby-btn-primary"
              >
                <span>Create New Room</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="16"/>
                  <line x1="8" y1="12" x2="16" y2="12"/>
                </svg>
              </button>
            </div>

            {/* Join with Code Card */}
            <div className="choice-card join-card">
              <div className="choice-meta">
                <span className="choice-badge">OPTION 2</span>
                <h3>Join Existing</h3>
                <p>Have an invite code from your coworker?</p>
              </div>

              <form onSubmit={handleJoinManual} className="join-form-row">
                <input
                  type="text"
                  value={joinCodeInput}
                  maxLength={8}
                  placeholder="ROOM CODE"
                  onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                  className="lobby-input lobby-code-input"
                />
                <button type="submit" className="lobby-btn lobby-btn-secondary">
                  Join
                </button>
              </form>
            </div>
          </div>

          <div className="lobby-footer-tips">
            <span>⚡ Instant team multiplayer &bull; Share URL link to invite colleagues</span>
          </div>
        </div>

        <style>{lobbyStyles}</style>
      </div>
    );
  }

  // VIEW 2: Inside Room Lobby waiting for players to ready up
  return (
    <div className="lobby-wrap">
      <div className="lobby-card room-live-card">
        <div className="lobby-header">
          <div className="lobby-header-badge-row">
            <span className="lobby-game-icon">{gameIcon}</span>
            {status === 'connected' ? (
              <span className="status-live-tag">
                <span className="status-pulse"></span> Live Sync
              </span>
            ) : (
              <span className="status-connecting-tag">
                <span className="connecting-pulse"></span> Connecting...
              </span>
            )}
          </div>
          <h1 className="lobby-title">{gameTitle}</h1>
          <p className="lobby-subtitle">
            {canStart
              ? 'Ready to launch! Invite your team or configure match settings.'
              : `Waiting for players (${players.length}/${maxPlayers} joined, minimum ${minPlayers} required)`}
          </p>
        </div>

        <div className="room-columns-layout">
          {/* Left Column: Room Code + Team List + Launch Controls */}
          <div className="room-col-main">
            {/* Share Link Banner */}
            <div className="lobby-share-box">
              <ShareRoomLink roomId={currentRoomId} gameTitle={gameTitle} />
            </div>

            {/* Live Players Section */}
            <div className="lobby-players-section">
              <div className="lobby-players-header">
                <span className="players-count-label">
                  Players in Room ({players.length}/{maxPlayers})
                </span>
                <span className="players-req-indicator">
                  {canStart ? '✅ Minimum met' : `Need ${minPlayers - players.length} more`}
                </span>
              </div>

              <div className="players-list">
                {players.map((p, idx) => {
                  const isMe = p.id === currentPlayerId;
                  return (
                    <div key={p.id} className={`player-badge ${isMe ? 'player-me' : ''}`}>
                      <div className="player-avatar" style={{ backgroundColor: getAvatarColor(idx) }}>
                        {p.displayName.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="player-info">
                        <span className="player-name">
                          {p.displayName} {isMe && <span className="you-pill">(You)</span>}
                        </span>
                        {p.isHost && <span className="player-host-tag">👑 Room Host</span>}
                      </div>
                    </div>
                  );
                })}

                {players.length === 0 && (
                  <div className="player-connecting-hint">
                    <span className="connecting-spinner"></span>
                    <span>Connecting to room...</span>
                  </div>
                )}
              </div>
            </div>

            {/* Host Control vs Guest Waiting */}
            <div className="lobby-controls-footer">
              {isHost ? (
                <div className="host-actions">
                  <button
                    type="button"
                    onClick={onStartGame}
                    disabled={!canStart}
                    className={`lobby-btn lobby-btn-primary start-btn ${canStart ? 'ready-pulse' : 'disabled'}`}
                  >
                    <span>{canStart ? 'Start Game Now →' : `Waiting for ${minPlayers - players.length} more player(s)...`}</span>
                  </button>
                </div>
              ) : (
                <div className="guest-waiting-box">
                  <div className="waiting-spinner"></div>
                  <span>Waiting for the host to launch the game...</span>
                </div>
              )}

              {onLeaveRoom && (
                <div className="leave-room-row">
                  <button type="button" onClick={onLeaveRoom} className="leave-room-btn">
                    Leave Room
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Custom Settings (Dev Persona + Host Rules) */}
          {customSettings && (
            <div className="room-col-settings">
              {customSettings}
            </div>
          )}
        </div>
      </div>

      <style>{lobbyStyles}</style>
    </div>
  );
};

const AVATAR_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6',
  '#06b6d4', '#f97316', '#14b8a6', '#6366f1', '#eab308'
];

function getAvatarColor(idx: number): string {
  return AVATAR_COLORS[idx % AVATAR_COLORS.length];
}

const lobbyStyles = `
  .lobby-wrap {
    min-height: 100%;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px 16px;
    box-sizing: border-box;
    background: var(--surface-base);
  }

  .lobby-card {
    background: var(--surface-raised);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-xl);
    width: 100%;
    max-width: 680px;
    padding: 28px 32px;
    margin: auto;
    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.08);
    display: flex;
    flex-direction: column;
    gap: 18px;
  }

  .lobby-card.room-live-card {
    max-width: 960px;
    width: 100%;
    padding: 22px 28px;
    gap: 16px;
  }

  .lobby-header {
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
  }

  .lobby-header-badge-row {
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }

  .lobby-game-icon {
    font-size: 38px;
    line-height: 1;
    margin-bottom: 2px;
  }

  .lobby-title {
    font-size: 24px;
    font-weight: 850;
    margin: 0;
    color: var(--text-primary);
    letter-spacing: -0.02em;
  }

  .lobby-subtitle {
    font-size: 13px;
    color: var(--text-muted);
    margin: 0;
    line-height: 1.4;
  }

  /* Two Column Live Room Grid */
  .room-columns-layout {
    display: grid;
    grid-template-columns: 1fr 1.05fr;
    gap: 20px;
    align-items: start;
    margin-top: 4px;
  }

  @media (max-width: 820px) {
    .room-columns-layout {
      grid-template-columns: 1fr;
      gap: 16px;
    }
    .lobby-card.room-live-card {
      padding: 18px 16px;
    }
  }

  .room-col-main {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .room-col-settings {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  /* Live & Connecting Badges */
  .status-live-tag {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 11px;
    font-weight: 750;
    color: #10b981;
    background: rgba(16, 185, 129, 0.12);
    border: 1px solid rgba(16, 185, 129, 0.3);
    padding: 2px 8px;
    border-radius: var(--radius-full);
  }

  .status-pulse {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #10b981;
    animation: livePulse 1.8s infinite;
  }

  .status-connecting-tag {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 11px;
    font-weight: 750;
    color: #f59e0b;
    background: rgba(245, 158, 11, 0.12);
    border: 1px solid rgba(245, 158, 11, 0.3);
    padding: 2px 8px;
    border-radius: var(--radius-full);
  }

  .connecting-pulse {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #f59e0b;
    animation: livePulse 1.2s infinite;
  }

  .players-req-indicator {
    font-size: 11px;
    font-weight: 700;
    color: var(--accent-default);
  }

  /* Invite View Header */
  .invite-badge-wrap {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: rgba(16, 185, 129, 0.12);
    border: 1px solid rgba(16, 185, 129, 0.3);
    padding: 3px 10px;
    border-radius: 999px;
  }

  .invite-pulse {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #10b981;
    box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.25);
  }

  .invite-badge-text {
    font-size: 10px;
    font-weight: 800;
    color: #10b981;
    letter-spacing: 0.06em;
  }

  .invite-code-strong {
    font-family: var(--font-mono, monospace);
    color: var(--accent-default);
    background: rgba(217, 119, 6, 0.12);
    padding: 2px 8px;
    border-radius: var(--radius-sm);
    letter-spacing: 0.08em;
  }

  /* Name Box */
  .lobby-form-section {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .name-header-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .lobby-label {
    font-size: 12px;
    font-weight: 750;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--text-secondary);
  }

  .randomize-btn {
    background: none;
    border: none;
    color: var(--accent-default);
    font-size: 11.5px;
    font-weight: 650;
    cursor: pointer;
    padding: 2px 4px;
    border-radius: 4px;
    transition: opacity 0.15s;
  }
  .randomize-btn:hover {
    text-decoration: underline;
  }

  .lobby-input {
    background: var(--surface-sunken);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-md);
    padding: 12px 14px;
    color: var(--text-primary);
    font-size: 14px;
    font-weight: 600;
    outline: none;
    width: 100%;
    box-sizing: border-box;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .lobby-input:focus {
    border-color: var(--accent-default);
    box-shadow: 0 0 0 3px rgba(217, 119, 6, 0.14);
  }

  .lobby-error {
    color: #ef4444;
    font-size: 12px;
    font-weight: 600;
    margin: 4px 0 0;
  }

  /* Buttons */
  .lobby-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 12px 20px;
    border-radius: var(--radius-md);
    font-size: 14px;
    font-weight: 750;
    cursor: pointer;
    border: none;
    transition: transform 0.15s, filter 0.15s, box-shadow 0.15s;
    text-decoration: none;
  }

  .lobby-btn-primary {
    background: var(--accent-default);
    color: #ffffff;
    box-shadow: 0 4px 12px rgba(217, 119, 6, 0.25);
  }
  .lobby-btn-primary:hover:not(:disabled) {
    filter: brightness(1.08);
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(217, 119, 6, 0.35);
  }

  .join-large-btn {
    padding: 14px 20px;
    font-size: 15px;
    margin-top: 6px;
  }

  .lobby-btn-secondary {
    background: var(--surface-raised);
    border: 1px solid var(--border-default);
    color: var(--text-primary);
  }
  .lobby-btn-secondary:hover {
    background: var(--surface-sunken);
    border-color: var(--accent-default);
  }

  /* Choice Grid */
  .lobby-choice-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
  @media (max-width: 520px) {
    .lobby-choice-grid {
      grid-template-columns: 1fr;
    }
  }

  .choice-card {
    background: var(--surface-sunken);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-lg);
    padding: 16px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 14px;
  }

  .choice-meta {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .choice-badge {
    font-size: 9.5px;
    font-weight: 800;
    letter-spacing: 0.06em;
    color: var(--text-muted);
  }

  .choice-meta h3 {
    font-size: 15px;
    font-weight: 750;
    margin: 0;
    color: var(--text-primary);
  }

  .choice-meta p {
    font-size: 11.5px;
    line-height: 1.4;
    color: var(--text-muted);
    margin: 0;
  }

  .join-form-row {
    display: flex;
    gap: 6px;
  }

  .lobby-code-input {
    font-family: var(--font-mono, monospace);
    font-weight: 800;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    font-size: 13px;
    padding: 10px 12px;
  }

  .invite-switch-row {
    text-align: center;
    padding-top: 4px;
  }

  .invite-switch-link {
    background: none;
    border: none;
    color: var(--text-muted);
    font-size: 12.5px;
    font-weight: 600;
    cursor: pointer;
    transition: color 0.15s;
  }
  .invite-switch-link:hover {
    color: var(--accent-default);
    text-decoration: underline;
  }

  .lobby-footer-tips {
    text-align: center;
    font-size: 11.5px;
    color: var(--text-muted);
    padding-top: 8px;
    border-top: 1px solid var(--border-subtle);
  }

  /* Live Lobby View */
  .lobby-share-box {
    margin-bottom: 4px;
  }

  .lobby-players-section {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .lobby-players-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .players-count-label {
    font-size: 12px;
    font-weight: 750;
    text-transform: uppercase;
    color: var(--text-secondary);
  }

  .status-live-tag {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 11px;
    font-weight: 700;
    color: #10b981;
  }

  .status-pulse {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #10b981;
    animation: livePulse 1.8s infinite;
  }

  @keyframes livePulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.4; transform: scale(0.85); }
  }

  .players-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
    max-height: 180px;
    overflow-y: auto;
    padding-right: 2px;
  }

  .player-badge {
    display: flex;
    align-items: center;
    gap: 10px;
    background: var(--surface-sunken);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
    padding: 7px 12px;
  }

  .player-badge.player-me {
    border-color: color-mix(in srgb, var(--accent-default) 40%, transparent);
    background: color-mix(in srgb, var(--accent-default) 6%, var(--surface-sunken));
  }

  .player-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    color: #ffffff;
    font-size: 11px;
    font-weight: 800;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .player-info {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .player-name {
    font-size: 13.5px;
    font-weight: 700;
    color: var(--text-primary);
  }

  .you-pill {
    font-size: 11px;
    color: var(--accent-default);
    font-weight: 600;
    margin-left: 4px;
  }

  .player-host-tag {
    font-size: 10px;
    font-weight: 750;
    background: rgba(245, 158, 11, 0.14);
    color: #d97706;
    border: 1px solid rgba(245, 158, 11, 0.3);
    padding: 2px 7px;
    border-radius: 999px;
  }

  .player-connecting-hint {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 18px;
    font-size: 13px;
    color: var(--text-muted);
  }

  .connecting-spinner, .waiting-spinner {
    width: 14px;
    height: 14px;
    border: 2px solid var(--border-default);
    border-top-color: var(--accent-default);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .lobby-controls-footer {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-top: 6px;
  }

  .start-btn {
    width: 100%;
    padding: 14px;
    font-size: 15px;
  }

  .start-btn.ready-pulse {
    animation: readyGlow 2s infinite ease-in-out;
  }

  @keyframes readyGlow {
    0%, 100% { box-shadow: 0 4px 14px rgba(217, 119, 6, 0.25); }
    50% { box-shadow: 0 6px 24px rgba(217, 119, 6, 0.55); }
  }

  .start-btn.disabled {
    opacity: 0.6;
    cursor: not-allowed;
    background: var(--surface-sunken);
    color: var(--text-muted);
    border: 1px solid var(--border-default);
    box-shadow: none;
  }

  .guest-waiting-box {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 14px;
    background: var(--surface-sunken);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
    font-size: 13.5px;
    font-weight: 600;
    color: var(--text-secondary);
  }

  .leave-room-row {
    text-align: center;
  }
  .leave-room-btn {
    background: none;
    border: none;
    color: var(--text-muted);
    font-size: 12px;
    cursor: pointer;
    transition: color 0.15s;
  }
  .leave-room-btn:hover {
    color: #ef4444;
    text-decoration: underline;
  }
`;
