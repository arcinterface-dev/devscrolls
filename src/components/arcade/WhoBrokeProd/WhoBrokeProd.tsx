import React, { useState, useEffect, useRef } from 'react';
import { useSupabaseRoom } from '../shared/useSupabaseRoom';
import { RoomLobby } from '../shared/RoomLobby';
import { IncidentCard } from './IncidentCard';
import { DiscussionChat, type PostmortemChatMessage } from './DiscussionChat';
import { VotingPanel } from './VotingPanel';
import { GameOverScreen } from '../shared/GameOverScreen';
import { INCIDENT_SCENARIOS, type IncidentScenario } from './incidents';
import { storage } from '../shared/storage';

type Phase = 'lobby' | 'incident' | 'discussion' | 'voting' | 'resolution' | 'game_over';

export const WhoBrokeProd: React.FC = () => {
  const [roomId, setRoomId] = useState<string>('');
  const [inviteCode, setInviteCode] = useState<string>('');
  const [displayName, setDisplayName] = useState<string>('');
  const [phase, setPhase] = useState<Phase>('lobby');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const roomParam = params.get('room');
      if (roomParam) setInviteCode(roomParam.trim().toUpperCase());

      const savedName = storage.getDisplayName();
      if (savedName) setDisplayName(savedName);
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

  // Game specific state
  const [currentIncident, setCurrentIncident] = useState<IncidentScenario | null>(null);
  const [isRogue, setIsRogue] = useState(false);
  const [roguePlayerId, setRoguePlayerId] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState(180); // 3 mins discussion
  const [messages, setMessages] = useState<PostmortemChatMessage[]>([]);
  const [selectedSuspectId, setSelectedSuspectId] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [votes, setVotes] = useState<Record<string, string>>({}); // voterId -> suspectId
  const [scores, setScores] = useState<Record<string, number>>({});
  const [winnerMessage, setWinnerMessage] = useState<string>('');

  const timerRef = useRef<any>(null);

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

  // Host starts round
  const handleStartGame = () => {
    if (!isHost || players.length < 2) return;

    // Pick random incident
    const incident = INCIDENT_SCENARIOS[Math.floor(Math.random() * INCIDENT_SCENARIOS.length)];
    // Pick random rogue
    const rogue = players[Math.floor(Math.random() * players.length)];

    broadcast('round:start', {
      incidentId: incident.id,
      rogueId: rogue.id,
    });

    setupRoundLocally(incident, rogue.id);
  };

  const setupRoundLocally = (incident: IncidentScenario, rogueId: string) => {
    setRoguePlayerId(rogueId);
    const amIRogue = currentPlayerId === rogueId;
    setIsRogue(amIRogue);
    setCurrentIncident(amIRogue ? null : incident);
    setPhase('discussion');
    setTimeLeft(180);
    setMessages([]);
    setVotes({});
    setHasVoted(false);
    setSelectedSuspectId(null);

    if (timerRef.current) clearInterval(timerRef.current);
    let sec = 180;
    timerRef.current = setInterval(() => {
      sec -= 1;
      setTimeLeft(sec);
      if (sec <= 0) {
        clearInterval(timerRef.current);
        setPhase('voting');
      }
    }, 1000);
  };

  // Broadcast listeners
  useEffect(() => {
    const unsubStart = onBroadcast('round:start', (payload) => {
      const inc = INCIDENT_SCENARIOS.find((i) => i.id === payload.incidentId) || INCIDENT_SCENARIOS[0];
      setupRoundLocally(inc, payload.rogueId);
    });

    const unsubChat = onBroadcast('chat:postmortem', (payload: PostmortemChatMessage) => {
      setMessages((prev) => [...prev, payload]);
    });

    const unsubVoteState = onBroadcast('phase:voting', () => {
      if (timerRef.current) clearInterval(timerRef.current);
      setPhase('voting');
    });

    const unsubCastVote = onBroadcast('vote:cast', (payload: { voterId: string; suspectId: string }) => {
      setVotes((prev) => {
        const next = { ...prev, [payload.voterId]: payload.suspectId };
        // If all players voted, resolve
        if (Object.keys(next).length >= players.length) {
          resolveVotes(next);
        }
        return next;
      });
    });

    const unsubRogueGuess = onBroadcast('rogue:guess', (payload: { guess: string; success: boolean }) => {
      if (payload.success) {
        setWinnerMessage(`🎉 The Rogue Deployer correctly identified the incident! ROGUE WINS!`);
        setPhase('resolution');
      }
    });

    return () => {
      unsubStart();
      unsubChat();
      unsubVoteState();
      unsubCastVote();
      unsubRogueGuess();
    };
  }, [onBroadcast, players.length, isRogue]);

  const handleSendMessage = (text: string) => {
    const msg: PostmortemChatMessage = {
      id: 'm_' + Math.random(),
      senderName: displayName || 'Anonymous',
      senderId: currentPlayerId,
      text,
    };
    setMessages((prev) => [...prev, msg]);
    broadcast('chat:postmortem', msg);
  };

  const handleAdvanceToVote = () => {
    if (!isHost) return;
    if (timerRef.current) clearInterval(timerRef.current);
    setPhase('voting');
    broadcast('phase:voting', {});
  };

  const handleCastVote = (suspectId: string) => {
    setSelectedSuspectId(suspectId);
    setHasVoted(true);
    broadcast('vote:cast', { voterId: currentPlayerId, suspectId });
  };

  const resolveVotes = (finalVotes: Record<string, string>) => {
    // Tally votes
    const tally: Record<string, number> = {};
    Object.values(finalVotes).forEach((suspect) => {
      tally[suspect] = (tally[suspect] || 0) + 1;
    });

    let topSuspect = '';
    let maxVotes = 0;
    Object.entries(tally).forEach(([id, count]) => {
      if (count > maxVotes && id !== 'skip') {
        maxVotes = count;
        topSuspect = id;
      }
    });

    const rogueCaught = topSuspect === roguePlayerId;
    const rogueName = players.find((p) => p.id === roguePlayerId)?.displayName || 'Rogue';

    if (rogueCaught) {
      setWinnerMessage(`🛡️ ENGINEERS WIN! The team identified the Rogue Deployer: ${rogueName}!`);
    } else {
      setWinnerMessage(`😈 ROGUE DEPLOYER WINS! ${rogueName} successfully blended in and avoided blame!`);
    }

    setPhase('resolution');
  };

  const handleRogueGuess = (guess: string) => {
    if (!isRogue) return;
    // Fuzzy check guess against keywords
    const incident = INCIDENT_SCENARIOS.find((i) => i.id === currentIncident?.id) || INCIDENT_SCENARIOS[0];
    const isMatch = incident.keywords.some((k) => guess.toLowerCase().includes(k.toLowerCase()));

    broadcast('rogue:guess', { guess, success: isMatch });
    if (isMatch) {
      setWinnerMessage(`🎉 The Rogue Deployer correctly deduced the outage root cause: "${guess}"! ROGUE WINS!`);
      setPhase('resolution');
    } else {
      alert(`Your guess "${guess}" was incorrect! Keep investigating or blend in.`);
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
        gameTitle="Who Broke Production?"
        gameIcon="🕵️"
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
    );
  }

  return (
    <div className="whobroke-root">
      {/* Top Incident Card */}
      <IncidentCard
        isRogue={isRogue}
        incident={currentIncident}
        onGuessIncident={isRogue ? handleRogueGuess : undefined}
      />

      {/* Discussion or Voting View */}
      {phase === 'discussion' && (
        <DiscussionChat
          messages={messages}
          timeLeft={timeLeft}
          onSendMessage={handleSendMessage}
          onAdvanceToVote={handleAdvanceToVote}
          isHost={isHost}
        />
      )}

      {phase === 'voting' && (
        <VotingPanel
          players={players}
          currentPlayerId={currentPlayerId}
          onCastVote={handleCastVote}
          hasVoted={hasVoted}
          selectedSuspectId={selectedSuspectId}
        />
      )}

      {/* Resolution Screen */}
      {phase === 'resolution' && (
        <div className="resolution-card">
          <span className="res-icon">🚨</span>
          <h2 className="res-title">{winnerMessage}</h2>
          <button
            type="button"
            onClick={() => setPhase('lobby')}
            className="res-btn"
          >
            Back to Room Lobby
          </button>
        </div>
      )}

      <style>{`
        .whobroke-root {
          max-width: 840px;
          width: 100%;
          min-height: 100%;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 16px;
          padding: 16px;
          box-sizing: border-box;
        }

        .resolution-card {
          background: #0f172a;
          border: 1px solid #1e293b;
          border-radius: var(--radius-lg);
          padding: 32px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          animation: popIn 0.25s ease-out;
        }

        @keyframes popIn {
          from { opacity: 0; transform: scale(0.92); }
          to { opacity: 1; transform: scale(1); }
        }

        .res-icon {
          font-size: 44px;
        }

        .res-title {
          font-size: 22px;
          font-weight: 800;
          color: #f8fafc;
          margin: 0;
          line-height: 1.4;
        }

        .res-btn {
          padding: 12px 24px;
          background: var(--accent-default);
          color: #ffffff;
          border: none;
          border-radius: var(--radius-md);
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
};
