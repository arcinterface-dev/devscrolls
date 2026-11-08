import React, { useState, useEffect, useRef } from 'react';
import { useSupabaseRoom } from '../shared/useSupabaseRoom';
import { RoomLobby } from '../shared/RoomLobby';
import { TerminalScreen } from './TerminalScreen';
import { TugOfWar } from './TugOfWar';
import { AlertFlash } from './AlertFlash';
import { GameOverScreen } from '../shared/GameOverScreen';
import { ALERTS, type AlertPrompt } from './alerts';
import { storage } from '../shared/storage';

type Phase = 'lobby' | 'standby' | 'alert' | 'round_result' | 'duel_over';

export const TerminalDuel: React.FC = () => {
  const [roomId, setRoomId] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [displayName, setDisplayName] = useState('');
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

  const [currentRound, setCurrentRound] = useState(1);
  const [currentAlert, setCurrentAlert] = useState<AlertPrompt>(ALERTS[0]);
  const [roundResults, setRoundResults] = useState<('p1' | 'p2')[]>([]);
  const [p1Score, setP1Score] = useState(0);
  const [p2Score, setP2Score] = useState(0);

  const [roundFeedback, setRoundFeedback] = useState<string>('');
  const [lastReactions, setLastReactions] = useState<{ p1Ms?: number; p2Ms?: number }>({});

  const alertTimestampRef = useRef<number>(0);
  const roundTimerRef = useRef<any>(null);

  const p1 = players[0];
  const p2 = players[1];
  const isP1 = currentPlayerId === p1?.id;

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

  // Host launches duel
  const handleStartDuel = () => {
    if (!isHost || players.length < 2) return;
    setRoundResults([]);
    setP1Score(0);
    setP2Score(0);
    setCurrentRound(1);

    broadcast('duel:start', {});
    prepareNextRound(1);
  };

  const prepareNextRound = (roundNum: number) => {
    setPhase('standby');
    setRoundFeedback('⏳ STAND BY FOR TERMINAL ALERT...');

    // Pick random prompt and random delay between 1500ms and 3500ms
    const prompt = ALERTS[Math.floor(Math.random() * ALERTS.length)];
    const delay = 1500 + Math.floor(Math.random() * 2000);

    if (roundTimerRef.current) clearTimeout(roundTimerRef.current);

    if (isHost) {
      roundTimerRef.current = setTimeout(() => {
        const triggerTime = Date.now();
        broadcast('duel:alert', {
          alertId: prompt.id,
          timestamp: triggerTime,
        });
        triggerAlertLocally(prompt, triggerTime);
      }, delay);
    }
  };

  const triggerAlertLocally = (prompt: AlertPrompt, timestamp: number) => {
    setCurrentAlert(prompt);
    alertTimestampRef.current = performance.now();
    setPhase('alert');
  };

  // Broadcast listeners
  useEffect(() => {
    const unsubStart = onBroadcast('duel:start', () => {
      setRoundResults([]);
      setP1Score(0);
      setP2Score(0);
      setCurrentRound(1);
      setPhase('standby');
      setRoundFeedback('⏳ STAND BY FOR TERMINAL ALERT...');
    });

    const unsubAlert = onBroadcast('duel:alert', (payload) => {
      const prompt = ALERTS.find((a) => a.id === payload.alertId) || ALERTS[0];
      triggerAlertLocally(prompt, payload.timestamp);
    });

    const unsubReaction = onBroadcast('duel:reaction', (payload: { playerId: string; reactionMs: number; key: string }) => {
      // Host validates reaction
      if (isHost && phase === 'alert') {
        validateReaction(payload.playerId, payload.reactionMs, payload.key);
      }
    });

    const unsubRoundWon = onBroadcast('duel:round_win', (payload: {
      winnerPlayerId: string;
      winnerSlot: 'p1' | 'p2';
      reactionMs: number;
      feedback: string;
    }) => {
      resolveRoundLocally(payload.winnerSlot, payload.feedback, payload.reactionMs);
    });

    const unsubFoul = onBroadcast('duel:foul', (payload: { fouledPlayerId: string; winnerSlot: 'p1' | 'p2'; reason: string }) => {
      resolveRoundLocally(payload.winnerSlot, payload.reason);
    });

    return () => {
      unsubStart();
      unsubAlert();
      unsubReaction();
      unsubRoundWon();
      unsubFoul();
    };
  }, [onBroadcast, isHost, phase]);

  const validateReaction = (playerId: string, reactionMs: number, key: string) => {
    const isCorrectKey =
      key.toLowerCase() === currentAlert.expectedKey.toLowerCase() ||
      (currentAlert.expectedKey === ' ' && key === 'Space');

    const winnerSlot = playerId === p1?.id ? 'p1' : 'p2';
    const loserSlot = winnerSlot === 'p1' ? 'p2' : 'p1';

    if (!isCorrectKey) {
      // Wrong key foul
      broadcast('duel:foul', {
        fouledPlayerId: playerId,
        winnerSlot: loserSlot,
        reason: `Wrong key pressed (${key})! Round awarded to opponent.`,
      });
      resolveRoundLocally(loserSlot, `Wrong key pressed! Round awarded to opponent.`);
      return;
    }

    const playerName = players.find((p) => p.id === playerId)?.displayName || 'Player';
    const feedback = `${playerName} reacted in ${reactionMs}ms!`;

    broadcast('duel:round_win', {
      winnerPlayerId: playerId,
      winnerSlot,
      reactionMs,
      feedback,
    });
    resolveRoundLocally(winnerSlot, feedback, reactionMs);
  };

  const resolveRoundLocally = (winnerSlot: 'p1' | 'p2', feedback: string, reactionMs?: number) => {
    setPhase('round_result');
    setRoundFeedback(feedback);

    const nextResults = [...roundResults, winnerSlot];
    setRoundResults(nextResults);

    const newP1Score = winnerSlot === 'p1' ? p1Score + 1 : p1Score;
    const newP2Score = winnerSlot === 'p2' ? p2Score + 1 : p2Score;
    setP1Score(newP1Score);
    setP2Score(newP2Score);

    // Check match victory (first to 3)
    if (newP1Score >= 3 || newP2Score >= 3) {
      setTimeout(() => {
        setPhase('duel_over');
        storage.recordGameFinished('terminal-duel', Math.min(newP1Score, newP2Score));
      }, 2500);
    } else {
      setTimeout(() => {
        setCurrentRound((r) => r + 1);
        prepareNextRound(currentRound + 1);
      }, 2500);
    }
  };

  // Local player reacts
  const handlePlayerReact = (key: string) => {
    if (phase === 'standby') {
      // Anticipation False Start Foul!
      const mySlot = isP1 ? 'p1' : 'p2';
      const opponentSlot = isP1 ? 'p2' : 'p1';
      broadcast('duel:foul', {
        fouledPlayerId: currentPlayerId,
        winnerSlot: opponentSlot,
        reason: 'False Start! Pressed key before alert appeared.',
      });
      resolveRoundLocally(opponentSlot, 'False Start! Pressed key before alert appeared.');
      return;
    }

    if (phase !== 'alert') return;

    const reactionMs = Math.round(performance.now() - alertTimestampRef.current);
    broadcast('duel:reaction', {
      playerId: currentPlayerId,
      reactionMs,
      key,
    });

    if (isHost) {
      validateReaction(currentPlayerId, reactionMs, key);
    }
  };

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
      <RoomLobby
        gameTitle="Terminal Duel"
        gameIcon="⚡"
        minPlayers={2}
        maxPlayers={2}
        currentRoomId={roomId}
        inviteRoomCode={inviteCode}
        players={players}
        currentPlayerId={currentPlayerId}
        isHost={isHost}
        status={status}
        onJoinRoom={handleJoinRoom}
        onCreateRoom={handleCreateRoom}
        onStartGame={handleStartDuel}
        onLeaveRoom={handleLeaveRoom}
      />
    );
  }

  const matchWinner = p1Score >= 3 ? p1 : p2;

  return (
    <div className="duel-root-container">
      {/* 1v1 Tug of War Scoreboard */}
      <TugOfWar
        p1Name={p1?.displayName || 'Player 1'}
        p2Name={p2?.displayName || 'Player 2'}
        p1Score={p1Score}
        p2Score={p2Score}
        roundResults={roundResults}
      />

      {/* Main Terminal Screen Area */}
      <div className="terminal-arena">
        <TerminalScreen
          statusText={roundFeedback}
          isTriggered={phase === 'alert'}
        />

        {/* Reaction Trigger Flash */}
        <AlertFlash
          alert={currentAlert}
          isTriggered={phase === 'alert'}
          onReact={handlePlayerReact}
        />
      </div>

      {/* Round Instructions / Keys hint */}
      <div className="duel-tips-bar">
        <span>⚠️ Keep fingers ready. Do NOT press before the alert appears or you will commit a False Start!</span>
      </div>

      {/* Match Over Modal */}
      {phase === 'duel_over' && (
        <GameOverScreen
          gameId="terminal-duel"
          gameTitle="Terminal Duel Showdown"
          playerResults={[
            { displayName: `${matchWinner?.displayName} (CHAMPION)`, score: Math.max(p1Score, p2Score) },
            { displayName: `${p1Score < 3 ? p1?.displayName : p2?.displayName}`, score: Math.min(p1Score, p2Score) },
          ]}
          onPlayAgain={() => setPhase('lobby')}
          onShareCustomText={() =>
            `⚡ Terminal Duel: 1v1 Reflex Showdown\n` +
            `🏆 ${matchWinner?.displayName} Won the Showdown (${p1Score} - ${p2Score})!\n` +
            `Challenge me to a 1v1 duel: https://devscrolls.dev/arcade/terminal-duel/`
          }
        />
      )}

      <style>{`
        .duel-root-container {
          max-width: 780px;
          width: 100%;
          min-height: 100%;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 16px;
          padding: 16px;
          box-sizing: border-box;
          position: relative;
        }

        .terminal-arena {
          position: relative;
          width: 100%;
          min-height: 340px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .duel-tips-bar {
          text-align: center;
          font-size: 11.5px;
          color: #64748b;
        }
      `}</style>
    </div>
  );
};
