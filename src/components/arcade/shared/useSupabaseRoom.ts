import { useState, useEffect, useRef, useCallback } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../../../lib/supabase';

export interface RoomPlayer {
  id: string;
  displayName: string;
  joinedAt: number;
  isHost?: boolean;
  avatarSeed?: string;
  meta?: Record<string, any>;
}

export interface UseSupabaseRoomOptions {
  roomId: string;
  displayName: string;
  isHostIntent?: boolean;
}

export interface UseSupabaseRoomReturn {
  status: 'idle' | 'connecting' | 'connected' | 'error' | 'unconfigured';
  error: string | null;
  players: RoomPlayer[];
  currentPlayerId: string;
  isHost: boolean;
  broadcast: (event: string, payload?: any) => Promise<void>;
  onBroadcast: (event: string, callback: (payload: any) => void) => () => void;
  leave: () => void;
}

export function useSupabaseRoom({
  roomId,
  displayName,
  isHostIntent = false,
}: UseSupabaseRoomOptions): UseSupabaseRoomReturn {
  const [status, setStatus] = useState<UseSupabaseRoomReturn['status']>('idle');
  const [error, setError] = useState<string | null>(null);
  const [players, setPlayers] = useState<RoomPlayer[]>([]);
  const [currentPlayerId] = useState<string>(() => {
    // Ephemeral unique player ID per tab/window instance so multi-tab & multi-browser testing works seamlessly
    const salt = Math.random().toString(36).substring(2, 8);
    return 'p_' + Date.now().toString(36) + '_' + salt;
  });

  const channelRef = useRef<RealtimeChannel | null>(null);
  const listenersRef = useRef<Map<string, Set<(payload: any) => void>>>(new Map());

  // Subscribe and handle channel lifecycle
  useEffect(() => {
    if (!roomId || !displayName) {
      setStatus('idle');
      return;
    }

    if (!isSupabaseConfigured) {
      // In local dev without Supabase configured, enable local mock multi-tab simulation
      console.warn('[useSupabaseRoom] Supabase keys not configured. Simulating single-player/local room.');
      setStatus('unconfigured');
      setPlayers([
        {
          id: currentPlayerId,
          displayName,
          joinedAt: Date.now(),
          isHost: true,
        },
      ]);
      return;
    }

    setStatus('connecting');
    setError(null);

    const channelName = `arcade:${roomId}`;
    const channel = supabase.channel(channelName, {
      config: {
        broadcast: { ack: false, self: false },
        presence: { key: currentPlayerId },
      },
    });

    channelRef.current = channel;

    // Presence sync handler
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const rawPlayers: RoomPlayer[] = [];

      Object.entries(state).forEach(([key, presences]) => {
        if (Array.isArray(presences) && presences.length > 0) {
          const latest: any = presences[presences.length - 1];
          rawPlayers.push({
            id: key,
            displayName: latest.displayName || 'Anonymous Dev',
            joinedAt: latest.joinedAt || Date.now(),
            isHost: Boolean(latest.isHost),
            avatarSeed: latest.avatarSeed || key,
            meta: latest.meta,
          });
        }
      });

      // Sort by joinedAt so earliest player is host if host leaves
      rawPlayers.sort((a, b) => a.joinedAt - b.joinedAt);
      if (rawPlayers.length > 0 && !rawPlayers.some(p => p.isHost)) {
        rawPlayers[0].isHost = true;
      }

      setPlayers(rawPlayers);
    });

    // Listen to broadcast events and route to registered listeners
    channel.on('broadcast', { event: '*' }, (message: { event: string; payload: any }) => {
      const { event, payload } = message;
      const handlers = listenersRef.current.get(event);
      if (handlers) {
        handlers.forEach(fn => {
          try {
            fn(payload);
          } catch (e) {
            console.error(`[useSupabaseRoom] Error in handler for event "${event}":`, e);
          }
        });
      }
    });

    // Subscribe to channel and track presence
    channel.subscribe(async (subStatus) => {
      if (subStatus === 'SUBSCRIBED') {
        setStatus('connected');
        try {
          await channel.track({
            id: currentPlayerId,
            displayName,
            isHost: isHostIntent,
            joinedAt: Date.now(),
          });
        } catch (trackErr: any) {
          console.error('[useSupabaseRoom] Presence track error:', trackErr);
        }
      } else if (subStatus === 'CHANNEL_ERROR') {
        setStatus('error');
        setError('Failed to connect to multiplayer channel.');
      } else if (subStatus === 'TIMED_OUT') {
        setStatus('error');
        setError('Multiplayer connection timed out.');
      }
    });

    return () => {
      channel.untrack();
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [roomId, displayName, currentPlayerId, isHostIntent]);

  // Broadcast an event to peers
  const broadcast = useCallback(
    async (event: string, payload: any = {}) => {
      if (!channelRef.current) {
        // Fallback for single-player/unconfigured mode
        const handlers = listenersRef.current.get(event);
        if (handlers) {
          handlers.forEach(fn => fn(payload));
        }
        return;
      }

      try {
        await channelRef.current.send({
          type: 'broadcast',
          event,
          payload: {
            ...payload,
            _senderId: currentPlayerId,
            _timestamp: Date.now(),
          },
        });
      } catch (err) {
        console.error(`[useSupabaseRoom] Broadcast failed for "${event}":`, err);
      }
    },
    [currentPlayerId]
  );

  // Register an event listener
  const onBroadcast = useCallback((event: string, callback: (payload: any) => void) => {
    if (!listenersRef.current.has(event)) {
      listenersRef.current.set(event, new Set());
    }
    const set = listenersRef.current.get(event)!;
    set.add(callback);

    return () => {
      set.delete(callback);
      if (set.size === 0) {
        listenersRef.current.delete(event);
      }
    };
  }, []);

  // Leave room manually
  const leave = useCallback(() => {
    if (channelRef.current) {
      channelRef.current.untrack();
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    setStatus('idle');
    setPlayers([]);
  }, []);

  const isHost = players.length > 0 && players[0].id === currentPlayerId;

  return {
    status,
    error,
    players,
    currentPlayerId,
    isHost,
    broadcast,
    onBroadcast,
    leave,
  };
}
