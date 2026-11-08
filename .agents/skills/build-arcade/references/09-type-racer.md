---
name: build-type-racer
description: >
  Build the TypeRacer multiplayer game for DevScrolls Arcade (/arcade/type-racer/).
  Live multiplayer code-typing drag race. See opponents' progress bars in real time.
  Uses Supabase Realtime broadcast for position sync.
inputs:
  - trigger: User says "build type racer", "multiplayer typing", or "typing race".
---

# TypeRacer: Live Code Typing Race — Development Spec

## Game Identity
- **Route**: `/arcade/type-racer/`
- **Type**: Multiplayer (2–8 players)
- **Time**: 2–3 minutes per race
- **Replay Guarantee**: Snippets drawn from a large procedural pool (same system as Terminal Typer); real-time human competition makes every race dynamic

---

## Core Gameplay Loop

### Lobby
1. Standard `RoomLobby`: create room, share link, display name entry, live player list.
2. Room creator selects:
   - **Language**: TypeScript, Python, Go, Rust, SQL, Bash, or "Mixed" (random).
   - **Snippet Length**: Short (~80 chars), Medium (~150 chars), Long (~250 chars).
3. "Start Race" button (enabled when ≥2 players).

### Pre-Race
1. All players see the same code snippet displayed in a read-only monospace code block.
2. 3-2-1 countdown overlay with engine rev sound effect (optional — CSS animation only, no audio files).
3. Input field is disabled until countdown hits zero.

### Racing Phase
1. All players type simultaneously into their own input field.
2. Each player's screen shows:
   - The snippet with character-by-character highlighting (correct = green, current position = cursor, errors = red).
   - A **race track visualization**: horizontal progress bars for ALL players, showing real-time percentage progress.
   - Live **WPM** counter.
3. Progress sync: Every 500ms, each player broadcasts their current progress (`{ charIndex, wpm, errors }`) to all other players via Supabase broadcast.
4. Error handling: Same as Terminal Typer — incorrect character highlights red, the cursor does NOT advance until the correct character is typed.

### Race Finish
1. First player to type the entire snippet correctly triggers `race:finish`.
2. Other players can continue to finish (or give up). A 30-second grace period runs after the winner finishes.
3. Results podium: 1st/2nd/3rd with WPM, accuracy, and finish times.
4. "Race Again" button (reshuffles snippet, keeps room alive).

---

## Real-Time Architecture (Supabase Broadcast)

### Channel: `arcade:typeracer:${roomId}`

### Broadcast Events:

| Event | Sender | Payload |
|-------|--------|---------|
| `race:config` | Host | `{ language, snippetLength }` |
| `race:countdown` | Host | `{ snippet, startsAt: timestamp }` |
| `race:start` | Host | `{}` |
| `progress:update` | Each player | `{ playerId, charIndex, totalChars, wpm, errors, finished }` |
| `race:finish` | Host | `{ results: PlayerResult[], podium }` |

### Progress Broadcasting
- Each player sends `progress:update` every **500ms** (NOT every keystroke — that would flood the channel).
- The local typing experience is instant (DOM-level rendering); only the progress bars of other players update at 500ms intervals.
- This keeps broadcast message volume under 16 messages/second for an 8-player room.

---

## Technical Requirements

### Component Structure
```
src/components/arcade/TypeRacer/
├── TypeRacer.tsx              # Root: lobby → countdown → racing → results
├── RaceTrack.tsx              # Progress bars for all players (colored bars sliding right)
├── TypingArea.tsx             # Code snippet display + hidden input + character highlighting
├── RaceResults.tsx            # Podium with WPM, accuracy, time
├── SnippetGenerator.ts        # Reuse Terminal Typer's procedural snippet engine
└── constants.ts               # Snippet length configs, broadcast interval
```

### Race Track Visualization (`RaceTrack.tsx`)
- Horizontal bars, one per player, stacked vertically.
- Each bar shows: player name (left), colored progress fill (width = `charIndex/totalChars * 100%`), WPM label (right).
- Player colors assigned from a palette: `['#ef4444', '#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']`.
- Finished players get a checkered flag icon at 100%.
- Smooth width transitions: `transition: width 400ms ease-out` (slightly slower than the 500ms broadcast interval for smooth interpolation).

### Typing Area (`TypingArea.tsx`)
- Reuse the same rendering approach as Terminal Typer:
  - Invisible `<input>` captures keystrokes.
  - `<pre>` element renders the snippet with per-character `<span>` styling (correct/incorrect/pending).
  - Direct DOM manipulation via refs for sub-16ms keystroke-to-visual feedback.

### Performance Mandates
- Local typing: zero perceptible lag (same as Terminal Typer).
- Race track bar transitions must not cause layout reflows — use `transform: scaleX()` or `width` with `will-change: width`.
- Total bundle under 30KB gzipped.
- Reuse `SnippetGenerator` from Terminal Typer's `token-pools/` — do NOT duplicate the code.

### Styling
- Race track: Dark strip at the top of the page with player bars. Each bar has rounded corners and a subtle gradient in the player's color.
- Typing area: Monospace code block on dark terminal background (same as Terminal Typer).
- Countdown: Large centered numbers with scale-in/fade-out animation.
- Winner: Confetti burst (CSS-only particles).

### Storage & Sharing
- `storage.setHighScore('type-racer', bestWpm)`.
- Share format:
```
TypeRacer 🏎️ | 1st Place!
WPM: 94 | Accuracy: 97.8% | Time: 38s
Language: TypeScript | 4 players
devscrolls.dev/arcade/type-racer/
```

---

## Astro Page Wrapper

`src/pages/arcade/type-racer.astro`:
```astro
---
import ArcadeLayout from '../../layouts/ArcadeLayout.astro';
---
<ArcadeLayout
  title="TypeRacer — DevScrolls Arcade"
  description="Live multiplayer code-typing drag race. See opponents' progress in real time. Invite your team and race!"
  gameName="TypeRacer"
>
  <TypeRacer client:only="react" />
</ArcadeLayout>
```
