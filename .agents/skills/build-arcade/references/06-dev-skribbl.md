---
name: build-dev-skribbl
description: >
  Build the Dev Skribbl multiplayer game for DevScrolls Arcade (/arcade/dev-skribbl/).
  Real-time multiplayer draw & guess game with Tech and Casual word decks.
  Uses Supabase Realtime broadcast for room communication. Invite via link.
inputs:
  - trigger: User says "build dev skribbl", "drawing game", "skribbl", or "pictionary game".
---

# Dev Skribbl: Multiplayer Draw & Guess — Development Spec

## Game Identity
- **Route**: `/arcade/dev-skribbl/`
- **Type**: Multiplayer (3–12 players)
- **Time**: 5–15 minutes per session
- **Replay Guarantee**: Player-driven (human creativity makes every round unique); word pools contain 200+ words per deck

---

## Core Gameplay Loop

### Room Creation & Joining
1. Player visits `/arcade/dev-skribbl/` → sees "Create Room" button.
2. Clicking creates a room with a random 6-char ID and navigates to `?room=XXXXXX`.
3. The `RoomLobby` component (shared) handles:
   - Display name entry.
   - Live player list (via Supabase Realtime presence).
   - "Copy Invite Link" button.
   - Room creator sees deck selection (Tech / Casual / Mixed) and round count (3/5/7).
   - "Start Game" button (only for room creator, enabled when ≥3 players).

### Game Flow
1. **Round Start**: One player is randomly selected as the **Artist**.
   - The Artist sees 3 word options (randomly drawn from the selected deck). They pick one.
   - All other players see "Artist is choosing a word..." then a blank canvas with a chat panel.

2. **Drawing Phase** (60 seconds per round):
   - **Artist's view**: Canvas with drawing tools (5 brush sizes, 12-color palette, eraser, clear canvas, undo last stroke).
   - **Other players' view**: Canvas mirrors the Artist's strokes in real time (via Supabase broadcast). A chat input field for typing guesses.
   - **Word hint**: A row of underscores showing word length (e.g., `_ _ _ _ _ _ _ _ _ _ _` for "Kubernetes"). Letters are progressively revealed at 20s and 40s.
   - **Guessing**: When a player's chat message exactly matches the word (case-insensitive), they score points and their chat shows "✓ [Player] guessed correctly!" without revealing the word to others.
   - Points: First guesser gets 100, second gets 80, third gets 60, etc. Artist gets 10 points per correct guesser.

3. **Round End**: Word is revealed. Scoreboard updates. Next artist is selected (round-robin).

4. **Game Over**: After all rounds complete, show the final podium (1st/2nd/3rd with total scores) using the shared `GameOverScreen` component.

---

## Word Decks

### Tech Deck (200+ words)
Create a comprehensive list. Categories within the tech deck:
- **DevOps & Infra**: Kubernetes, Docker, Jenkins, Load Balancer, CDN, SSL Certificate, Server Rack, CI/CD Pipeline, Firewall, DNS
- **Programming Concepts**: Recursion, Merge Conflict, Stack Overflow, Null Pointer, Race Condition, Deadlock, Binary Tree, Hash Map, Linked List, API Gateway
- **Developer Life**: Rubber Duck, Stand-up Meeting, Sprint Review, Tech Debt, Code Review, Pair Programming, Whiteboard Interview, Coffee Mug, Mechanical Keyboard, Dual Monitor
- **Products & Brands**: GitHub, AWS Bill, Jira Ticket, Slack Notification, VS Code, Chrome DevTools, Stack Overflow, npm, ChatGPT
- **Errors & Frustration**: 404 Not Found, Blue Screen of Death, Infinite Loop, Memory Leak, Spaghetti Code, Dependency Hell, Segfault

### Casual Deck (200+ words)
General knowledge categories:
- **Animals**: Penguin, Octopus, Kangaroo, Butterfly, Dolphin, Chameleon, Flamingo, Hedgehog
- **Food & Drink**: Pizza, Sushi, Taco, Espresso, Pancake, Avocado, Burrito, Popcorn
- **Movies & Pop Culture**: Lightsaber, Hogwarts, Infinity Gauntlet, DeLorean, Dragon, Pirate Ship
- **Office Life**: Water Cooler, Sticky Note, Whiteboard, Swivel Chair, Deadline, Lunch Break
- **Everyday Objects**: Umbrella, Headphones, Backpack, Skateboard, Telescope, Toaster

---

## Real-Time Architecture (Supabase Broadcast)

### Channel: `arcade:skribbl:${roomId}`

### Broadcast Events:

| Event | Sender | Payload | Purpose |
|-------|--------|---------|---------|
| `game:start` | Host | `{ rounds, deck, playerOrder }` | Game begins |
| `round:start` | Host | `{ artistId, wordLength }` | New round starts |
| `word:chosen` | Artist | `{ wordLength, hintPositions }` | Artist picked a word |
| `draw:stroke` | Artist | `{ points: [x,y][], color, size, tool }` | Single brush stroke (array of points) |
| `draw:clear` | Artist | `{}` | Canvas cleared |
| `draw:undo` | Artist | `{}` | Last stroke undone |
| `chat:message` | Guesser | `{ text, playerId, displayName }` | Chat message (server validates guess) |
| `guess:correct` | Host | `{ playerId, displayName, points, position }` | Someone guessed correctly |
| `hint:reveal` | Host | `{ positions: number[] }` | Reveal letters at given positions |
| `round:end` | Host | `{ word, scores }` | Round over, reveal word |
| `game:end` | Host | `{ finalScores, podium }` | Game complete |

### Drawing Data Optimization
- Do NOT broadcast individual `mousemove` events (too many messages).
- Collect points into stroke batches: accumulate `[x, y]` pairs during a single pointer-down-to-pointer-up stroke, then broadcast the entire stroke as one message.
- Each stroke is: `{ points: [x,y][], color: string, size: number, tool: 'brush' | 'eraser' }`.
- The receiving canvas replays the stroke by drawing lines between consecutive points.

### Host Authority Model
- The room creator acts as the "host" (game logic authority).
- The host is the only one who knows the correct word. When a guesser's chat message matches the word, the host broadcasts `guess:correct`.
- This prevents cheating by inspecting broadcast messages (the word is never broadcast — only the host has it).

---

## Technical Requirements

### Component Structure
```
src/components/arcade/DevSkribbl/
├── DevSkribbl.tsx            # Root: lobby → gameplay → results (state machine)
├── DrawingCanvas.tsx         # Canvas2D: drawing (artist mode) and spectating (guesser mode)
├── ChatPanel.tsx             # Chat message list + guess input
├── ToolBar.tsx               # Artist's brush size, color palette, eraser, clear, undo
├── WordPicker.tsx            # Artist's 3-word selection modal
├── ScoreBoard.tsx            # Live score sidebar
├── HintDisplay.tsx           # Underscore row with progressive letter reveals
├── word-decks/
│   ├── tech.ts               # 200+ tech words
│   └── casual.ts             # 200+ casual words
└── HostEngine.ts             # Game flow logic: round management, scoring, hint timers
```

### Canvas Drawing (`DrawingCanvas.tsx`)
- **Artist mode**: Full drawing interaction. Capture pointer events, collect stroke points, render locally, and broadcast completed strokes.
- **Guesser mode**: Receive stroke broadcasts and replay them on the local canvas.
- Use Canvas2D `lineTo` with `lineJoin: 'round'` and `lineCap: 'round'` for smooth strokes.
- Maintain a local stroke history array for undo functionality (pop the last stroke and redraw all remaining).
- Canvas resolution: Use `devicePixelRatio` for crisp rendering. Logical size: 600x400px (responsive scaling on mobile).

### Performance Mandates
- Drawing must feel instant — zero perceptible lag between pen movement and line rendering.
- Stroke broadcast batching keeps message count under 2–3 messages per second even during fast drawing.
- Canvas redraw (for undo or replay) of 50 strokes must complete in under 5ms.
- Total bundle under 45KB gzipped.
- No external canvas/drawing libraries.

### Styling
- Canvas: White background with thin border, sits in center of the page.
- Toolbar: Horizontal bar below the canvas. Color swatches as small circles, brush sizes as concentric circles.
- Chat panel: Right sidebar (desktop) or bottom drawer (mobile). Messages scroll up. Correct guesses highlighted in green.
- Scoreboard: Left sidebar (desktop) or collapsible top strip (mobile). Shows player name, avatar (first letter), score, and checkmark if they've guessed this round.
- Use DevScrolls design tokens for all surrounding UI chrome.

### Mobile Responsiveness
- On viewports < 768px: Stack layout vertically (canvas → toolbar → chat).
- Canvas scales to fill available width.
- Touch drawing works via pointer events (not mouse events).

---

## Astro Page Wrapper

`src/pages/arcade/dev-skribbl.astro`:
```astro
---
import ArcadeLayout from '../../layouts/ArcadeLayout.astro';
---
<ArcadeLayout
  title="Dev Skribbl — DevScrolls Arcade"
  description="Multiplayer draw & guess game for developers. Tech and Casual word decks. Invite your team via link — no sign-up required."
  gameName="Dev Skribbl"
>
  <DevSkribbl client:only="react" />
</ArcadeLayout>
```
