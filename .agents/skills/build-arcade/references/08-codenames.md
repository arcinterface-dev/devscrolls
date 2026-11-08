---
name: build-codenames
description: >
  Build the CodeNames multiplayer game for DevScrolls Arcade (/arcade/codenames/).
  Team-based word association on a 5x5 grid. Uses Supabase Realtime for room management.
inputs:
  - trigger: User says "build codenames", "word grid game", or "team word game".
---

# CodeNames: Development Spec

## Game Identity
- **Route**: `/arcade/codenames/`
- **Type**: Multiplayer (4–10 players, 2 teams)
- **Time**: 10–15 minutes per game
- **Replay Guarantee**: 400+ word pool generates ~50 billion unique 25-word boards; team composition and clue-giving vary infinitely

---

## Core Gameplay Loop

### Setup
1. Players join via room link. Standard `RoomLobby` handles joining.
2. Players divide into **Team Red** and **Team Blue** by clicking team buttons.
3. Each team selects one **Spymaster** (the clue giver). Remaining players are **Operatives** (guessers).
4. Room creator clicks "Start Game" when teams are balanced (minimum 2 per team).

### Board Generation
- 25 words are drawn randomly from a 400+ word pool and placed on a 5x5 grid.
- A secret **Key Card** is generated (visible ONLY to both Spymasters):
  - 9 cards belong to the starting team (e.g., Red).
  - 8 cards belong to the other team (Blue).
  - 7 cards are neutral (gray — no team).
  - 1 card is the **Assassin** (black — instant loss if guessed).
- The starting team (with 9 cards) goes first.

### Turn Flow
1. **Spymaster's Turn**: The active team's Spymaster types:
   - A **one-word clue** (must be a single word, not on the board).
   - A **number** (how many board words relate to this clue).
   - Example: `"Container: 3"` (hinting at Docker, Ship, and Box).
2. **Operatives Discuss & Guess**: The operatives discuss (in team chat) and click board cards one at a time.
   - If they click their own team's card → it's revealed in their team color. They may continue guessing (up to `number + 1` guesses).
   - If they click a neutral card → it's revealed as gray. Turn ends.
   - If they click the opposing team's card → it's revealed in the opponent's color. Turn ends. (This helps the other team!)
   - If they click the **Assassin** → **INSTANT GAME OVER. The clicking team loses immediately.**
   - Operatives can also choose to "End Turn" voluntarily.
3. Turns alternate between teams.

### Win Condition
- A team wins when ALL of their cards have been revealed (guessed correctly by their operatives).
- A team instantly LOSES if their operatives click the Assassin card.

---

## Word Pool (400+ Words)

### Composition
Mix of tech, general knowledge, and abstract words to create interesting multi-meaning clue opportunities:

**Tech-Adjacent** (these create fun "is it tech or everyday?" ambiguity):
- Server, Cloud, Docker, Container, Pipeline, Branch, Fork, Merge, Patch, Bug, Crash, Firewall, Cookie, Cache, Shell, Terminal, Root, Port, Bridge, Stack, Queue, Thread, Lock, Key, Token, Scroll, Node, Socket, Router, Switch, Core, Link, Domain, Host, Protocol, Byte, Pixel, Stream, Block, Chain, Kernel, Matrix, Grid, Spark, Cluster, Beacon, Proxy, Vault, Shard

**General / Double-Meaning**:
- Apple, Amazon, Java, Python, Swift, Ruby, Rust, Go, Eclipse, Spring, Mars, Mercury, Phoenix, Jaguar, Falcon, Hawk, Tiger, Bear, Wolf, Eagle, Anchor, Crown, Diamond, Rocket, Satellite, Orbit, Comet, Shadow, Ghost, Spirit, Mirror, Crystal, Compass, Lighthouse, Glacier, Canyon, Desert, Ocean, Volcano, Thunder, Blizzard, Tornado, Monsoon, Reef, Coral

**Everyday**:
- Piano, Bicycle, Umbrella, Telescope, Candle, Passport, Blanket, Elevator, Fountain, Garden, Library, Museum, Circus, Theater, Lantern, Anchor, Compass, Whistle, Hammer, Ladder, Basket, Pillow, Curtain, Staircase, Newspaper

*(Continue to 400+ words. Store in a single `words.ts` file as a flat string array.)*

---

## Real-Time Architecture (Supabase Broadcast)

### Channel: `arcade:codenames:${roomId}`

### Broadcast Events:

| Event | Sender | Payload |
|-------|--------|---------|
| `team:join` | Player | `{ playerId, team: 'red' \| 'blue', role: 'spymaster' \| 'operative' }` |
| `game:start` | Host | `{ board: string[][], keyCard: KeyCard, startingTeam }` |
| `clue:give` | Spymaster | `{ word: string, number: number, team }` |
| `card:reveal` | Host | `{ position: [row, col], cardType: 'red' \| 'blue' \| 'neutral' \| 'assassin' }` |
| `turn:end` | Host | `{ nextTeam }` |
| `game:over` | Host | `{ winner: 'red' \| 'blue', reason: 'all_found' \| 'assassin' }` |
| `chat:team` | Player | `{ text, team }` (team-scoped chat for operative discussion) |

### Key Card Security
- The Key Card is sent to Spymasters only. Since Supabase broadcast goes to all subscribers, the host can:
  - Send `keyCard` in the `game:start` payload, and the client-side code only renders it for players whose role is `spymaster`.
  - For a casual party game, this is sufficient. Operatives would have to inspect WebSocket frames to cheat — acceptable trade-off for zero-backend simplicity.

---

## Technical Requirements

### Component Structure
```
src/components/arcade/CodeNames/
├── CodeNames.tsx              # Root: lobby (team selection) → gameplay → results
├── TeamSelector.tsx           # Team Red/Blue join buttons + role (Spymaster/Operative)
├── GameBoard.tsx              # 5x5 card grid
├── CardTile.tsx               # Individual card: word, unrevealed/revealed state, team color
├── SpymasterView.tsx          # Key Card overlay visible only to Spymasters
├── ClueInput.tsx              # Spymaster clue + number input
├── ClueDisplay.tsx            # Shows active clue to operatives
├── TeamChat.tsx               # Team-scoped discussion chat
├── GuessCounter.tsx           # "Guesses remaining: 2/3"
└── words.ts                   # 400+ word pool
```

### Board & Card Rendering (`GameBoard.tsx`)
- 5x5 CSS Grid, responsive.
- Card states:
  - **Unrevealed**: Cream/beige background, word visible, clickable by active team's operatives.
  - **Red team revealed**: Red background with white text.
  - **Blue team revealed**: Blue background with white text.
  - **Neutral revealed**: Gray background, dimmed text.
  - **Assassin revealed**: Black background, skull icon, dramatic red border flash.
- Card flip animation: CSS 3D transform `rotateY(180deg)` over 300ms when revealed.

### Spymaster Key Card Overlay (`SpymasterView.tsx`)
- Semi-transparent color overlay on each card showing the true assignment.
- Red cards: faint red tint. Blue cards: faint blue tint. Neutral: no tint. Assassin: dark with X mark.
- This overlay is visible simultaneously with the game board (not a separate view).

### Performance Mandates
- Minimal real-time data. Card reveals are infrequent events (one every 10–30 seconds). No performance concerns.
- Focus on clean, accessible, responsive UI.
- Total bundle under 25KB gzipped.

### Styling
- Board: Cream-colored cards on dark surface. Cards have subtle depth shadow.
- Team indicators: Red team uses `#ef4444`, Blue team uses `#3b82f6`.
- Assassin card (when revealed): Black with red skull icon, pulsing glow.
- Clue display: Large bold text centered above the board: `"Container: 3"`.
- Team chat: Collapsible sidebar, color-coded to team.

---

## Astro Page Wrapper

`src/pages/arcade/codenames.astro`:
```astro
---
import ArcadeLayout from '../../layouts/ArcadeLayout.astro';
---
<ArcadeLayout
  title="CodeNames — DevScrolls Arcade"
  description="Team-based word association game. Give one-word clues to help your team find their cards on the 5x5 grid. Avoid the Assassin!"
  gameName="CodeNames"
>
  <CodeNames client:only="react" />
</ArcadeLayout>
```
