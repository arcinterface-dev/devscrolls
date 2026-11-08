---
name: build-arcade
description: >
  Master orchestrator skill for the DevScrolls Arcade (/arcade/).
  Invoke when the user says "build arcade", "create arcade hub", "add arcade page",
  "start arcade", or references the arcade hub page. This skill defines the shared
  infrastructure (hub page, layout, routing, Supabase Realtime multiplayer engine,
  shared CSS, and localStorage utilities) that all individual game skills depend on.
  Build the hub FIRST before any individual game.
inputs:
  - phase: Which phase to execute — "hub" (the /arcade/ landing page), "layout" (ArcadeLayout), or "all".
---

# DevScrolls Arcade: Master Infrastructure Skill

## Overview

The Arcade is a collection of browser games at `/arcade/` designed to drive daily retention and viral team-invite traffic to DevScrolls. This skill builds the **shared foundation** that every game depends on.

> **IMPORTANT**: Build this skill's outputs FIRST before invoking any individual game skill.

---

## Architecture Decisions (Non-Negotiable)

1. **Subpath, NOT subdomain**: All games live under `devscrolls.dev/arcade/*`. This preserves full SEO link equity flow to articles, tools, and the job board.
2. **Zero login required to play**: Players enter a display name stored in `localStorage`. No auth gate. No Supabase Auth. Friction kills viral invite conversion.
3. **React for all interactive game components**: Use `client:only="react"` for game components (canvas, WebSocket, state-heavy UIs). Astro pages are the thin wrappers.
4. **Performance mandate**: All games must hit 60fps on a 2020 mid-range Android phone. Use `requestAnimationFrame` for render loops, `Canvas2D` (not DOM) for drawing games, and `Float32Array` / typed arrays for physics simulations.
5. **No external game libraries**: Every game is hand-written vanilla JS/TS + React. No Phaser, no PixiJS, no p5.js. This keeps bundle size under 50KB per game and avoids dependency bloat.
6. **localStorage for all solo persistence**: Streaks, high scores, settings. No database writes for solo games.
7. **Supabase Realtime Broadcast for multiplayer**: Use `@supabase/supabase-js` (already installed) broadcast channels for real-time room communication. Zero database writes during gameplay — broadcast is pure in-memory WebSocket relay.

---

## File Structure to Create

```
src/
├── layouts/
│   └── ArcadeLayout.astro          # Minimal chrome layout for game pages
├── pages/
│   └── arcade/
│       ├── index.astro             # Hub page: game directory grid
│       ├── terminal-typer.astro    # Solo: Code speed typing
│       ├── memory-leak.astro       # Solo: Chaos engineering sim
│       ├── git-untangler.astro     # Solo: Graph theory puzzle
│       ├── regex-golf.astro        # Solo: Pattern matching
│       ├── 2048.astro              # Solo: Tech evolution tiles
│       ├── dev-skribbl.astro       # Multiplayer: Draw & guess
│       ├── who-broke-prod.astro    # Multiplayer: Social deduction
│       ├── codenames.astro         # Multiplayer: Team word grid
│       ├── type-racer.astro        # Multiplayer: Live typing race
│       └── terminal-duel.astro     # Multiplayer: Reflex 1v1
├── components/
│   └── arcade/
│       ├── ArcadeHub.tsx           # Hub page React component (game cards grid)
│       ├── shared/
│       │   ├── useSupabaseRoom.ts  # Custom hook: Supabase Realtime room management
│       │   ├── RoomLobby.tsx       # Shared lobby UI: create/join room, display name, player list
│       │   ├── ShareRoomLink.tsx   # One-click copy room URL component
│       │   ├── GameOverScreen.tsx  # Shared post-game podium with DevScrolls cross-links
│       │   ├── storage.ts          # localStorage helpers: streaks, high scores, display name
│       │   └── constants.ts        # Game metadata registry (titles, descriptions, routes, tags)
│       ├── TerminalTyper/          # Game-specific components
│       ├── MemoryLeak/
│       ├── GitUntangler/
│       ├── RegexGolf/
│       ├── TechTiles2048/
│       ├── DevSkribbl/
│       ├── WhoBrokeProd/
│       ├── CodeNames/
│       ├── TypeRacer/
│       └── TerminalDuel/
```

---

## Step 1: Create `ArcadeLayout.astro`

A minimal-chrome layout similar to `ToolLayout.astro` but with arcade-specific breadcrumb navigation (`DevScrolls / Arcade / Game Name`). 

### Requirements:
- Import `global.css` for design token access.
- Minimal 48px header with: DevScrolls logo → `/arcade/` link → current game name breadcrumb → ThemeToggle.
- Full-bleed body (`height: 100dvh; overflow: hidden`) for immersive game views.
- Props: `title: string`, `description: string`, `gameName?: string`.
- Include `<SEO>` component.
- Include `llms.txt` and `llms-full.txt` alternate links in `<head>`.

### Reference:
Copy the structure of `src/layouts/ToolLayout.astro` and replace:
- "Tools" breadcrumb link → "Arcade" pointing to `/arcade/`.
- Class prefix `tool-` → `arcade-`.

---

## Step 2: Create `src/components/arcade/shared/constants.ts`

Central game metadata registry used by the hub page and individual game pages:

```typescript
export interface GameMeta {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: string;             // Single emoji or SVG path
  mode: 'solo' | 'multiplayer';
  playerRange?: string;     // e.g., "2-8 players"
  timeEstimate: string;     // e.g., "2 min", "5-10 min"
  tags: string[];           // e.g., ["TypeScript", "Speed", "Typing"]
  isNew?: boolean;
}

export const GAMES: GameMeta[] = [
  {
    id: 'terminal-typer',
    title: 'Terminal Typer',
    description: 'Code-syntax speed typing test. Pick your language, race against your own WPM.',
    href: '/arcade/terminal-typer/',
    icon: '⌨️',
    mode: 'solo',
    timeEstimate: '2 min',
    tags: ['TypeScript', 'Python', 'Speed', 'Typing'],
    isNew: true,
  },
  {
    id: 'memory-leak',
    title: 'Memory Leak',
    description: 'Chaos engineering survival sim. Kill zombie processes, balance loads, prevent server meltdowns.',
    href: '/arcade/memory-leak/',
    icon: '🔥',
    mode: 'solo',
    timeEstimate: '3-5 min',
    tags: ['DevOps', 'Simulation', 'Arcade'],
  },
  {
    id: 'git-untangler',
    title: 'Git Untangler',
    description: 'Drag commit nodes to untangle crossing branches. Procedurally generated graph puzzles.',
    href: '/arcade/git-untangler/',
    icon: '🌿',
    mode: 'solo',
    timeEstimate: '2-5 min',
    tags: ['Git', 'Puzzle', 'Graph Theory'],
  },
  {
    id: 'regex-golf',
    title: 'Regex Golf',
    description: 'Write the shortest regex to match green strings and reject red ones. Dynamic test sets.',
    href: '/arcade/regex-golf/',
    icon: '.*',
    mode: 'solo',
    timeEstimate: '3-5 min',
    tags: ['Regex', 'Puzzle', 'Challenge'],
  },
  {
    id: '2048-tech',
    title: '2048: Tech Evolution',
    description: 'Slide tiles from Punch Card to Quantum AI. Classic 2048 with a computing history theme.',
    href: '/arcade/2048/',
    icon: '🧮',
    mode: 'solo',
    timeEstimate: '5-10 min',
    tags: ['Puzzle', 'Classic', 'Casual'],
  },
  {
    id: 'dev-skribbl',
    title: 'Dev Skribbl',
    description: 'Multiplayer draw & guess with Tech and Casual word decks. Invite your team via link.',
    href: '/arcade/dev-skribbl/',
    icon: '🎨',
    mode: 'multiplayer',
    playerRange: '3-12 players',
    timeEstimate: '5-15 min',
    tags: ['Drawing', 'Party', 'Team'],
    isNew: true,
  },
  {
    id: 'who-broke-prod',
    title: 'Who Broke Production?',
    description: 'Social deduction: everyone knows the incident except the Rogue Deployer. Vote them out.',
    href: '/arcade/who-broke-prod/',
    icon: '🕵️',
    mode: 'multiplayer',
    playerRange: '3-10 players',
    timeEstimate: '5-10 min',
    tags: ['Deduction', 'Party', 'Team'],
  },
  {
    id: 'codenames',
    title: 'CodeNames',
    description: 'Team-based word association on a 5x5 grid. Give one-word clues to link your cards.',
    href: '/arcade/codenames/',
    icon: '🔎',
    mode: 'multiplayer',
    playerRange: '4-10 players',
    timeEstimate: '10-15 min',
    tags: ['Strategy', 'Party', 'Team'],
  },
  {
    id: 'type-racer',
    title: 'TypeRacer',
    description: 'Live multiplayer code-typing drag race. See opponents\' progress bars in real time.',
    href: '/arcade/type-racer/',
    icon: '🏎️',
    mode: 'multiplayer',
    playerRange: '2-8 players',
    timeEstimate: '2-3 min',
    tags: ['Speed', 'Typing', 'Competition'],
  },
  {
    id: 'terminal-duel',
    title: 'Terminal Duel',
    description: '1v1 reflex showdown. React to randomized terminal alerts faster than your opponent.',
    href: '/arcade/terminal-duel/',
    icon: '⚡',
    mode: 'multiplayer',
    playerRange: '2 players',
    timeEstimate: '2 min',
    tags: ['Reflex', 'Competition', '1v1'],
  },
];

export const SOLO_GAMES = GAMES.filter(g => g.mode === 'solo');
export const MULTIPLAYER_GAMES = GAMES.filter(g => g.mode === 'multiplayer');
```

---

## Step 3: Create `src/components/arcade/shared/storage.ts`

Shared `localStorage` utility used by all solo games:

```typescript
const PREFIX = 'ds_arcade_';

export const storage = {
  getDisplayName: (): string =>
    localStorage.getItem(`${PREFIX}display_name`) || '',

  setDisplayName: (name: string): void =>
    localStorage.setItem(`${PREFIX}display_name`, name),

  getHighScore: (gameId: string): number =>
    parseInt(localStorage.getItem(`${PREFIX}${gameId}_highscore`) || '0', 10),

  setHighScore: (gameId: string, score: number): void => {
    const current = storage.getHighScore(gameId);
    if (score > current) {
      localStorage.setItem(`${PREFIX}${gameId}_highscore`, String(score));
    }
  },

  getStreak: (gameId: string): { count: number; lastDate: string } => {
    const raw = localStorage.getItem(`${PREFIX}${gameId}_streak`);
    return raw ? JSON.parse(raw) : { count: 0, lastDate: '' };
  },

  incrementStreak: (gameId: string): number => {
    const today = new Date().toISOString().slice(0, 10);
    const streak = storage.getStreak(gameId);
    if (streak.lastDate === today) return streak.count; // Already played today
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const newCount = streak.lastDate === yesterday ? streak.count + 1 : 1;
    localStorage.setItem(`${PREFIX}${gameId}_streak`, JSON.stringify({ count: newCount, lastDate: today }));
    return newCount;
  },
};
```

---

## Step 4: Create `src/components/arcade/shared/useSupabaseRoom.ts`

Shared React hook for multiplayer room management via Supabase Realtime broadcast:

### Requirements:
- Import `createClient` from `@supabase/supabase-js`.
- Initialize Supabase client using `import.meta.env.PUBLIC_SUPABASE_URL` and `import.meta.env.PUBLIC_SUPABASE_ANON_KEY`.
- Accept `roomId: string` and `displayName: string`.
- Create a Supabase Realtime channel named `arcade:${roomId}`.
- Track presence using `channel.track({ displayName, joinedAt: Date.now() })`.
- Expose:
  - `players`: Current list of players in the room (from presence state).
  - `broadcast(event: string, payload: object)`: Send a broadcast event to all players.
  - `onBroadcast(event: string, callback: (payload) => void)`: Listen for broadcast events.
  - `leave()`: Unsubscribe and leave the channel.
- On unmount, call `leave()` automatically via `useEffect` cleanup.

### Key Constraint:
- **Zero database writes**. Broadcast channels are pure in-memory WebSocket relay. No Supabase tables needed for gameplay.

---

## Step 5: Create `src/components/arcade/shared/RoomLobby.tsx`

Reusable lobby component shared by all 5 multiplayer games:

### Behavior:
1. If no `?room=` query param exists, show "Create Room" button that generates a random 6-char alphanumeric room ID and navigates to `?room=XXXXXX`.
2. If `?room=` exists, show:
   - Room code display + one-click copy full URL button.
   - Display name input (pre-filled from `storage.getDisplayName()`).
   - Live player list (from `useSupabaseRoom` presence).
   - "Start Game" button (only visible to the room creator / first player).
3. No authentication. No sign-up. Display name + room code is all that's needed.

---

## Step 6: Create `src/components/arcade/shared/GameOverScreen.tsx`

Shared post-game results screen with cross-promotion:

### Contents:
- Podium or score display (accepts `results` prop).
- "Play Again" button.
- "Share Result" button (copies emoji matrix or score to clipboard).
- Contextual DevScrolls cross-links:
  - "Explore developer tools" → `/tools/`
  - "Browse remote engineering jobs" → `/jobs/`
  - "Read engineering deep dives" → `/articles/`

---

## Step 7: Create Hub Page `src/pages/arcade/index.astro`

### Requirements:
- Use `BaseLayout` (NOT `ArcadeLayout` — the hub is a standard page with full site header/footer).
- Title: "Developer Arcade — DevScrolls"
- Description: "Browser games for developers and engineering teams. Solo daily puzzles and multiplayer party games — no sign-up required."
- Render `<ArcadeHub client:load />` React component.

### `ArcadeHub.tsx` Design:
- Hero section: "DevScrolls Arcade" title + subtitle.
- Filter tabs: "All" | "Solo" | "Multiplayer".
- Game cards grid using `GAMES` from `constants.ts`.
- Each card shows: icon, title, description, mode badge (Solo/Multiplayer), player range, time estimate, "NEW" badge if applicable.
- Cards link to the game's `/arcade/<id>/` page.
- Use existing DevScrolls design tokens (`--surface-sunken`, `--border-subtle`, `--accent-brand`, etc.) for consistency.
- Hover animation: `transform: translateY(-2px)` + `box-shadow: var(--shadow-sm)`.

---

## Step 8: Add Arcade to Site Navigation

Update `src/components/Header.astro` to add an "Arcade" nav link between "Tools" and "Jobs" (or after "Jobs"):

```html
<a href="/arcade/" class="nav-link">Arcade</a>
```

---

## Post-Build Checklist

After the hub and shared infrastructure are complete:
1. Invoke individual game skills one at a time (see `references/` for the full list).
2. After each game is built, invoke `sync-ai-manifest` to update `llms.txt` and `llms-full.txt`.
3. Verify the hub page renders all game cards correctly with working links.
4. Verify multiplayer room creation works end-to-end with Supabase Realtime.
