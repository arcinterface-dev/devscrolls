const PREFIX = 'ds_arcade_';

export interface StreakData {
  count: number;
  lastDate: string;
}

export interface GameStats {
  gamesPlayed: number;
  highScore: number;
  lastScore?: number;
  lastPlayed?: string;
  custom?: Record<string, any>;
}

const isBrowser = typeof window !== 'undefined' && typeof localStorage !== 'undefined';

export const storage = {
  getDisplayName: (): string => {
    if (!isBrowser) return '';
    return localStorage.getItem(`${PREFIX}display_name`) || '';
  },

  setDisplayName: (name: string): void => {
    if (!isBrowser) return;
    const sanitized = name.trim().slice(0, 24);
    if (sanitized) {
      localStorage.setItem(`${PREFIX}display_name`, sanitized);
    }
  },

  getHighScore: (gameId: string): number => {
    if (!isBrowser) return 0;
    return parseInt(localStorage.getItem(`${PREFIX}${gameId}_highscore`) || '0', 10);
  },

  setHighScore: (gameId: string, score: number): boolean => {
    if (!isBrowser) return false;
    const current = storage.getHighScore(gameId);
    if (score > current) {
      localStorage.setItem(`${PREFIX}${gameId}_highscore`, String(score));
      return true; // New high score achieved!
    }
    return false;
  },

  getStreak: (gameId: string): StreakData => {
    if (!isBrowser) return { count: 0, lastDate: '' };
    try {
      const raw = localStorage.getItem(`${PREFIX}${gameId}_streak`);
      return raw ? JSON.parse(raw) : { count: 0, lastDate: '' };
    } catch {
      return { count: 0, lastDate: '' };
    }
  },

  incrementStreak: (gameId: string): number => {
    if (!isBrowser) return 0;
    const today = new Date().toISOString().slice(0, 10);
    const streak = storage.getStreak(gameId);

    if (streak.lastDate === today) {
      return streak.count; // Already played and recorded today
    }

    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const newCount = streak.lastDate === yesterday ? streak.count + 1 : 1;
    
    localStorage.setItem(
      `${PREFIX}${gameId}_streak`,
      JSON.stringify({ count: newCount, lastDate: today })
    );
    return newCount;
  },

  getStats: (gameId: string): GameStats => {
    if (!isBrowser) return { gamesPlayed: 0, highScore: 0 };
    try {
      const raw = localStorage.getItem(`${PREFIX}${gameId}_stats`);
      const base = raw ? JSON.parse(raw) : { gamesPlayed: 0 };
      return {
        ...base,
        highScore: storage.getHighScore(gameId),
      };
    } catch {
      return { gamesPlayed: 0, highScore: storage.getHighScore(gameId) };
    }
  },

  recordGameFinished: (gameId: string, score: number, extra?: Record<string, any>): { isNewHighScore: boolean; streak: number } => {
    if (!isBrowser) return { isNewHighScore: false, streak: 0 };
    const isNewHighScore = storage.setHighScore(gameId, score);
    const streak = storage.incrementStreak(gameId);
    
    const stats = storage.getStats(gameId);
    const updated: GameStats = {
      gamesPlayed: (stats.gamesPlayed || 0) + 1,
      highScore: Math.max(stats.highScore || 0, score),
      lastScore: score,
      lastPlayed: new Date().toISOString(),
      custom: { ...(stats.custom || {}), ...extra },
    };
    
    localStorage.setItem(`${PREFIX}${gameId}_stats`, JSON.stringify(updated));
    return { isNewHighScore, streak };
  },
};
