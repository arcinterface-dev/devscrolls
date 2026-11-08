---
name: build-terminal-duel
description: >
  Build the Terminal Duel multiplayer game for DevScrolls Arcade (/arcade/terminal-duel/).
  1v1 reflex showdown with randomized terminal alerts. Uses Supabase Realtime.
inputs:
  - trigger: User says "build terminal duel", "reflex game", "1v1 game", or "reaction time game".
---

# Terminal Duel: 1v1 Reflex Showdown — Development Spec

## Game Identity
- **Route**: `/arcade/terminal-duel/`
- **Type**: Multiplayer (exactly 2 players)
- **Time**: 2 minutes per duel
- **Replay Guarantee**: Randomized prompt sequences, variable timing gaps, and human reaction variance make every duel unique

---

## Core Gameplay Loop

### Setup
1. Standard `RoomLobby`: Player 1 creates room, shares link, Player 2 joins.
2. "Start Duel" button appears when exactly 2 players are connected.

### Duel Flow (Best of 5 Rounds)

Each round:

1. **Anticipation Phase** (1–4 seconds, randomized):
   - Both players see a simulated terminal screen with scrolling system logs (cosmetic — random log lines scrolling upward).
   - A warning banner appears: `⏳ ALERT INCOMING... STAND BY`.
   - The delay before the alert is randomized (1000ms to 4000ms) to prevent prediction.

2. **Alert Flash** (the trigger moment):
   - A bright, full-screen alert flashes with a specific action prompt. Examples:
     - `🚨 ABORT DEPLOY! Press [SPACE]`
     - `🔥 KILL PROCESS! Press [K]`
     - `💾 ROLLBACK NOW! Press [R]`
     - `⚡ SCALE UP! Press [S]`
     - `🛑 FIREWALL BLOCK! Press [F]`
     - `🔄 RESTART SERVICE! Press [ENTER]`
   - The required key is randomized each round (prevents muscle memory).

3. **Reaction Race**:
   - Both players must press the correct key as fast as possible.
   - The first player to press the correct key wins the round.
   - If a player presses the WRONG key, they automatically lose the round (penalty for mashing).
   - If a player presses ANY key BEFORE the alert appears (anticipation foul), they lose the round.
   - Reaction times are displayed: `Player 1: 287ms | Player 2: 342ms`.

4. **Round Result**: Point awarded to the winner. Tug-of-war meter shifts (visually: a bar with Player 1 on left, Player 2 on right, a marker slides toward the winner).

5. **Duel End**: First player to win 3 rounds wins the duel.

### Anti-Cheat: Timing Validation
- The host (Player 1) generates the alert timestamp and broadcasts it.
- Each player's reaction time is calculated as `keyPressTimestamp - alertTimestamp`.
- Since both players are on the same broadcast channel, the host validates:
  - Reaction time must be > 100ms (anything faster is physically impossible and indicates scripting).
  - Key must match the required key.

---

## Alert Prompt Pool (20+ Prompts)

Randomized each round from:

```typescript
const ALERTS = [
  { text: 'ABORT DEPLOY!', key: 'Space', icon: '🚨' },
  { text: 'KILL PROCESS!', key: 'k', icon: '🔥' },
  { text: 'ROLLBACK NOW!', key: 'r', icon: '💾' },
  { text: 'SCALE UP!', key: 's', icon: '⚡' },
  { text: 'FIREWALL BLOCK!', key: 'f', icon: '🛑' },
  { text: 'RESTART SERVICE!', key: 'Enter', icon: '🔄' },
  { text: 'FLUSH CACHE!', key: 'c', icon: '🧹' },
  { text: 'PATCH SECURITY!', key: 'p', icon: '🔒' },
  { text: 'MERGE HOTFIX!', key: 'm', icon: '🔀' },
  { text: 'BACKUP DATABASE!', key: 'b', icon: '💿' },
  { text: 'ROTATE SECRETS!', key: 'x', icon: '🔑' },
  { text: 'DRAIN NODE!', key: 'd', icon: '🚰' },
  { text: 'ACKNOWLEDGE ALERT!', key: 'a', icon: '📟' },
  { text: 'ISOLATE NETWORK!', key: 'i', icon: '🌐' },
  { text: 'TRIGGER FAILOVER!', key: 't', icon: '🔃' },
  { text: 'REVOKE TOKEN!', key: 'v', icon: '🚫' },
  { text: 'OPEN INCIDENT!', key: 'o', icon: '📋' },
  { text: 'NOTIFY ON-CALL!', key: 'n', icon: '📱' },
  { text: 'WIPE LOGS!', key: 'w', icon: '🗑️' },
  { text: 'HALT PIPELINE!', key: 'h', icon: '⛔' },
];
```

---

## Real-Time Architecture (Supabase Broadcast)

### Channel: `arcade:duel:${roomId}`

### Broadcast Events:

| Event | Sender | Payload |
|-------|--------|---------|
| `duel:start` | Host | `{ bestOf: 5 }` |
| `round:prepare` | Host | `{ roundNumber, delay: randomMs }` |
| `round:alert` | Host | `{ alertText, requiredKey, icon, timestamp }` |
| `round:reaction` | Player | `{ playerId, key, timestamp, reactionMs }` |
| `round:result` | Host | `{ winnerId, p1ReactionMs, p2ReactionMs, foul?: string }` |
| `duel:end` | Host | `{ winnerId, score, reactions }` |

### Timing Synchronization
- The host broadcasts `round:alert` with a `timestamp` (using `Date.now()`).
- Each player calculates their own reaction time locally: `Date.now() - alertTimestamp`.
- Supabase broadcast latency (~50-100ms) is consistent for both players since they're on the same channel, so relative timing is fair even if absolute timestamps have minor offsets.

---

## Technical Requirements

### Component Structure
```
src/components/arcade/TerminalDuel/
├── TerminalDuel.tsx           # Root: lobby → duel → results
├── TerminalScreen.tsx         # Fake scrolling terminal log background
├── AlertFlash.tsx             # Full-screen alert with key prompt
├── TugOfWar.tsx               # Visual tug-of-war meter (5 segments)
├── ReactionDisplay.tsx        # Shows both players' reaction times after each round
├── DuelResults.tsx            # Winner celebration screen
└── alerts.ts                  # 20+ alert prompt definitions
```

### Terminal Screen Effect (`TerminalScreen.tsx`)
- CSS-only scrolling log effect:
  - A `<pre>` element with `overflow: hidden` and CSS `@keyframes scroll-up` animation.
  - Log content: randomly generated fake syslog lines like:
    ```
    [2026-10-27T15:32:01] INFO  api-gateway: health check passed (200 OK)
    [2026-10-27T15:32:02] WARN  db-primary: replication lag 450ms
    [2026-10-27T15:32:03] INFO  cache-01: eviction rate 12/s
    ```
  - New lines appended every 200ms for the "live system" illusion.
- When the alert fires, the terminal dims (opacity: 0.2) and the `AlertFlash` component overlays it.

### Alert Flash Animation (`AlertFlash.tsx`)
- Full-screen overlay: semi-transparent dark background.
- Center: Large icon + alert text + key indicator, all scaling in with a spring animation.
- Key indicator: Styled as a keyboard key cap (rounded border, slight 3D shadow): `[SPACE]`, `[K]`, `[R]`.
- Red/amber pulsing border glow to create urgency.
- After a player reacts: show both reaction times side by side with the faster one highlighted in green.

### Performance Mandates
- **Reaction time accuracy is critical**. Use `performance.now()` (not `Date.now()`) for local timing precision.
- Key event listener must be registered at the `document` level during the alert phase (not on a focused input element) to avoid missed keypresses.
- Alert rendering must complete within a single frame (no layout-triggering CSS during the alert — use `transform` and `opacity` only).
- Total bundle under 15KB gzipped (this is a very lightweight game).

### Styling
- Terminal background: `background: var(--blue-950)`, green monospace text (`color: #22c55e`), mimicking a classic terminal.
- Alert overlay: Dark with amber/red gradient border pulse.
- Key cap styling: Rounded rectangle with inset shadow to look like a physical keyboard key.
- Tug-of-war bar: 5 segments, center starts neutral. Segments fill with the winner's color (Player 1 = blue, Player 2 = red) as rounds are won.
- Winner screen: Player's name in large text with crown emoji, loser gets a "GG" message.

---

## Astro Page Wrapper

`src/pages/arcade/terminal-duel.astro`:
```astro
---
import ArcadeLayout from '../../layouts/ArcadeLayout.astro';
---
<ArcadeLayout
  title="Terminal Duel — DevScrolls Arcade"
  description="1v1 reflex showdown. React to randomized terminal alerts faster than your opponent. Best of 5 rounds."
  gameName="Terminal Duel"
>
  <TerminalDuel client:only="react" />
</ArcadeLayout>
```
