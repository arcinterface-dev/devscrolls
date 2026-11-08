import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSupabaseRoom } from '../shared/useSupabaseRoom';
import { RoomLobby } from '../shared/RoomLobby';
import { DrawingCanvas, type StrokeData, type DrawingTool } from './DrawingCanvas';
import { ToolBar } from './ToolBar';
import { ChatPanel, type ChatMessage } from './ChatPanel';
import { HintDisplay } from './HintDisplay';
import { WordPicker } from './WordPicker';
import { ScoreBoard, type SkribblPlayer } from './ScoreBoard';
import { GameOverScreen } from '../shared/GameOverScreen';
import { TECH_WORDS } from './word-decks/tech';
import { CASUAL_WORDS } from './word-decks/casual';
import { DEV_MEMES_WORDS } from './word-decks/dev-memes';
import { DEV_AVATARS, type DevAvatar } from './avatars';
import { sound } from './audio';
import { storage } from '../shared/storage';

type GamePhase = 'lobby' | 'choosing' | 'drawing' | 'round_end' | 'game_over';

interface FloatingReaction {
  id: string;
  emoji: string;
  xPercent: number;
}

// Matrix-free Levenshtein distance matcher for close guess detection
function getLevenshteinDistance(a: string, b: string): number {
  const s1 = a.toLowerCase().trim();
  const s2 = b.toLowerCase().trim();
  if (s1 === s2) return 0;
  if (!s1.length) return s2.length;
  if (!s2.length) return s1.length;

  let prevRow = new Int32Array(s2.length + 1);
  let currRow = new Int32Array(s2.length + 1);

  for (let j = 0; j <= s2.length; j++) prevRow[j] = j;

  for (let i = 1; i <= s1.length; i++) {
    currRow[0] = i;
    for (let j = 1; j <= s2.length; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      currRow[j] = Math.min(
        currRow[j - 1] + 1,
        prevRow[j] + 1,
        prevRow[j - 1] + cost
      );
    }
    const temp = prevRow;
    prevRow = currRow;
    currRow = temp;
  }
  return prevRow[s2.length];
}

export const DevSkribbl: React.FC = () => {
  const [roomId, setRoomId] = useState<string>('');
  const [inviteCode, setInviteCode] = useState<string>('');
  const [displayName, setDisplayName] = useState<string>('');
  const [selectedAvatar, setSelectedAvatar] = useState<string>('🕶️');
  const [deck, setDeck] = useState<'tech' | 'memes' | 'casual' | 'custom'>('tech');
  const [customWordInput, setCustomWordInput] = useState<string>('');
  const [customWordsList, setCustomWordsList] = useState<string[]>([]);
  const [customOnly, setCustomOnly] = useState<boolean>(false);
  const [totalRounds, setTotalRounds] = useState<number>(3);
  const [turnDuration, setTurnDuration] = useState<number>(60);
  const [isMuted, setIsMuted] = useState<boolean>(sound.getMuted());

  // Read URL query params on mount
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
    players: roomPlayers,
    currentPlayerId,
    isHost,
    broadcast,
    onBroadcast,
  } = useSupabaseRoom({
    roomId,
    displayName: `${selectedAvatar} ${displayName}`.trim(),
    isHostIntent: !roomId,
  });

  // Game State
  const [phase, setPhase] = useState<GamePhase>('lobby');
  const [currentRound, setCurrentRound] = useState(1);
  const [artistId, setArtistId] = useState<string>('');
  const [secretWord, setSecretWord] = useState<string>('');
  const [wordChoices, setWordChoices] = useState<string[]>([]);
  const [hintMask, setHintMask] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState<number>(turnDuration);
  const [strokes, setStrokes] = useState<StrokeData[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [playerScores, setPlayerScores] = useState<Record<string, number>>({});
  const [guessedPlayers, setGuessedPlayers] = useState<Set<string>>(new Set());
  const [floatingReactions, setFloatingReactions] = useState<FloatingReaction[]>([]);

  // Drawing Tools State
  const [currentColor, setCurrentColor] = useState<string>('#000000');
  const [currentBrushSize, setCurrentBrushSize] = useState<number>(6);
  const [currentTool, setCurrentTool] = useState<DrawingTool>('pencil');
  const [canvasBgColor, setCanvasBgColor] = useState<string>('#ffffff');

  const timerRef = useRef<any>(null);

  const isCurrentArtist = currentPlayerId === artistId;
  const hasGuessed = guessedPlayers.has(currentPlayerId);

  // Word pool generator: supports standard decks, custom word additions, or custom words exclusively
  const getWordPool = useCallback((activeCustom?: string[]) => {
    let base: string[] = TECH_WORDS;
    if (deck === 'memes') base = DEV_MEMES_WORDS;
    else if (deck === 'casual') base = CASUAL_WORDS;
    else if (deck === 'custom') base = [];

    const custom = (activeCustom && activeCustom.length > 0)
      ? activeCustom
      : (customWordsList.length > 0
          ? customWordsList
          : customWordInput
              .split(/[\n,]/)
              .map((w) => w.trim())
              .filter((w) => w.length >= 2));

    // If host toggled "Custom Words Exclusively" and has at least 3 custom words
    if ((customOnly || deck === 'custom') && custom.length >= 3) {
      return custom;
    }

    // If host added custom words and wants to mix them with standard deck
    if (custom.length > 0) {
      return [...base, ...custom];
    }

    return base.length > 0 ? base : [...TECH_WORDS, ...DEV_MEMES_WORDS];
  }, [deck, customWordInput, customWordsList, customOnly]);

  // Generate 3 choices
  const pick3Words = useCallback((activeCustom?: string[]) => {
    const pool = getWordPool(activeCustom);
    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 3);
  }, [getWordPool]);

  // Multi-word hint mask generator with 3 spaces between words and 1 space between letters
  const generateHintMask = useCallback((word: string, revealedIndices: number[] = []): string => {
    const revealedSet = new Set(revealedIndices);
    const words = word.trim().split(/\s+/);
    let charCounter = 0;

    return words
      .map((w) => {
        const letters = w.split('').map((char) => {
          const idx = charCounter++;
          if (!/[a-zA-Z0-9]/.test(char)) return char;
          if (revealedSet.has(idx)) return char;
          return '_';
        });
        return letters.join(' ');
      })
      .join('   ');
  }, []);

  // Create or Join Room
  const handleCreateRoom = (name: string) => {
    const newRoomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    storage.setDisplayName(name);
    setDisplayName(name);
    setRoomId(newRoomCode);

    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('room', newRoomCode);
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

  // Host starts game
  const handleStartGame = () => {
    if (!isHost) return;
    const initialArtist = roomPlayers[0]?.id || currentPlayerId;

    const parsedCustom = customWordInput
      .split(/[\n,]/)
      .map((w) => w.trim())
      .filter((w) => w.length >= 2);

    setCustomWordsList(parsedCustom);

    broadcast('game:start', {
      artistId: initialArtist,
      round: 1,
      totalRounds,
      turnDuration,
      deck,
      customWords: parsedCustom,
      customOnly,
    });

    setupNewRound(initialArtist, 1, parsedCustom);
  };

  // Setup round logic
  const setupNewRound = (selectedArtistId: string, roundNum: number, activeCustom?: string[]) => {
    setArtistId(selectedArtistId);
    setCurrentRound(roundNum);
    setStrokes([]);
    setCanvasBgColor('#ffffff');
    setGuessedPlayers(new Set());
    setTimeLeft(turnDuration);

    if (selectedArtistId === currentPlayerId) {
      const choices = pick3Words(activeCustom);
      setWordChoices(choices);
      setPhase('choosing');
    } else {
      setPhase('choosing');
    }
  };

  // Artist selects word
  const handleSelectWord = (chosen: string) => {
    setSecretWord(chosen);
    const masked = generateHintMask(chosen, []);
    setHintMask(masked);
    setPhase('drawing');

    broadcast('word:chosen', {
      wordLength: chosen.length,
      hintMask: masked,
      turnDuration,
    });

    startRoundTimer(chosen);
  };

  // Round countdown timer with metronome tick in final 10 seconds
  const startRoundTimer = (currentWord: string) => {
    if (timerRef.current) clearInterval(timerRef.current);
    let seconds = turnDuration;
    setTimeLeft(seconds);

    timerRef.current = setInterval(() => {
      seconds -= 1;
      setTimeLeft(seconds);

      // Urgent metronome tick in final 10 seconds
      if (seconds <= 10 && seconds > 0) {
        sound.playTick();
      }

      const alphaOnlyLen = currentWord.replace(/\s+/g, '').length;
      const midPoint = Math.floor(turnDuration * 0.55);
      const latePoint = Math.floor(turnDuration * 0.25);

      if (seconds === midPoint && alphaOnlyLen > 3) {
        revealLetterHint(currentWord, 1);
      } else if (seconds === latePoint && alphaOnlyLen > 5) {
        revealLetterHint(currentWord, 2);
      }

      if (seconds <= 0) {
        clearInterval(timerRef.current);
        endRound(currentWord);
      }
    }, 1000);
  };

  const revealLetterHint = (word: string, count: number) => {
    const words = word.trim().split(/\s+/);
    const indicesToReveal: number[] = [0];

    if (count >= 2) {
      if (words.length > 1) {
        indicesToReveal.push(words[0].length); // First letter of 2nd word
      } else {
        indicesToReveal.push(Math.floor(word.length / 2));
      }
    }

    const revealed = generateHintMask(word, indicesToReveal);
    setHintMask(revealed);
    broadcast('hint:reveal', { hintMask: revealed });
  };

  const endRound = (word: string) => {
    if (timerRef.current) clearInterval(timerRef.current);

    // Dynamic Drawer Reward Formula: 75 pts per successful guesser
    const artistBonus = 75 * guessedPlayers.size;
    if (artistBonus > 0 && artistId) {
      setPlayerScores((prev) => ({
        ...prev,
        [artistId]: (prev[artistId] || 0) + artistBonus,
      }));
    }

    setPhase('round_end');
    broadcast('round:end', { word, artistId, artistBonus });

    setTimeout(() => {
      // Find next artist
      const artistIndex = roomPlayers.findIndex((p) => p.id === artistId);
      const nextIndex = (artistIndex + 1) % Math.max(1, roomPlayers.length);
      const nextArtist = roomPlayers[nextIndex]?.id || currentPlayerId;

      if (currentRound >= totalRounds && nextIndex === 0) {
        sound.playFanfare();
        setPhase('game_over');
        broadcast('game:end', {});
      } else {
        const nextRoundNum = nextIndex === 0 ? currentRound + 1 : currentRound;
        setupNewRound(nextArtist, nextRoundNum);
      }
    }, 4500);
  };

  // Listen to incoming Supabase Broadcast events
  useEffect(() => {
    const unsubGameStart = onBroadcast('game:start', (payload) => {
      if (payload.turnDuration) setTurnDuration(payload.turnDuration);
      if (payload.totalRounds) setTotalRounds(payload.totalRounds);
      if (payload.deck) setDeck(payload.deck);
      if (payload.customWords) setCustomWordsList(payload.customWords);
      if (typeof payload.customOnly === 'boolean') setCustomOnly(payload.customOnly);
      setupNewRound(payload.artistId, payload.round, payload.customWords);
    });

    const unsubArtistLeft = onBroadcast('round:artist_left', (payload) => {
      if (payload.nextArtist) {
        setupNewRound(payload.nextArtist, currentRound);
      }
    });

    const unsubWordChosen = onBroadcast('word:chosen', (payload) => {
      setHintMask(payload.hintMask);
      setPhase('drawing');
      setTimeLeft(payload.turnDuration || turnDuration);
    });

    const unsubStroke = onBroadcast('draw:stroke', (payload: StrokeData) => {
      setStrokes((prev) => [...prev, payload]);
    });

    const unsubClear = onBroadcast('draw:clear', () => {
      setStrokes([]);
    });

    const unsubUndo = onBroadcast('draw:undo', () => {
      setStrokes((prev) => prev.slice(0, -1));
    });

    const unsubBg = onBroadcast('draw:bg', (payload: { color: string }) => {
      setCanvasBgColor(payload.color);
    });

    const unsubReaction = onBroadcast('reaction:send', (payload: FloatingReaction) => {
      setFloatingReactions((prev) => [...prev.slice(-15), payload]);
      setTimeout(() => {
        setFloatingReactions((prev) => prev.filter((r) => r.id !== payload.id));
      }, 2300);
    });

    const unsubAllSolved = onBroadcast('round:all_solved', () => {
      sound.playFanfare();
      setMessages((prev) => [
        ...prev,
        {
          id: 'sys_' + Math.random(),
          senderName: 'System',
          senderId: 'sys',
          text: '🎉 Everyone guessed the word! Round finished!',
          isSystem: true,
        },
      ]);
    });

    const unsubChat = onBroadcast('chat:message', (payload: ChatMessage) => {
      // Solved-only chat filtering: only solvers & artist see it
      if (payload.isSolvedChat && !hasGuessed && !isCurrentArtist) {
        return;
      }
      setMessages((prev) => [...prev, payload]);
    });

    const unsubCorrect = onBroadcast('guess:correct', (payload) => {
      sound.playCorrectChime();
      setGuessedPlayers((prev) => new Set(prev).add(payload.playerId));
      setPlayerScores((prev) => ({
        ...prev,
        [payload.playerId]: (prev[payload.playerId] || 0) + payload.points,
      }));
      setMessages((prev) => [
        ...prev,
        {
          id: 'sys_' + Math.random(),
          senderName: payload.displayName,
          senderId: payload.playerId,
          text: '',
          isCorrect: true,
        },
      ]);
    });

    const unsubHint = onBroadcast('hint:reveal', (payload) => {
      setHintMask(payload.hintMask);
    });

    const unsubRoundEnd = onBroadcast('round:end', (payload) => {
      setSecretWord(payload.word);
      if (payload.artistBonus && payload.artistId) {
        setPlayerScores((prev) => ({
          ...prev,
          [payload.artistId]: (prev[payload.artistId] || 0) + payload.artistBonus,
        }));
      }
      setPhase('round_end');
    });

    const unsubGameEnd = onBroadcast('game:end', () => {
      sound.playFanfare();
      setPhase('game_over');
    });

    return () => {
      unsubGameStart();
      unsubArtistLeft();
      unsubWordChosen();
      unsubStroke();
      unsubClear();
      unsubUndo();
      unsubBg();
      unsubReaction();
      unsubAllSolved();
      unsubChat();
      unsubCorrect();
      unsubHint();
      unsubRoundEnd();
      unsubGameEnd();
    };
  }, [onBroadcast, isHost, secretWord, guessedPlayers, broadcast, roomPlayers, artistId, currentRound, totalRounds, turnDuration, hasGuessed, isCurrentArtist]);

  // Stroke completion from local artist canvas
  const handleStrokeCompleted = (stroke: StrokeData) => {
    setStrokes((prev) => [...prev, stroke]);
    broadcast('draw:stroke', stroke);
  };

  const handleClear = () => {
    sound.playPop();
    setStrokes([]);
    broadcast('draw:clear', {});
  };

  const handleUndo = () => {
    sound.playPop();
    setStrokes((prev) => prev.slice(0, -1));
    broadcast('draw:undo', {});
  };

  const handleBgColorChange = (color: string) => {
    sound.playPop();
    setCanvasBgColor(color);
    broadcast('draw:bg', { color });
  };

  const handleToggleMute = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  const handleSendReaction = (emoji: string) => {
    const newRx: FloatingReaction = {
      id: 'rx_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
      emoji,
      xPercent: Math.floor(65 + Math.random() * 26),
    };
    setFloatingReactions((prev) => [...prev.slice(-15), newRx]);
    broadcast('reaction:send', newRx);
    setTimeout(() => {
      setFloatingReactions((prev) => prev.filter((r) => r.id !== newRx.id));
    }, 2300);
  };

  const handleDownloadArtwork = () => {
    sound.playPop();
    const canvas = document.querySelector('.skribbl-canvas') as HTMLCanvasElement;
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `dev-skribbl-${secretWord.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'drawing'}.png`;
    a.click();
  };

  // High-fidelity guess processing: Exact match interception + Levenshtein close check
  const handleSendMessage = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    // 1. Solved player chat
    if (hasGuessed) {
      const solvedMsg: ChatMessage = {
        id: 'msg_' + Math.random(),
        senderName: displayName || 'Anonymous',
        senderId: currentPlayerId,
        text: trimmed,
        isSolvedChat: true,
      };
      setMessages((prev) => [...prev, solvedMsg]);
      broadcast('chat:message', solvedMsg);
      return;
    }

    // 2. Active guess validation
    if (phase === 'drawing' && secretWord && !isCurrentArtist) {
      const cleanGuess = trimmed.toLowerCase();
      const cleanSecret = secretWord.trim().toLowerCase();

      // EXACT GUESS MATCH: STEALTH INTERCEPT
      if (cleanGuess === cleanSecret) {
        sound.playCorrectChime();

        // Mathematical dynamic time-decay formula: Base 500 * (t_remaining / t_total) + First Guesser Bonus 100
        const timeFraction = Math.max(0.12, timeLeft / turnDuration);
        const isFirst = guessedPlayers.size === 0;
        const pointsEarned = Math.round(500 * timeFraction + (isFirst ? 100 : 0));

        setGuessedPlayers((prev) => new Set(prev).add(currentPlayerId));
        setPlayerScores((prev) => ({
          ...prev,
          [currentPlayerId]: (prev[currentPlayerId] || 0) + pointsEarned,
        }));

        setMessages((prev) => [
          ...prev,
          {
            id: 'correct_' + Date.now(),
            senderName: displayName || 'You',
            senderId: currentPlayerId,
            text: '',
            isCorrect: true,
          },
        ]);

        broadcast('guess:correct', {
          playerId: currentPlayerId,
          displayName: displayName || 'Anonymous',
          points: pointsEarned,
        });

        // Check if all eligible guessers have now solved
        const eligibleCount = Math.max(1, roomPlayers.length - 1);
        if (guessedPlayers.size + 1 >= eligibleCount) {
          sound.playFanfare();
          broadcast('round:all_solved', {});
          setTimeout(() => {
            endRound(secretWord);
          }, 2000);
        }
        return;
      }

      // CLOSE GUESS CHECK (Levenshtein Distance 1 or 2)
      const dist = getLevenshteinDistance(cleanGuess, cleanSecret);
      if (
        cleanSecret.length >= 3 &&
        dist > 0 &&
        dist <= 2 &&
        Math.abs(cleanGuess.length - cleanSecret.length) <= 2
      ) {
        sound.playCloseWarning();
        // Private feedback strictly to sender - never broadcast to opponents!
        setMessages((prev) => [
          ...prev,
          {
            id: 'close_' + Date.now(),
            senderName: 'System',
            senderId: 'sys',
            text: trimmed,
            isClose: true,
          },
        ]);
        return;
      }
    }

    // Normal chat message
    const newMsg: ChatMessage = {
      id: 'msg_' + Math.random(),
      senderName: displayName || 'Anonymous',
      senderId: currentPlayerId,
      text: trimmed,
    };

    setMessages((prev) => [...prev, newMsg]);
    broadcast('chat:message', newMsg);
  };

  // Convert players for scoreboard
  const skribblPlayers: SkribblPlayer[] = roomPlayers.map((p) => ({
    id: p.id,
    name: p.displayName,
    score: playerScores[p.id] || 0,
    hasGuessedThisRound: guessedPlayers.has(p.id),
    isArtist: p.id === artistId,
  }));

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
        gameTitle="Dev Skribbl"
        gameIcon="🎨"
        minPlayers={1}
        maxPlayers={12}
        currentRoomId={roomId}
        inviteRoomCode={inviteCode}
        players={roomPlayers}
        currentPlayerId={currentPlayerId}
        isHost={isHost}
        status={status}
        customSettings={
          <div className="skribbl-lobby-config">
            {/* Avatar Persona Selector */}
            <div className="config-block">
              <label className="config-label">YOUR DEV PERSONA</label>
              <div className="avatar-pick-grid">
                {DEV_AVATARS.map((av) => (
                  <button
                    key={av.id}
                    type="button"
                    onClick={() => {
                      sound.playPop();
                      setSelectedAvatar(av.emoji);
                    }}
                    className={`avatar-pick-btn ${selectedAvatar === av.emoji ? 'avatar-active' : ''}`}
                    title={`${av.name} — ${av.role}`}
                  >
                    <span className="av-emoji">{av.emoji}</span>
                    <span className="av-name">{av.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Host Match Settings or Guest Rules Preview */}
            {isHost ? (
              <div className="config-block host-config-block">
                <label className="config-label">👑 HOST MATCH RULES</label>
                <div className="rules-grid">
                  <div className="rule-item">
                    <span className="rule-title">Turn Timer</span>
                    <div className="pill-options">
                      {[45, 60, 80].map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => {
                            sound.playPop();
                            setTurnDuration(t);
                          }}
                          className={`pill-btn ${turnDuration === t ? 'active' : ''}`}
                        >
                          {t}s
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="rule-item">
                    <span className="rule-title">Rounds</span>
                    <div className="pill-options">
                      {[2, 3, 5].map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => {
                            sound.playPop();
                            setTotalRounds(r);
                          }}
                          className={`pill-btn ${totalRounds === r ? 'active' : ''}`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="rule-item">
                    <span className="rule-title">Word Deck</span>
                    <div className="pill-options deck-pill-options">
                      {[
                        { id: 'tech', label: '💻 Tech Jargon' },
                        { id: 'memes', label: '☕ Dev Memes' },
                        { id: 'casual', label: '🎨 Casual' },
                        { id: 'custom', label: '📝 Custom' },
                      ].map((dk) => (
                        <button
                          key={dk.id}
                          type="button"
                          onClick={() => {
                            sound.playPop();
                            setDeck(dk.id as any);
                          }}
                          className={`pill-btn ${deck === dk.id ? 'active' : ''}`}
                        >
                          {dk.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="custom-words-input-box">
                  <div className="custom-words-header">
                    <span className="rule-title">Custom Words</span>
                    {customWordInput.split(/[\n,]/).map((w) => w.trim()).filter((w) => w.length >= 2).length > 0 && (
                      <span className="custom-count-badge">
                        {customWordInput.split(/[\n,]/).map((w) => w.trim()).filter((w) => w.length >= 2).length} words ready
                      </span>
                    )}
                  </div>
                  <textarea
                    value={customWordInput}
                    onChange={(e) => setCustomWordInput(e.target.value)}
                    placeholder="Paste team/company words separated by comma or newline (e.g. Apollo, GraphQL, Kafka, John's PR, Friday Deploy)"
                    className="custom-words-textarea"
                    rows={2}
                  />
                  {customWordInput.split(/[\n,]/).map((w) => w.trim()).filter((w) => w.length >= 2).length > 0 && (
                    <label className="custom-only-toggle">
                      <input
                        type="checkbox"
                        checked={customOnly}
                        onChange={(e) => setCustomOnly(e.target.checked)}
                      />
                      <span>Use custom words exclusively</span>
                    </label>
                  )}
                </div>
              </div>
            ) : (
              <div className="config-block guest-rules-block">
                <label className="config-label">MATCH RULES (HOST MANAGED)</label>
                <div className="guest-rules-chips">
                  <div className="guest-rule-chip">
                    <span className="chip-label">Turn Timer</span>
                    <span className="chip-val">⏱️ {turnDuration}s</span>
                  </div>
                  <div className="guest-rule-chip">
                    <span className="chip-label">Total Rounds</span>
                    <span className="chip-val">🔄 {totalRounds}</span>
                  </div>
                  <div className="guest-rule-chip">
                    <span className="chip-label">Word Deck</span>
                    <span className="chip-val">
                      {deck === 'tech' ? '💻 Tech Jargon' : deck === 'memes' ? '☕ Dev Memes' : deck === 'casual' ? '🎨 Casual' : '📝 Custom Words'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        }
        onJoinRoom={handleJoinRoom}
        onCreateRoom={handleCreateRoom}
        onStartGame={handleStartGame}
        onLeaveRoom={handleLeaveRoom}
      />
    );
  }

  // VIEW 2: In-Game
  return (
    <div className="skribbl-root-container">
      {/* Word Picker Modal for Artist */}
      {phase === 'choosing' && isCurrentArtist && (
        <WordPicker words={wordChoices} onSelectWord={handleSelectWord} />
      )}

      {/* Waiting banner when artist is picking */}
      {phase === 'choosing' && !isCurrentArtist && (
        <div className="choosing-banner">
          <span>🎨 Artist is choosing a word...</span>
        </div>
      )}

      {/* Top Hint and Timer Bar */}
      <HintDisplay
        isArtist={isCurrentArtist}
        word={secretWord}
        hintMask={hintMask}
        timeLeft={timeLeft}
        currentRound={currentRound}
        totalRounds={totalRounds}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
      />

      {/* Main Game Layout Grid */}
      <div className="skribbl-play-area">
        {/* Left: Scoreboard */}
        <div className="play-left-col">
          <ScoreBoard players={skribblPlayers} currentPlayerId={currentPlayerId} />
        </div>

        {/* Center: Canvas, Toolbar, and Floating Reactions */}
        <div className="play-center-col" style={{ position: 'relative' }}>
          {/* Floating Live Reactions Layer */}
          <div className="floating-reactions-layer">
            {floatingReactions.map((rx) => (
              <span
                key={rx.id}
                className="canvas-floating-emoji"
                style={{ left: `${rx.xPercent}%` }}
              >
                {rx.emoji}
              </span>
            ))}
          </div>

          <DrawingCanvas
            isArtist={isCurrentArtist && phase === 'drawing'}
            currentColor={currentColor}
            currentBrushSize={currentBrushSize}
            currentTool={currentTool}
            canvasBgColor={canvasBgColor}
            strokes={strokes}
            onStrokeCompleted={handleStrokeCompleted}
          />

          {isCurrentArtist && phase === 'drawing' && (
            <ToolBar
              color={currentColor}
              brushSize={currentBrushSize}
              tool={currentTool}
              canvasBgColor={canvasBgColor}
              onColorChange={setCurrentColor}
              onBrushSizeChange={setCurrentBrushSize}
              onToolChange={setCurrentTool}
              onBgColorChange={handleBgColorChange}
              onUndo={handleUndo}
              onClear={handleClear}
            />
          )}
        </div>

        {/* Right: Realtime Chat and Guesses */}
        <div className="play-right-col">
          <ChatPanel
            messages={messages}
            isArtist={isCurrentArtist}
            hasGuessedCorrectly={hasGuessed}
            onSendMessage={handleSendMessage}
            onSendReaction={handleSendReaction}
          />
        </div>
      </div>

      {/* Round End Overlay */}
      {phase === 'round_end' && (
        <div className="round-end-overlay">
          <div className="round-end-card">
            <span className="card-trophy">🔔</span>
            <h3>Round Finished!</h3>
            <p>The secret word was:</p>
            <strong className="revealed-word">{secretWord}</strong>

            {/* Artwork Download Button */}
            <button
              type="button"
              onClick={handleDownloadArtwork}
              className="download-artwork-btn"
            >
              🎨 Download Artwork (.png)
            </button>

            <small>Next round starting in a moment...</small>
          </div>
        </div>
      )}

      {/* Game Over Screen */}
      {phase === 'game_over' && (
        <GameOverScreen
          gameId="dev-skribbl"
          gameTitle="Dev Skribbl Match"
          playerResults={skribblPlayers.map((p) => ({
            displayName: p.name,
            score: p.score,
            isMe: p.id === currentPlayerId,
          }))}
          onPlayAgain={() => {
            setPhase('lobby');
          }}
        />
      )}

      <style>{`
        .skribbl-root-container {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding: 12px;
          box-sizing: border-box;
          max-width: 1280px;
          margin: 0 auto;
          position: relative;
        }

        .choosing-banner {
          background: #8b5cf6;
          color: #ffffff;
          font-weight: 800;
          font-size: 13px;
          text-align: center;
          padding: 6px;
          border-radius: var(--radius-sm);
          animation: pulse 1s infinite;
        }

        .skribbl-play-area {
          flex: 1;
          display: grid;
          grid-template-columns: 200px 1fr 280px;
          gap: 12px;
          min-height: 0;
          overflow: hidden;
        }

        .play-left-col {
          display: flex;
          flex-direction: column;
          min-height: 0;
          overflow: hidden;
        }

        .play-center-col {
          display: flex;
          flex-direction: column;
          gap: 8px;
          min-width: 0;
          min-height: 0;
          flex: 1;
          overflow: hidden;
        }

        .play-right-col {
          display: flex;
          flex-direction: column;
          min-height: 0;
          overflow: hidden;
        }

        .round-end-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.65);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 60;
          padding: 16px;
        }

        .round-end-card {
          background: var(--surface-raised);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-xl);
          padding: 28px 36px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          box-shadow: 0 20px 48px rgba(0, 0, 0, 0.35);
          max-width: 440px;
          width: 100%;
        }

        .card-trophy {
          font-size: 40px;
          line-height: 1;
        }

        .round-end-card h3 {
          font-size: 22px;
          font-weight: 850;
          color: var(--text-primary);
          margin: 0;
        }

        .round-end-card p {
          font-size: 13px;
          color: var(--text-muted);
          margin: 0;
        }

        .revealed-word {
          font-size: 28px;
          font-weight: 900;
          color: var(--accent-default);
          font-family: var(--font-mono, monospace);
          letter-spacing: 0.05em;
        }

        .download-artwork-btn {
          margin: 6px 0 8px 0;
          background: var(--surface-sunken);
          border: 1px solid var(--accent-default);
          color: var(--text-primary);
          font-size: 13px;
          font-weight: 750;
          padding: 9px 18px;
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: background 0.15s, transform 0.1s;
        }
        .download-artwork-btn:hover {
          background: var(--accent-default);
          color: #ffffff;
          transform: translateY(-1px);
        }

        .round-end-card small {
          color: var(--text-muted);
          font-size: 11.5px;
        }

        .floating-reactions-layer {
          position: absolute;
          inset: 0;
          pointer-events: none;
          overflow: hidden;
          z-index: 30;
        }

        @keyframes floatUpFade {
          0% {
            transform: translateY(0) scale(0.6);
            opacity: 1;
          }
          50% {
            transform: translateY(-160px) scale(1.3);
            opacity: 0.9;
          }
          100% {
            transform: translateY(-340px) scale(1.6);
            opacity: 0;
          }
        }

        .canvas-floating-emoji {
          position: absolute;
          bottom: 24px;
          pointer-events: none;
          font-size: 32px;
          animation: floatUpFade 2.2s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
          z-index: 35;
        }

        /* Lobby config styles */
        .skribbl-lobby-config {
          display: flex;
          flex-direction: column;
          gap: 12px;
          text-align: left;
        }

        .config-block {
          background: var(--surface-sunken);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-md);
          padding: 12px 14px;
        }

        .config-label {
          display: block;
          font-size: 11px;
          font-weight: 800;
          color: var(--text-muted);
          letter-spacing: 0.05em;
          margin-bottom: 8px;
          text-transform: uppercase;
        }

        .avatar-pick-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 6px;
        }

        .avatar-pick-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--surface-raised);
          border: 1px solid var(--border-subtle);
          color: var(--text-primary);
          padding: 7px 10px;
          border-radius: var(--radius-sm);
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
          transition: all 0.15s ease;
          box-sizing: border-box;
          text-align: left;
        }
        .avatar-pick-btn:hover {
          background: var(--surface-base);
          border-color: var(--accent-default);
          transform: translateY(-1px);
        }
        .avatar-pick-btn.avatar-active {
          border-color: var(--accent-default);
          background: color-mix(in srgb, var(--accent-default) 14%, var(--surface-raised));
          box-shadow: 0 0 0 1.5px var(--accent-default);
          font-weight: 700;
        }

        .av-emoji {
          font-size: 15px;
          line-height: 1;
        }

        .av-name {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .rules-grid {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .rule-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 12.5px;
          gap: 8px;
          flex-wrap: wrap;
        }

        .rule-title {
          color: var(--text-primary);
          font-weight: 650;
        }

        .pill-options {
          display: inline-flex;
          background: var(--surface-raised);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-sm);
          padding: 2px;
          gap: 2px;
        }

        .pill-btn {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          font-size: 11.5px;
          font-weight: 700;
          padding: 5px 10px;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .pill-btn:hover {
          color: var(--text-primary);
        }
        .pill-btn.active {
          background: var(--accent-default);
          color: #ffffff;
          box-shadow: 0 1px 4px rgba(217, 119, 6, 0.3);
        }

        .deck-pill-options {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          width: 100%;
          margin-top: 4px;
        }
        .deck-pill-options .pill-btn {
          padding: 6px 8px;
          text-align: center;
        }

        .custom-words-input-box {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-top: 10px;
          padding-top: 10px;
          border-top: 1px solid var(--border-subtle);
        }

        .custom-words-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .custom-count-badge {
          font-size: 10.5px;
          font-weight: 750;
          color: #10b981;
          background: rgba(16, 185, 129, 0.12);
          border: 1px solid rgba(16, 185, 129, 0.3);
          padding: 2px 7px;
          border-radius: var(--radius-full);
        }

        .custom-words-textarea {
          width: 100%;
          background: var(--surface-raised);
          border: 1px solid var(--border-default);
          color: var(--text-primary);
          padding: 8px 10px;
          border-radius: var(--radius-sm);
          font-size: 12px;
          box-sizing: border-box;
          font-family: inherit;
          resize: vertical;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .custom-words-textarea:focus {
          border-color: var(--accent-default);
          box-shadow: 0 0 0 2px rgba(217, 119, 6, 0.16);
        }

        .custom-only-toggle {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11.5px;
          color: var(--text-muted);
          cursor: pointer;
        }
        .custom-only-toggle input {
          accent-color: var(--accent-default);
          cursor: pointer;
        }

        .guest-rules-chips {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .guest-rule-chip {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: var(--surface-raised);
          border: 1px solid var(--border-subtle);
          padding: 6px 10px;
          border-radius: var(--radius-sm);
          font-size: 12px;
        }
        .guest-rule-chip .chip-label {
          color: var(--text-muted);
          font-weight: 600;
        }
        .guest-rule-chip .chip-val {
          color: var(--text-primary);
          font-weight: 750;
        }

        @media (max-width: 900px) {
          .skribbl-play-area {
            grid-template-columns: 1fr;
            grid-template-rows: auto 340px auto;
          }
          .avatar-pick-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </div>
  );
};
