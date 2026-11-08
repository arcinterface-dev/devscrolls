import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSupabaseRoom } from '../shared/useSupabaseRoom';
import { RoomLobby } from '../shared/RoomLobby';
import { DrawingCanvas, type StrokeData, type DrawingTool } from './DrawingCanvas';
import { ToolBar } from './ToolBar';
import { ChatPanel, type ChatMessage } from './ChatPanel';
import { HintDisplay } from './HintDisplay';
import { WordPicker } from './WordPicker';
import { ScoreBoard, type SkribblPlayer } from './ScoreBoard';
import { GameOverScreen } from '../shared/GameOverScreen';
import { DRAWABLE_WORDS } from './word-decks/drawable-words';
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
  const [customWordInput, setCustomWordInput] = useState<string>('');
  const [customWordsList, setCustomWordsList] = useState<string[]>([]);
  const [customOnly, setCustomOnly] = useState<boolean>(true);
  const [totalRounds, setTotalRounds] = useState<number>(3);
  const [turnDuration, setTurnDuration] = useState<number>(60);

  // Parsed custom words list from input textarea
  const parsedCustomWords = useMemo(() => {
    return customWordInput
      .split(/[\n,]/)
      .map((w) => w.trim())
      .filter((w) => w.length >= 2);
  }, [customWordInput]);

  // Track words used in current match session so players never get repeats
  const usedWordsRef = useRef<Set<string>>(new Set());
  // Track randomly revealed character indices during the current turn
  const revealedIndicesRef = useRef<number[]>([]);

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
    displayName: displayName.trim(),
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
  const [roundEndCountdown, setRoundEndCountdown] = useState<number>(5);

  // Drawing Tools State
  const [currentColor, setCurrentColor] = useState<string>('#000000');
  const [currentBrushSize, setCurrentBrushSize] = useState<number>(6);
  const [currentTool, setCurrentTool] = useState<DrawingTool>('pencil');
  const [canvasBgColor, setCanvasBgColor] = useState<string>('#ffffff');

  const timerRef = useRef<any>(null);

  // Fresh state refs to prevent stale closure traps across Realtime broadcasts and timers
  const roomPlayersRef = useRef(roomPlayers);
  useEffect(() => { roomPlayersRef.current = roomPlayers; }, [roomPlayers]);

  const isHostRef = useRef(isHost);
  useEffect(() => { isHostRef.current = isHost; }, [isHost]);

  const phaseRef = useRef(phase);
  useEffect(() => { phaseRef.current = phase; }, [phase]);

  const artistIdRef = useRef(artistId);
  useEffect(() => { artistIdRef.current = artistId; }, [artistId]);

  const secretWordRef = useRef(secretWord);
  useEffect(() => { secretWordRef.current = secretWord; }, [secretWord]);

  const currentRoundRef = useRef(currentRound);
  useEffect(() => { currentRoundRef.current = currentRound; }, [currentRound]);

  const totalRoundsRef = useRef(totalRounds);
  useEffect(() => { totalRoundsRef.current = totalRounds; }, [totalRounds]);

  const turnDurationRef = useRef(turnDuration);
  useEffect(() => { turnDurationRef.current = turnDuration; }, [turnDuration]);

  const timeLeftRef = useRef(timeLeft);
  useEffect(() => { timeLeftRef.current = timeLeft; }, [timeLeft]);

  const hintMaskRef = useRef(hintMask);
  useEffect(() => { hintMaskRef.current = hintMask; }, [hintMask]);

  const strokesRef = useRef(strokes);
  useEffect(() => { strokesRef.current = strokes; }, [strokes]);

  const canvasBgColorRef = useRef(canvasBgColor);
  useEffect(() => { canvasBgColorRef.current = canvasBgColor; }, [canvasBgColor]);

  const playerScoresRef = useRef(playerScores);
  useEffect(() => { playerScoresRef.current = playerScores; }, [playerScores]);

  const customWordsListRef = useRef(customWordsList);
  useEffect(() => { customWordsListRef.current = customWordsList; }, [customWordsList]);

  const customOnlyRef = useRef(customOnly);
  useEffect(() => { customOnlyRef.current = customOnly; }, [customOnly]);

  const isCurrentArtist = currentPlayerId === artistId;
  const hasGuessed = guessedPlayers.has(currentPlayerId);

  // Word pool generator: by default, if custom words are added, use those ONLY in the game (no standard words)
  const getWordPool = useCallback((activeCustom?: string[]) => {
    const custom = (activeCustom && activeCustom.length > 0)
      ? activeCustom
      : (customWordsList.length > 0
          ? customWordsList
          : customWordInput
              .split(/[\n,]/)
              .map((w) => w.trim())
              .filter((w) => w.length >= 2));

    // By default, if custom words are added, use those exclusively
    if (custom.length > 0) {
      if (customOnly) {
        return custom;
      }
      return [...custom, ...DRAWABLE_WORDS];
    }

    return DRAWABLE_WORDS;
  }, [customWordInput, customWordsList, customOnly]);

  // Generate 3 random fresh choices, prioritizing unused words to prevent repetition
  const pick3Words = useCallback((activeCustom?: string[]) => {
    const pool = getWordPool(activeCustom);
    const available = pool.filter((w) => !usedWordsRef.current.has(w.toLowerCase().trim()));
    const finalPool = available.length >= 3 ? available : pool;
    if (available.length < 3) {
      usedWordsRef.current.clear();
    }
    const shuffled = [...finalPool].sort(() => 0.5 - Math.random());
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
      customWords: parsedCustom,
      customOnly,
    });

    setupNewRound(initialArtist, 1, parsedCustom);
  };

  // Setup round logic
  const setupNewRound = useCallback(
    (selectedArtistId: string, roundNum: number, activeCustom?: string[]) => {
      revealedIndicesRef.current = [];
      setArtistId(selectedArtistId);
      setCurrentRound(roundNum);
      setStrokes([]);
      setCanvasBgColor('#ffffff');
      setGuessedPlayers(new Set());
      setTimeLeft(turnDurationRef.current);
      setSecretWord('');
      setHintMask('');

      if (selectedArtistId === currentPlayerId) {
        const choices = pick3Words(activeCustom || customWordsListRef.current);
        setWordChoices(choices);
        setPhase('choosing');
      } else {
        setPhase('choosing');
      }
    },
    [currentPlayerId, pick3Words]
  );

  // Artist selects word
  const handleSelectWord = (chosen: string) => {
    revealedIndicesRef.current = [];
    usedWordsRef.current.add(chosen.toLowerCase().trim());
    setSecretWord(chosen);
    const masked = generateHintMask(chosen, []);
    setHintMask(masked);
    setTimeLeft(turnDuration);
    setPhase('drawing');

    broadcast('word:chosen', {
      word: chosen,
      wordLength: chosen.length,
      hintMask: masked,
      turnDuration,
    });
  };

  const revealLetterHint = useCallback(
    (word: string) => {
      // Find all eligible letter indices across the words (ignoring whitespace and symbols)
      const eligibleIndices: number[] = [];
      const words = word.trim().split(/\s+/);
      let counter = 0;
      for (const w of words) {
        for (const ch of w) {
          if (/[a-zA-Z0-9]/.test(ch)) {
            eligibleIndices.push(counter);
          }
          counter++;
        }
      }

      // Pick a random index that has not been revealed yet
      const unrevealed = eligibleIndices.filter((idx) => !revealedIndicesRef.current.includes(idx));
      if (unrevealed.length > 0) {
        const randomIdx = unrevealed[Math.floor(Math.random() * unrevealed.length)];
        revealedIndicesRef.current.push(randomIdx);
      }

      const revealed = generateHintMask(word, revealedIndicesRef.current);
      setHintMask(revealed);
      broadcast('hint:reveal', { hintMask: revealed });
    },
    [generateHintMask, broadcast]
  );

  const endRound = useCallback(
    (word: string) => {
      if (phaseRef.current === 'round_end' || phaseRef.current === 'game_over') return;
      if (timerRef.current) clearInterval(timerRef.current);

      // Dynamic Drawer Reward Formula: 75 pts per successful guesser
      const artistBonus = 75 * guessedPlayers.size;
      const currentArtist = artistIdRef.current;
      if (artistBonus > 0 && currentArtist) {
        setPlayerScores((prev) => ({
          ...prev,
          [currentArtist]: (prev[currentArtist] || 0) + artistBonus,
        }));
      }

      setSecretWord(word);
      setPhase('round_end');
      broadcast('round:end', { word, artistId: currentArtist, artistBonus });
    },
    [guessedPlayers.size, broadcast]
  );

  // 1. Unified countdown timer: runs synchronously on all clients (artist and viewers)
  useEffect(() => {
    if (phase !== 'drawing') return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        const next = prev - 1;

        // Metronome / letter hints (revealed by the artist)
        if (isCurrentArtist && secretWordRef.current) {
          const currentWord = secretWordRef.current;
          const alphaOnlyLen = currentWord.replace(/\s+/g, '').length;
          const midPoint = Math.floor(turnDurationRef.current * 0.55);
          const latePoint = Math.floor(turnDurationRef.current * 0.25);

          if (next === midPoint && alphaOnlyLen > 3) {
            revealLetterHint(currentWord);
          } else if (next === latePoint && alphaOnlyLen > 5) {
            revealLetterHint(currentWord);
          }
        }

        if (next <= 0) {
          clearInterval(interval);
          endRound(secretWordRef.current);
          return 0;
        }

        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [phase, isCurrentArtist, revealLetterHint, endRound]);

  // 2. Host round progression orchestrator: transitions from 'round_end' to next round after 5s
  useEffect(() => {
    if (phase !== 'round_end') return;
    if (!isHost) return;

    const timer = setTimeout(() => {
      const players = roomPlayersRef.current.length > 0 ? roomPlayersRef.current : roomPlayers;
      if (players.length === 0) return;

      const artistIndex = players.findIndex((p) => p.id === artistIdRef.current);
      const nextIndex = (artistIndex + 1) % players.length;
      const nextArtist = players[nextIndex]?.id || players[0]?.id || currentPlayerId;

      // When nextIndex wraps back to 0, every player has taken a turn to draw
      const isFullRotation = nextIndex === 0;
      const nextRoundNum = isFullRotation ? currentRoundRef.current + 1 : currentRoundRef.current;

      if (nextRoundNum > totalRoundsRef.current) {
        setPhase('game_over');
        broadcast('game:end', {});
      } else {
        broadcast('round:next', {
          artistId: nextArtist,
          round: nextRoundNum,
        });
        setupNewRound(nextArtist, nextRoundNum);
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [phase, isHost, roomPlayers, currentPlayerId, broadcast, setupNewRound]);

  // 2b. Synchronized visual countdown for all players while on round_end overlay
  useEffect(() => {
    if (phase !== 'round_end') {
      setRoundEndCountdown(5);
      return;
    }

    setRoundEndCountdown(5);
    const interval = setInterval(() => {
      setRoundEndCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [phase]);

  // 3. Late joiner state request: as soon as connected, request state if sitting in lobby
  useEffect(() => {
    if (status === 'connected' && roomId && phase === 'lobby') {
      broadcast('player:request_state', { playerId: currentPlayerId });
    }
  }, [status, roomId, phase, currentPlayerId, broadcast]);

  // 4. Host proactive sync: whenever new players join an active game, immediately broadcast full sync
  const prevPlayerCountRef = useRef(roomPlayers.length);
  useEffect(() => {
    if (isHost && phase !== 'lobby' && roomPlayers.length > prevPlayerCountRef.current) {
      broadcast('game:sync_state', {
        phase,
        currentRound,
        totalRounds,
        artistId,
        turnDuration,
        timeLeft,
        hintMask,
        secretWord,
        strokes,
        canvasBgColor,
        playerScores,
        customWords: customWordsList,
        customOnly,
      });
    }
    prevPlayerCountRef.current = roomPlayers.length;
  }, [
    roomPlayers.length,
    isHost,
    phase,
    currentRound,
    totalRounds,
    artistId,
    turnDuration,
    timeLeft,
    hintMask,
    secretWord,
    strokes,
    canvasBgColor,
    playerScores,
    customWordsList,
    customOnly,
    broadcast,
  ]);

  // 5. Stable incoming Supabase Broadcast event listeners
  useEffect(() => {
    const unsubGameStart = onBroadcast('game:start', (payload) => {
      if (payload.turnDuration) setTurnDuration(payload.turnDuration);
      if (payload.totalRounds) setTotalRounds(payload.totalRounds);
      if (payload.customWords) setCustomWordsList(payload.customWords);
      if (typeof payload.customOnly === 'boolean') setCustomOnly(payload.customOnly);
      setupNewRound(payload.artistId, payload.round, payload.customWords);
    });

    const unsubArtistLeft = onBroadcast('round:artist_left', (payload) => {
      if (payload.nextArtist) {
        setupNewRound(payload.nextArtist, currentRoundRef.current);
      }
    });

    const unsubWordChosen = onBroadcast('word:chosen', (payload) => {
      if (payload.word) setSecretWord(payload.word);
      setHintMask(payload.hintMask);
      setTimeLeft(payload.turnDuration || turnDurationRef.current);
      setPhase('drawing');
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
      endRound(secretWordRef.current);
    });

    const unsubChat = onBroadcast('chat:message', (payload: ChatMessage) => {
      // Solved-only chat filtering: only solvers & artist see it
      if (payload.isSolvedChat && !guessedPlayers.has(currentPlayerId) && currentPlayerId !== artistIdRef.current) {
        return;
      }
      setMessages((prev) => [...prev, payload]);
    });

    const unsubCorrect = onBroadcast('guess:correct', (payload) => {
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
      if (phaseRef.current === 'round_end') return;
      setSecretWord(payload.word);
      if (payload.artistBonus && payload.artistId) {
        setPlayerScores((prev) => ({
          ...prev,
          [payload.artistId]: (prev[payload.artistId] || 0) + payload.artistBonus,
        }));
      }
      setPhase('round_end');
    });

    const unsubRoundNext = onBroadcast('round:next', (payload) => {
      setupNewRound(payload.artistId, payload.round);
    });

    const unsubRequestState = onBroadcast('player:request_state', (payload) => {
      if (isHostRef.current && phaseRef.current !== 'lobby') {
        broadcast('game:sync_state', {
          targetPlayerId: payload?.playerId,
          phase: phaseRef.current,
          currentRound: currentRoundRef.current,
          totalRounds: totalRoundsRef.current,
          artistId: artistIdRef.current,
          turnDuration: turnDurationRef.current,
          timeLeft: timeLeftRef.current,
          hintMask: hintMaskRef.current,
          secretWord: secretWordRef.current,
          strokes: strokesRef.current,
          canvasBgColor: canvasBgColorRef.current,
          playerScores: playerScoresRef.current,
          customWords: customWordsListRef.current,
          customOnly: customOnlyRef.current,
        });
      }
    });

    const unsubSyncState = onBroadcast('game:sync_state', (payload) => {
      if (payload.targetPlayerId && payload.targetPlayerId !== currentPlayerId) return;
      if (!payload.phase || payload.phase === 'lobby') return;

      // Late joiner receives running state and immediately enters game
      setPhase(payload.phase);
      if (payload.currentRound) setCurrentRound(payload.currentRound);
      if (payload.totalRounds) setTotalRounds(payload.totalRounds);
      if (payload.artistId) setArtistId(payload.artistId);
      if (payload.turnDuration) setTurnDuration(payload.turnDuration);
      if (typeof payload.timeLeft === 'number') setTimeLeft(payload.timeLeft);
      if (payload.hintMask) setHintMask(payload.hintMask);
      if (payload.secretWord) setSecretWord(payload.secretWord);
      if (Array.isArray(payload.strokes)) setStrokes(payload.strokes);
      if (payload.canvasBgColor) setCanvasBgColor(payload.canvasBgColor);
      if (payload.playerScores) setPlayerScores(payload.playerScores);
      if (payload.customWords) setCustomWordsList(payload.customWords);
      if (typeof payload.customOnly === 'boolean') setCustomOnly(payload.customOnly);
    });

    const unsubPlayAgain = onBroadcast('game:play_again', () => {
      setPhase('lobby');
    });

    const unsubGameEnd = onBroadcast('game:end', () => {
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
      unsubRoundNext();
      unsubRequestState();
      unsubSyncState();
      unsubPlayAgain();
      unsubGameEnd();
    };
  }, [onBroadcast, broadcast, currentPlayerId, setupNewRound, endRound]);

  // Stroke completion from local artist canvas
  const handleStrokeCompleted = (stroke: StrokeData) => {
    setStrokes((prev) => [...prev, stroke]);
    broadcast('draw:stroke', stroke);
  };

  const handleClear = () => {
    setStrokes([]);
    broadcast('draw:clear', {});
  };

  const handleUndo = () => {
    setStrokes((prev) => prev.slice(0, -1));
    broadcast('draw:undo', {});
  };

  const handleBgColorChange = (color: string) => {
    setCanvasBgColor(color);
    broadcast('draw:bg', { color });
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
          broadcast('round:all_solved', {});
          endRound(secretWord);
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
            {/* Host Match Settings or Guest Rules Preview */}
            {isHost ? (
              <div className="config-block host-config-block">
                <div className="config-label-row">
                  <span className="config-label">MATCH RULES</span>
                  <span className="config-host-pill">👑 Host Controls</span>
                </div>

                <div className="rules-grid">
                  <div className="rule-item">
                    <span className="rule-title">Turn Timer:</span>
                    <div className="segmented-track">
                      {[45, 60, 80].map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setTurnDuration(t)}
                          className={`segmented-pill ${turnDuration === t ? 'active' : ''}`}
                        >
                          {t}s
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="rule-item">
                    <span className="rule-title">Total Rounds:</span>
                    <div className="segmented-track">
                      {[2, 3, 5].map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setTotalRounds(r)}
                          className={`segmented-pill ${totalRounds === r ? 'active' : ''}`}
                        >
                          {r} Rounds
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="custom-words-card">
                  <div className="custom-words-top-bar">
                    <div className="custom-words-title-group">
                      <span className="custom-words-icon">🏷️</span>
                      <div className="custom-words-text-group">
                        <span className="custom-words-main-title">Custom Team Words</span>
                        <span className="custom-words-subtitle">Play with your team's insider jokes, lingo & projects</span>
                      </div>
                    </div>
                    {parsedCustomWords.length > 0 ? (
                      <span className="custom-badge-active">
                        ✓ {parsedCustomWords.length} words loaded
                      </span>
                    ) : (
                      <span className="custom-badge-optional">Optional</span>
                    )}
                  </div>

                  <div className="custom-textarea-container">
                    <textarea
                      value={customWordInput}
                      onChange={(e) => setCustomWordInput(e.target.value)}
                      placeholder="Add team words separated by commas or new lines&#10;e.g. Coffee Mug, Standup, Slack Bot, Pizza, Rubber Duck, Mechanical Keyboard"
                      className="custom-words-textarea"
                      rows={3}
                    />
                    {customWordInput.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setCustomWordInput('')}
                        className="custom-clear-btn"
                        title="Clear all words"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  {parsedCustomWords.length > 0 && (
                    <div className="custom-words-active-zone">
                      {/* Live Word Preview Tags */}
                      <div className="custom-tags-cloud">
                        {parsedCustomWords.slice(0, 10).map((word, i) => (
                          <span key={i} className="custom-word-tag">
                            {word}
                          </span>
                        ))}
                        {parsedCustomWords.length > 10 && (
                          <span className="custom-word-tag-more">
                            +{parsedCustomWords.length - 10} more
                          </span>
                        )}
                      </div>

                      {/* Default Custom-only toggle */}
                      <div className="custom-mode-box">
                        <label className="custom-exclusive-toggle">
                          <input
                            type="checkbox"
                            checked={customOnly}
                            onChange={(e) => setCustomOnly(e.target.checked)}
                          />
                          <span className="toggle-text">
                            <strong>Use custom words only</strong> (no standard words)
                          </span>
                        </label>
                        <span className="custom-status-indicator">
                          {customOnly ? '🎯 Custom Only' : '🔀 Mixed Mode'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="config-block guest-rules-block">
                <div className="config-label-row">
                  <span className="config-label">MATCH RULES</span>
                  <span className="config-guest-pill">Host Managed</span>
                </div>
                <div className="guest-rules-chips">
                  <div className="guest-rule-chip">
                    <span className="chip-label">Turn Timer</span>
                    <span className="chip-val">⏱️ {turnDuration}s</span>
                  </div>
                  <div className="guest-rule-chip">
                    <span className="chip-label">Total Rounds</span>
                    <span className="chip-val">🔄 {totalRounds} Rounds</span>
                  </div>
                  <div className="guest-rule-chip">
                    <span className="chip-label">Word Bank</span>
                    <span className="chip-val">
                      {customWordsList.length > 0
                        ? (customOnly ? `📝 ${customWordsList.length} Custom Words Only` : `🔀 Mixed (${customWordsList.length} Custom + Standard)`)
                        : '🎨 350+ Curated Fun Words'}
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
          <span>🎨 {roomPlayers.find((p) => p.id === artistId)?.displayName || 'Artist'} is choosing a word...</span>
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
            <span className="card-trophy">{guessedPlayers.size > 0 ? '🎉' : '🔔'}</span>
            <h3>{guessedPlayers.size > 0 ? 'Word Guessed!' : 'Round Finished!'}</h3>
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

            <small className="round-end-countdown">
              Next round starting in <strong>{roundEndCountdown}s</strong>...
            </small>
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
            if (isHost) {
              broadcast('game:play_again', {});
            }
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

        .round-end-countdown {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          margin-top: 4px;
          font-size: 13px !important;
          color: var(--text-muted);
        }

        .round-end-countdown strong {
          color: var(--accent-default);
          font-family: var(--font-mono, monospace);
          font-size: 15px;
          font-weight: 850;
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

        .custom-words-card {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-top: 14px;
          padding: 14px 16px;
          background: color-mix(in srgb, var(--surface-raised) 70%, var(--surface-sunken));
          border: 1px solid var(--border-default);
          border-radius: var(--radius-lg);
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
          transition: border-color 0.2s;
        }
        .custom-words-card:focus-within {
          border-color: color-mix(in srgb, var(--accent-default) 60%, var(--border-default));
        }

        .custom-words-top-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }

        .custom-words-title-group {
          display: flex;
          align-items: center;
          gap: 9px;
        }

        .custom-words-icon {
          font-size: 18px;
          line-height: 1;
        }

        .custom-words-text-group {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .custom-words-main-title {
          font-size: 13px;
          font-weight: 800;
          color: var(--text-primary);
          letter-spacing: -0.01em;
        }

        .custom-words-subtitle {
          font-size: 11px;
          color: var(--text-muted);
        }

        .custom-badge-active {
          font-size: 11px;
          font-weight: 750;
          color: #10b981;
          background: rgba(16, 185, 129, 0.12);
          border: 1px solid rgba(16, 185, 129, 0.35);
          padding: 3px 8px;
          border-radius: var(--radius-full);
          white-space: nowrap;
        }

        .custom-badge-optional {
          font-size: 10.5px;
          font-weight: 600;
          color: var(--text-muted);
          background: var(--surface-sunken);
          border: 1px solid var(--border-subtle);
          padding: 2px 7px;
          border-radius: var(--radius-full);
        }

        .custom-textarea-container {
          position: relative;
          width: 100%;
        }

        .custom-words-textarea {
          width: 100%;
          min-height: 76px;
          background: var(--surface-base);
          border: 1px solid var(--border-default);
          color: var(--text-primary);
          padding: 10px 12px;
          border-radius: var(--radius-md);
          font-size: 12.5px;
          line-height: 1.5;
          box-sizing: border-box;
          font-family: inherit;
          resize: vertical;
          outline: none;
          transition: all 0.2s ease;
        }
        .custom-words-textarea:focus {
          border-color: var(--accent-default);
          box-shadow: 0 0 0 3px rgba(217, 119, 6, 0.15);
          background: var(--surface-raised);
        }
        .custom-words-textarea::placeholder {
          color: var(--text-muted);
          opacity: 0.75;
          font-size: 12px;
        }

        .custom-clear-btn {
          position: absolute;
          top: 8px;
          right: 8px;
          background: var(--surface-raised);
          border: 1px solid var(--border-subtle);
          color: var(--text-muted);
          font-size: 10.5px;
          font-weight: 700;
          padding: 3px 7px;
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .custom-clear-btn:hover {
          color: #ef4444;
          border-color: rgba(239, 68, 68, 0.35);
          background: rgba(239, 68, 68, 0.08);
        }

        .custom-words-active-zone {
          display: flex;
          flex-direction: column;
          gap: 9px;
          padding-top: 4px;
        }

        .custom-tags-cloud {
          display: flex;
          flex-wrap: wrap;
          gap: 5px;
          max-height: 72px;
          overflow-y: auto;
          padding: 2px 0;
        }

        .custom-word-tag {
          font-size: 11px;
          font-weight: 650;
          color: var(--accent-default);
          background: color-mix(in srgb, var(--accent-default) 10%, transparent);
          border: 1px solid color-mix(in srgb, var(--accent-default) 28%, transparent);
          padding: 2px 7px;
          border-radius: var(--radius-sm);
          line-height: 1.4;
        }

        .custom-word-tag-more {
          font-size: 10.5px;
          font-weight: 600;
          color: var(--text-muted);
          background: var(--surface-sunken);
          border: 1px solid var(--border-subtle);
          padding: 2px 6px;
          border-radius: var(--radius-sm);
          align-self: center;
        }

        .custom-mode-box {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: color-mix(in srgb, var(--accent-default) 6%, transparent);
          border: 1px solid color-mix(in srgb, var(--accent-default) 22%, transparent);
          border-radius: var(--radius-md);
          padding: 7px 11px;
          gap: 10px;
        }

        .custom-exclusive-toggle {
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 12px;
          color: var(--text-primary);
          cursor: pointer;
          user-select: none;
        }
        .custom-exclusive-toggle input {
          width: 15px;
          height: 15px;
          accent-color: var(--accent-default);
          cursor: pointer;
          margin: 0;
        }
        .custom-exclusive-toggle strong {
          color: var(--text-primary);
          font-weight: 750;
        }

        .custom-status-indicator {
          font-size: 11px;
          font-weight: 750;
          color: var(--accent-default);
          white-space: nowrap;
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
          .skribbl-root-container {
            padding: 8px;
            gap: 8px;
            height: auto;
            min-height: 100%;
            overflow-y: visible;
          }

          .skribbl-play-area {
            display: flex;
            flex-direction: column;
            gap: 8px;
            flex: none;
            overflow: visible;
          }

          .play-left-col {
            order: 1;
            width: 100%;
            min-height: 0;
            overflow: visible;
          }

          .play-center-col {
            order: 2;
            width: 100%;
            min-height: 320px;
            height: 380px;
            flex: none;
            overflow: visible;
          }

          .play-right-col {
            order: 3;
            width: 100%;
            min-height: 280px;
            height: 320px;
            flex: none;
          }

          .avatar-pick-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </div>
  );
};
