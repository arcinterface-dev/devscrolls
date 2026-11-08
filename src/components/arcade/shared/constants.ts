export interface GameMeta {
  id: string;
  title: string;
  tagline: string;
  description: string;
  href: string;
  icon: string;             // Emoji or icon identifier
  mode: 'solo' | 'multiplayer';
  playerRange?: string;     // e.g. "2-8 players"
  timeEstimate: string;     // e.g. "2 min", "5-10 min"
  tags: string[];           // e.g. ["TypeScript", "Speed", "Typing"]
  accentColor: string;      // Visual branding highlight
  difficulty: 'Easy' | 'Medium' | 'Hard';
  isNew?: boolean;
  featured?: boolean;
}

export const ALL_GAMES: GameMeta[] = [
  // --- MULTIPLAYER PARTY GAMES ---
  {
    id: 'dev-skribbl',
    title: 'Dev Skribbl',
    tagline: 'Multiplayer draw & guess with custom words',
    description: 'Draw tech concepts, system diagrams, and funny dev memes while friends race to guess. Full drawing toolkit, fill bucket, and custom word decks.',
    href: '/games/dev-skribbl/',
    icon: '🎨',
    mode: 'multiplayer',
    playerRange: '2-12 players',
    timeEstimate: '5-15 min',
    tags: ['Drawing', 'Party', 'Skribbl', 'Realtime'],
    accentColor: '#ec4899',
    difficulty: 'Easy',
    isNew: true,
    featured: true,
  },
  {
    id: 'type-racer',
    title: 'TypeRacer',
    tagline: 'Live multiplayer code-typing drag race',
    description: 'Line up on the grid with friends or coworkers. Watch live real-time progress bars race across realistic production code.',
    href: '/games/type-racer/',
    icon: '🏎️',
    mode: 'multiplayer',
    playerRange: '2-8 players',
    timeEstimate: '2-3 min',
    tags: ['Speed', 'Typing', 'Multiplayer', 'Race'],
    accentColor: '#10b981',
    difficulty: 'Medium',
    isNew: true,
    featured: true,
  },
  {
    id: 'dev-telephone',
    title: 'Dev Telephone',
    tagline: 'Gartic Phone style drawing & guessing chaos',
    description: 'Prompt -> Draw -> Guess -> Draw. Watch a simple "React useEffect bug" mutate into absolute chaos in a hilarious round-end reveal slideshow.',
    href: '/games/dev-telephone/',
    icon: '📞',
    mode: 'multiplayer',
    playerRange: '3-10 players',
    timeEstimate: '5-10 min',
    tags: ['Party', 'Social', 'Drawing', 'Hilarious'],
    accentColor: '#f97316',
    difficulty: 'Easy',
    isNew: true,
  },
  {
    id: 'quiz-show',
    title: 'Tech Quiz Show',
    tagline: 'Kahoot-style rapid-fire tech trivia',
    description: '10 quick-fire questions on web, frontend, bugs, and dev culture. Streak multipliers, buzzer sound effects, and live podium finishes.',
    href: '/games/quiz-show/',
    icon: '⚡',
    mode: 'multiplayer',
    playerRange: '2-12 players',
    timeEstimate: '3-5 min',
    tags: ['Trivia', 'Party', 'Leaderboard', 'Fun'],
    accentColor: '#8b5cf6',
    difficulty: 'Easy',
    isNew: true,
  },

  // --- SOLO CASUAL PUZZLES ---
  {
    id: 'devdle',
    title: 'Devdle (Tech Wordle)',
    tagline: 'Guess the 5-letter tech keyword in 6 tries',
    description: 'Daily tech word puzzle. Guess terms like ASYNC, REACT, REDUX, PROXY, and CACHE with color-coded hints and streak tracking.',
    href: '/games/devdle/',
    icon: '🟩',
    mode: 'solo',
    timeEstimate: '2 min',
    tags: ['Wordle', 'Puzzle', 'Daily', 'Logic'],
    accentColor: '#22c55e',
    difficulty: 'Easy',
    isNew: true,
  },
  {
    id: '2048-tech',
    title: '2048: Tech Evolution',
    tagline: 'From Punch Cards to Quantum Supercomputing',
    description: 'Slide, combine, and evolve computing history from Vacuum Tubes and Mainframes up to Neural ASICs and Quantum Supremacy.',
    href: '/games/2048/',
    icon: '🧮',
    mode: 'solo',
    timeEstimate: '5-10 min',
    tags: ['Puzzle', 'Classic', 'Casual'],
    accentColor: '#f59e0b',
    difficulty: 'Easy',
  },
  {
    id: 'terminal-typer',
    title: 'Terminal Typer',
    tagline: 'Code-syntax speed typing test',
    description: 'Race against the clock typing real TypeScript, Python, and Go snippets. Test your true developer WPM, accuracy, and syntax reflexes.',
    href: '/games/terminal-typer/',
    icon: '⌨️',
    mode: 'solo',
    timeEstimate: '2 min',
    tags: ['TypeScript', 'Python', 'Speed', 'Reflex'],
    accentColor: '#3b82f6',
    difficulty: 'Medium',
    isNew: true,
  },
  {
    id: 'ai-or-human',
    title: 'AI or Human?',
    tagline: 'Did a junior dev or ChatGPT write this?',
    description: 'Inspect bizarre bugs, cursed code snippets, and weird git commit messages. Guess whether it was hallucinated by an LLM or committed at 3 AM.',
    href: '/games/ai-or-human/',
    icon: '🤖',
    mode: 'solo',
    timeEstimate: '2-3 min',
    tags: ['AI', 'Casual', 'Humor', 'Trivia'],
    accentColor: '#06b6d4',
    difficulty: 'Easy',
    isNew: true,
  },
];

// Production exposure: only Dev Skribbl is published; all 8 games available in local development mode
export const IS_DEV = import.meta.env.DEV;

export const GAMES: GameMeta[] = IS_DEV
  ? ALL_GAMES
  : ALL_GAMES.filter((g) => g.id === 'dev-skribbl');

export const SOLO_GAMES = GAMES.filter((g) => g.mode === 'solo');
export const MULTIPLAYER_GAMES = GAMES.filter((g) => g.mode === 'multiplayer');
