import React, { useState, useEffect } from 'react';
import { useSupabaseRoom } from '../shared/useSupabaseRoom';
import { RoomLobby } from '../shared/RoomLobby';
import { TeamSelector, type PlayerTeamAssignment } from './TeamSelector';
import { CardTile, type CardState, type CardType } from './CardTile';
import { ClueBar } from './ClueBar';
import { GameOverScreen } from '../shared/GameOverScreen';
import { CODENAMES_WORDS } from './words';
import { storage } from '../shared/storage';

type GamePhase = 'lobby' | 'playing' | 'game_over';

export const CodeNames: React.FC = () => {
  const [roomId, setRoomId] = useState<string>('');
  const [inviteCode, setInviteCode] = useState<string>('');
  const [displayName, setDisplayName] = useState<string>('');
  const [phase, setPhase] = useState<GamePhase>('lobby');

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

  // Team & Role Assignments: playerId -> { team, role }
  const [assignments, setAssignments] = useState<Record<string, PlayerTeamAssignment>>({});

  // 5x5 Board state
  const [cards, setCards] = useState<CardState[]>([]);
  const [currentTurn, setCurrentTurn] = useState<'red' | 'blue'>('red');
  const [activeClue, setActiveClue] = useState<{ word: string; count: number } | null>(null);
  const [remainingGuesses, setRemainingGuesses] = useState<number>(0);
  const [winningTeam, setWinningTeam] = useState<'red' | 'blue' | null>(null);
  const [winReason, setWinReason] = useState<string>('');

  const myAssignment = assignments[currentPlayerId] || { team: 'red', role: 'operative' };
  const isSpymaster = myAssignment.role === 'spymaster';
  const isMyTeamTurn = myAssignment.team === currentTurn;

  // Lobby actions
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

  const handleSelectTeamRole = (team: 'red' | 'blue', role: 'spymaster' | 'operative') => {
    const next = { ...assignments, [currentPlayerId]: { team, role } };
    setAssignments(next);
    broadcast('team:update', { playerId: currentPlayerId, team, role });
  };

  // Host starts game
  const handleStartGame = () => {
    if (!isHost) return;

    // Pick 25 random words
    const shuffledWords = [...CODENAMES_WORDS].sort(() => 0.5 - Math.random()).slice(0, 25);

    // Card types: 9 Red, 8 Blue, 7 Neutral, 1 Assassin
    const types: CardType[] = [
      ...Array(9).fill('red'),
      ...Array(8).fill('blue'),
      ...Array(7).fill('neutral'),
      'assassin',
    ].sort(() => 0.5 - Math.random());

    const generatedCards: CardState[] = shuffledWords.map((word, index) => ({
      id: index,
      word,
      type: types[index],
      isRevealed: false,
    }));

    broadcast('board:start', {
      cards: generatedCards,
      startingTeam: 'red',
    });

    setCards(generatedCards);
    setCurrentTurn('red');
    setActiveClue(null);
    setWinningTeam(null);
    setPhase('playing');
  };

  // Broadcast listeners
  useEffect(() => {
    const unsubTeam = onBroadcast('team:update', (payload) => {
      setAssignments((prev) => ({
        ...prev,
        [payload.playerId]: { team: payload.team, role: payload.role },
      }));
    });

    const unsubStart = onBroadcast('board:start', (payload) => {
      setCards(payload.cards);
      setCurrentTurn(payload.startingTeam);
      setActiveClue(null);
      setWinningTeam(null);
      setPhase('playing');
    });

    const unsubClue = onBroadcast('clue:give', (payload) => {
      setActiveClue({ word: payload.word, count: payload.count });
      setRemainingGuesses(payload.count + 1);
    });

    const unsubReveal = onBroadcast('card:reveal', (payload: { cardId: number; cardType: CardType }) => {
      setCards((prev) =>
        prev.map((c) => (c.id === payload.cardId ? { ...c, isRevealed: true } : c))
      );
    });

    const unsubTurnEnd = onBroadcast('turn:end', (payload: { nextTeam: 'red' | 'blue' }) => {
      setCurrentTurn(payload.nextTeam);
      setActiveClue(null);
      setRemainingGuesses(0);
    });

    const unsubGameOver = onBroadcast('game:over', (payload) => {
      setWinningTeam(payload.winner);
      setWinReason(payload.reason);
      setPhase('game_over');
    });

    return () => {
      unsubTeam();
      unsubStart();
      unsubClue();
      unsubReveal();
      unsubTurnEnd();
      unsubGameOver();
    };
  }, [onBroadcast]);

  // Spymaster gives clue
  const handleGiveClue = (word: string, count: number) => {
    setActiveClue({ word, count });
    setRemainingGuesses(count + 1);
    broadcast('clue:give', { word, count });
  };

  // Operative reveals card
  const handleCardClick = (card: CardState) => {
    if (phase !== 'playing') return;
    if (!isMyTeamTurn || isSpymaster || !activeClue || card.isRevealed) return;

    // Reveal card
    broadcast('card:reveal', { cardId: card.id, cardType: card.type });

    setCards((prev) =>
      prev.map((c) => (c.id === card.id ? { ...c, isRevealed: true } : c))
    );

    // 1. Assassin clicked -> Instant loss
    if (card.type === 'assassin') {
      const otherTeam = currentTurn === 'red' ? 'blue' : 'red';
      broadcast('game:over', {
        winner: otherTeam,
        reason: `${currentTurn.toUpperCase()} Team triggered the Outage Assassin card!`,
      });
      setWinningTeam(otherTeam);
      setWinReason(`${currentTurn.toUpperCase()} Team triggered the Outage Assassin card!`);
      setPhase('game_over');
      return;
    }

    // 2. Clicked own team card
    if (card.type === currentTurn) {
      const nextRemaining = remainingGuesses - 1;
      setRemainingGuesses(nextRemaining);

      // Check if team has found all cards
      const myTeamCardsLeft = cards.filter(
        (c) => c.type === currentTurn && (!c.isRevealed && c.id !== card.id)
      ).length;

      if (myTeamCardsLeft === 0) {
        broadcast('game:over', {
          winner: currentTurn,
          reason: `${currentTurn.toUpperCase()} Team identified all architecture tokens!`,
        });
        setWinningTeam(currentTurn);
        setWinReason(`${currentTurn.toUpperCase()} Team identified all architecture tokens!`);
        setPhase('game_over');
        return;
      }

      if (nextRemaining <= 0) {
        passTurn();
      }
    } else {
      // Clicked neutral or opponent card -> Turn ends immediately
      passTurn();
    }
  };

  const passTurn = () => {
    const next = currentTurn === 'red' ? 'blue' : 'red';
    setCurrentTurn(next);
    setActiveClue(null);
    setRemainingGuesses(0);
    broadcast('turn:end', { nextTeam: next });
  };

  // Count remaining cards
  const redCardsLeft = cards.filter((c) => c.type === 'red' && !c.isRevealed).length;
  const blueCardsLeft = cards.filter((c) => c.type === 'blue' && !c.isRevealed).length;

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
      <div className="codenames-lobby-wrap">
        <RoomLobby
          gameTitle="CodeNames: Tech Edition"
          gameIcon="🔎"
          minPlayers={2}
          maxPlayers={10}
          currentRoomId={roomId}
          inviteRoomCode={inviteCode}
          players={players}
          currentPlayerId={currentPlayerId}
          isHost={isHost}
          status={status}
          onJoinRoom={handleJoinRoom}
          onCreateRoom={handleCreateRoom}
          onStartGame={handleStartGame}
          onLeaveRoom={handleLeaveRoom}
        />
        {roomId && (
          <div className="lobby-team-panel">
            <TeamSelector
              players={players}
              currentPlayerId={currentPlayerId}
              assignments={assignments}
              onSelectTeamRole={handleSelectTeamRole}
            />
          </div>
        )}

        <style>{`
          .codenames-lobby-wrap {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 16px;
            width: 100%;
            padding: 16px;
            box-sizing: border-box;
          }
          .lobby-team-panel {
            max-width: 520px;
            width: 100%;
          }
        `}</style>
      </div>
    );
  }

  // VIEW 2: In-Game
  return (
    <div className="codenames-root">
      {/* Top Scores HUD */}
      <div className="codenames-hud">
        <div className="team-score-badge red-badge">
          <span className="badge-team-name">RED TEAM</span>
          <strong className="badge-cards-left">{redCardsLeft} CARDS LEFT</strong>
        </div>

        <div className="turn-banner">
          <span className={`turn-dot dot-${currentTurn}`}></span>
          <strong>{currentTurn.toUpperCase()} TEAM'S TURN</strong>
          <small>{isMyTeamTurn ? (isSpymaster ? '(You: Spymaster)' : '(You: Operative)') : '(Waiting)'}</small>
        </div>

        <div className="team-score-badge blue-badge">
          <span className="badge-team-name">BLUE TEAM</span>
          <strong className="badge-cards-left">{blueCardsLeft} CARDS LEFT</strong>
        </div>
      </div>

      {/* Clue Bar */}
      <ClueBar
        currentTeam={currentTurn}
        isSpymaster={isSpymaster}
        isMyTeamTurn={isMyTeamTurn}
        activeClue={activeClue}
        remainingGuesses={remainingGuesses}
        onGiveClue={handleGiveClue}
        onEndTurn={passTurn}
      />

      {/* 5x5 Card Grid */}
      <div className="board-grid">
        {cards.map((card) => (
          <CardTile
            key={card.id}
            card={card}
            isSpymaster={isSpymaster}
            canClick={isMyTeamTurn && !isSpymaster && !!activeClue && !card.isRevealed}
            onClick={() => handleCardClick(card)}
          />
        ))}
      </div>

      {/* Spymaster Legend Footer */}
      {isSpymaster && (
        <div className="spymaster-legend">
          <span>🕶️ SPYMASTER KEY:</span>
          <span className="legend-chip red">Red (9)</span>
          <span className="legend-chip blue">Blue (8)</span>
          <span className="legend-chip neutral">Neutral (7)</span>
          <span className="legend-chip assassin">Assassin (1)</span>
        </div>
      )}

      {/* Game Over Screen */}
      {phase === 'game_over' && (
        <GameOverScreen
          gameId="codenames"
          gameTitle="CodeNames Match"
          results={[
            { displayName: `${winningTeam?.toUpperCase()} TEAM (WINNERS)`, score: 100 },
            { displayName: `${winningTeam === 'red' ? 'BLUE' : 'RED'} TEAM`, score: 40 },
          ]}
          onPlayAgain={() => {
            setPhase('lobby');
          }}
          onShareCustomText={() =>
            `🔎 CodeNames: Tech Edition\n` +
            `🏆 ${winningTeam?.toUpperCase()} Team Wins!\n` +
            `${winReason}\n` +
            `Play with your engineering team: https://devscrolls.dev/arcade/codenames/`
          }
        />
      )}

      <style>{`
        .codenames-root {
          max-width: 860px;
          width: 100%;
          min-height: 100%;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 16px;
          box-sizing: border-box;
        }

        .codenames-hud {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #0f172a;
          border: 1px solid #1e293b;
          border-radius: var(--radius-md);
          padding: 8px 16px;
        }

        .team-score-badge {
          display: flex;
          flex-direction: column;
        }

        .red-badge {
          color: #ef4444;
        }

        .blue-badge {
          color: #3b82f6;
          align-items: flex-end;
        }

        .badge-team-name {
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.06em;
        }

        .badge-cards-left {
          font-family: var(--font-mono, monospace);
          font-size: 14px;
          font-weight: 800;
        }

        .turn-banner {
          display: flex;
          flex-direction: column;
          align-items: center;
          font-size: 12.5px;
          color: #f8fafc;
        }

        .turn-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          margin-bottom: 2px;
        }

        .dot-red { background: #ef4444; box-shadow: 0 0 8px #ef4444; }
        .dot-blue { background: #3b82f6; box-shadow: 0 0 8px #3b82f6; }

        .turn-banner small {
          font-size: 10px;
          color: #94a3b8;
        }

        .board-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          grid-template-rows: repeat(5, 1fr);
          gap: 8px;
          flex: 1;
        }

        .spymaster-legend {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          font-size: 11px;
          color: #94a3b8;
          background: #090e1a;
          border: 1px solid #1e293b;
          border-radius: var(--radius-sm);
          padding: 6px;
        }

        .legend-chip {
          font-weight: 800;
          padding: 2px 6px;
          border-radius: 3px;
        }

        .legend-chip.red { background: rgba(239, 68, 68, 0.2); color: #ef4444; }
        .legend-chip.blue { background: rgba(59, 130, 246, 0.2); color: #3b82f6; }
        .legend-chip.neutral { background: rgba(148, 163, 184, 0.2); color: #94a3b8; }
        .legend-chip.assassin { background: #000; color: #ef4444; }
      `}</style>
    </div>
  );
};
