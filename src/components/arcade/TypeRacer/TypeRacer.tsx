import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSupabaseRoom } from '../shared/useSupabaseRoom';
import { RoomLobby } from '../shared/RoomLobby';
import { RaceTrack, type RacerProgress } from './RaceTrack';
import { GameOverScreen } from '../shared/GameOverScreen';
import { generateSnippet, type LanguageId } from '../TerminalTyper/SnippetGenerator';
import { WpmTracker } from '../TerminalTyper/WpmTracker';
import { BROADCAST_INTERVAL_MS, LANGUAGES } from './constants';
import { storage } from '../shared/storage';

type Phase = 'lobby' | 'countdown' | 'racing' | 'results';

export const TypeRacer: React.FC = () => {
  const [roomId, setRoomId] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [selectedLang, setSelectedLang] = useState<LanguageId>('typescript');
  const [phase, setPhase] = useState<Phase>('lobby');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const r = params.get('room');
      if (r) setInviteCode(r.trim().toUpperCase());

      const saved = storage.getDisplayName();
      if (saved) setDisplayName(saved);
    }
  }, []);

  const {
    status,
    players,
    currentPlayerId,
    isHost,
    broadcast,
    onBroadcast,
  } = useSupabaseRoom({
    roomId,
    displayName,
    isHostIntent: !roomId,
  });

  const [snippet, setSnippet] = useState('');
  const [countdown, setCountdown] = useState(3);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [myWpm, setMyWpm] = useState(0);

  // Map of all racers: playerId -> { charIndex, totalChars, wpm, finished, finishRank }
  const [racerStats, setRacerStats] = useState<
    Record<string, { charIndex: number; totalChars: number; wpm: number; finished: boolean; rank?: number }>
  >({});

  const [finisherCount, setFinisherCount] = useState(0);
  const trackerRef = useRef<WpmTracker>(new WpmTracker());
  const inputRef = useRef<HTMLInputElement>(null);
  const heartbeatTimerRef = useRef<any>(null);

  // Lobby room handling
  const handleCreateRoom = (name: string) => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    storage.setDisplayName(name);
    setDisplayName(name);
    setRoomId(code);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('room', code);
      window.history.pushState({}, '', url.toString());
    }
  };

  const handleJoinRoom = (code: string, name: string) => {
    storage.setDisplayName(name);
    setDisplayName(name);
    setRoomId(code);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('room', code);
      window.history.pushState({}, '', url.toString());
    }
  };

  // Host launches race
  const handleStartRace = () => {
    if (!isHost) return;
    const freshSnippet = generateSnippet(selectedLang, 'standard');

    broadcast('race:countdown', {
      snippet: freshSnippet,
      lang: selectedLang,
    });

    startCountdown(freshSnippet);
  };

  const startCountdown = (codeSnippet: string) => {
    setSnippet(codeSnippet);
    setCurrentIndex(0);
    setHasError(false);
    setMyWpm(0);
    setRacerStats({});
    setFinisherCount(0);
    setPhase('countdown');
    setCountdown(3);

    let count = 3;
    const interval = setInterval(() => {
      count -= 1;
      if (count > 0) {
        setCountdown(count);
      } else {
        clearInterval(interval);
        setPhase('racing');
        trackerRef.current.start();
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    }, 800);
  };

  // Broadcast listeners
  useEffect(() => {
    const unsubCountdown = onBroadcast('race:countdown', (payload) => {
      startCountdown(payload.snippet);
    });

    const unsubProgress = onBroadcast('progress:update', (payload) => {
      setRacerStats((prev) => ({
        ...prev,
        [payload.playerId]: {
          charIndex: payload.charIndex,
          totalChars: payload.totalChars,
          wpm: payload.wpm,
          finished: payload.finished,
          rank: payload.rank,
        },
      }));
    });

    const unsubFinish = onBroadcast('race:finish', () => {
      setPhase('results');
    });

    return () => {
      unsubCountdown();
      unsubProgress();
      unsubFinish();
    };
  }, [onBroadcast]);

  // Periodic heartbeat broadcast (400ms)
  useEffect(() => {
    if (phase !== 'racing') return;

    heartbeatTimerRef.current = setInterval(() => {
      const metrics = trackerRef.current.getMetrics();
      setMyWpm(metrics.wpm);

      broadcast('progress:update', {
        playerId: currentPlayerId,
        charIndex: currentIndex,
        totalChars: snippet.length,
        wpm: metrics.wpm,
        finished: currentIndex >= snippet.length,
      });
    }, BROADCAST_INTERVAL_MS);

    return () => {
      if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current);
    };
  }, [phase, currentIndex, snippet.length, broadcast, currentPlayerId]);

  // Typing key handler
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (phase !== 'racing') return;
    if (e.key === 'Shift' || e.key === 'Control' || e.key === 'Alt' || e.key === 'Meta') return;

    const expectedChar = snippet[currentIndex];
    let typedChar = e.key;
    if (e.key === 'Enter') typedChar = '\n';

    const isCorrect = trackerRef.current.recordKey(expectedChar, typedChar);

    if (isCorrect) {
      setHasError(false);
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);

      // Check finish
      if (nextIndex >= snippet.length) {
        const finalMetrics = trackerRef.current.getMetrics();
        const nextRank = finisherCount + 1;
        setFinisherCount(nextRank);

        broadcast('progress:update', {
          playerId: currentPlayerId,
          charIndex: nextIndex,
          totalChars: snippet.length,
          wpm: finalMetrics.wpm,
          finished: true,
          rank: nextRank,
        });

        storage.recordGameFinished('type-racer', finalMetrics.wpm);
        setTimeout(() => setPhase('results'), 1200);
      }
    } else {
      setHasError(true);
    }
  };

  // Compile racers list for track
  const allRacers: RacerProgress[] = players.map((p) => {
    const isMe = p.id === currentPlayerId;
    const stats = racerStats[p.id];
    const total = snippet.length || 100;
    const current = isMe ? currentIndex : stats?.charIndex || 0;
    const wpm = isMe ? myWpm : stats?.wpm || 0;
    const finished = isMe ? currentIndex >= total : !!stats?.finished;

    return {
      playerId: p.id,
      displayName: p.displayName,
      percent: Math.round((current / total) * 100),
      wpm,
      finished,
      isMe,
    };
  });

  const handleLeaveRoom = () => {
    setRoomId('');
    setInviteCode('');
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('room');
      window.history.replaceState({}, '', url.toString());
    }
  };

  // VIEW 1: Lobby
  if (phase === 'lobby') {
    return (
      <div className="typeracer-lobby-wrap">
        <RoomLobby
          gameTitle="TypeRacer"
          gameIcon="🏎️"
          minPlayers={2}
          maxPlayers={8}
          currentRoomId={roomId}
          inviteRoomCode={inviteCode}
          players={players}
          currentPlayerId={currentPlayerId}
          isHost={isHost}
          status={status}
          onJoinRoom={handleJoinRoom}
          onCreateRoom={handleCreateRoom}
          onStartGame={handleStartRace}
          onLeaveRoom={handleLeaveRoom}
        />

        {roomId && (
          <div className="lobby-options-panel">
            <span className="options-title">SELECT RACE LANGUAGE</span>
            <div className="langs-row">
              {LANGUAGES.map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setSelectedLang(l)}
                  className={`lang-pill ${selectedLang === l ? 'active' : ''}`}
                >
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        )}

        <style>{`
          .typeracer-lobby-wrap {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 16px;
            width: 100%;
            padding: 16px;
            box-sizing: border-box;
          }
          .lobby-options-panel {
            max-width: 520px;
            width: 100%;
            background: #0f172a;
            border: 1px solid #1e293b;
            border-radius: var(--radius-md);
            padding: 14px;
            display: flex;
            flex-direction: column;
            gap: 8px;
          }
          .options-title {
            font-size: 11px;
            font-weight: 800;
            color: #94a3b8;
          }
          .langs-row {
            display: flex;
            gap: 6px;
            flex-wrap: wrap;
          }
          .lang-pill {
            padding: 6px 12px;
            border-radius: var(--radius-sm);
            background: #1e293b;
            border: 1px solid #334155;
            color: #f8fafc;
            font-size: 11px;
            font-weight: 700;
            cursor: pointer;
          }
          .lang-pill.active {
            background: var(--accent-default);
            border-color: var(--accent-default);
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="typeracer-root">
      {/* Realtime Track */}
      <RaceTrack racers={allRacers} />

      {/* Countdown overlay */}
      {phase === 'countdown' && (
        <div className="countdown-overlay">
          <div className="countdown-digit">{countdown}</div>
          <span className="countdown-text">REV YOUR ENGINES!</span>
        </div>
      )}

      {/* Active Racing Code Terminal */}
      <div className="racing-terminal" onClick={() => inputRef.current?.focus()}>
        <input
          ref={inputRef}
          type="text"
          className="hidden-typing-input"
          autoFocus
          autoCapitalize="none"
          autoComplete="off"
          autoCorrect="off"
          spellCheck="false"
          onKeyDown={handleKeyDown}
          onBlur={() => setTimeout(() => inputRef.current?.focus(), 50)}
        />

        <div className="terminal-header">
          <span>RACE CODE: {selectedLang.toUpperCase()}</span>
          <span className="wpm-tag">MY WPM: {myWpm}</span>
        </div>

        <div className="code-box">
          <pre className="code-content">
            {snippet.split('').map((char, idx) => {
              let cls = 'char-pending';
              const isCur = idx === currentIndex;
              if (idx < currentIndex) cls = 'char-done';
              else if (isCur) cls = hasError ? 'char-err' : 'char-cur';

              return (
                <span key={idx} className={`code-char ${cls}`}>
                  {isCur && <span className="cursor-line"></span>}
                  {char === '\n' ? '↵\n' : char}
                </span>
              );
            })}
          </pre>
        </div>
      </div>

      {/* Results View */}
      {phase === 'results' && (
        <GameOverScreen
          gameId="type-racer"
          gameTitle="TypeRacer Grand Prix"
          playerResults={allRacers.map((r, i) => ({
            displayName: r.displayName,
            score: r.wpm,
            isMe: r.isMe,
          }))}
          onPlayAgain={() => setPhase('lobby')}
          onShareCustomText={() =>
            `🏎️ TypeRacer Code Drag Race\n` +
            `⚡ Speed: ${myWpm} WPM | ${selectedLang.toUpperCase()}\n` +
            `Race with your team: https://devscrolls.dev/arcade/type-racer/`
          }
        />
      )}

      <style>{`
        .typeracer-root {
          max-width: 860px;
          width: 100%;
          min-height: 100%;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 14px;
          padding: 16px;
          box-sizing: border-box;
          position: relative;
        }

        .countdown-overlay {
          position: absolute;
          inset: 0;
          background: rgba(11, 19, 41, 0.85);
          backdrop-filter: blur(6px);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          z-index: 50;
        }

        .countdown-digit {
          font-size: 110px;
          font-weight: 900;
          color: #ef4444;
          font-family: var(--font-mono, monospace);
        }

        .countdown-text {
          font-size: 16px;
          font-weight: 800;
          color: #f8fafc;
          letter-spacing: 0.1em;
        }

        .racing-terminal {
          background: #0f172a;
          border: 1px solid #1e293b;
          border-radius: var(--radius-lg);
          overflow: hidden;
          cursor: text;
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .hidden-typing-input {
          position: absolute;
          opacity: 0;
          width: 0;
          height: 0;
        }

        .terminal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 16px;
          background: #1e293b;
          font-size: 11px;
          font-weight: 800;
          color: #94a3b8;
        }

        .wpm-tag {
          color: #38bdf8;
          font-family: var(--font-mono, monospace);
        }

        .code-box {
          padding: 24px;
          overflow-x: auto;
          line-height: 1.8;
          flex: 1;
        }

        .code-content {
          margin: 0;
          font-family: var(--font-mono, monospace);
          font-size: 16px;
          white-space: pre-wrap;
          word-break: break-all;
        }

        .code-char {
          position: relative;
        }

        .char-pending { color: #475569; }
        .char-done { color: #38bdf8; }
        .char-cur { background: rgba(56, 189, 248, 0.25); color: #ffffff; }
        .char-err { background: rgba(239, 68, 68, 0.4); color: #f87171; }

        .cursor-line {
          position: absolute;
          left: 0;
          bottom: 0;
          width: 2px;
          height: 100%;
          background: #38bdf8;
        }
      `}</style>
    </div>
  );
};
