---
name: build-who-broke-prod
description: >
  Build the "Who Broke Production?" multiplayer social deduction game for DevScrolls
  Arcade (/arcade/who-broke-prod/). Spyfall-style game where everyone knows the incident
  except the Rogue Deployer. Uses Supabase Realtime for room management.
inputs:
  - trigger: User says "build who broke prod", "social deduction", "imposter game", or "spyfall".
---

# Who Broke Production?: Social Deduction — Development Spec

## Game Identity
- **Route**: `/arcade/who-broke-prod/`
- **Type**: Multiplayer (3–10 players)
- **Time**: 5–10 minutes per round
- **Replay Guarantee**: Player-driven social deduction — human behavior makes every game unique; 80+ incident scenarios from a procedural pool

---

## Core Gameplay Loop

### Setup Phase
1. Players join via shared room link. Standard `RoomLobby` component handles joining.
2. Room creator sets round count (1/3/5) and clicks "Start Game".

### Round Start
1. **Role Assignment**: The host randomly selects ONE player as the **Rogue Deployer**. All other players are **Engineers**.
2. **Incident Distribution**:
   - Every Engineer's screen shows the same incident card: a technical scenario with a title, system affected, root cause, and severity.
     ```
     ━━━ INCIDENT REPORT #4721 ━━━
     Title: Database Connection Pool Exhausted
     System: User Authentication Service
     Root Cause: Unindexed query on users table
     Severity: P1 — Complete auth outage
     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     ```
   - The Rogue Deployer sees ONLY:
     ```
     ━━━ YOU ARE THE ROGUE DEPLOYER ━━━
     You don't know what the incident is.
     Blend in. Don't get caught.
     If you figure out the incident, you win!
     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     ```

### Discussion Phase (3 minutes)
1. A turn order is established (random). Each player takes a turn asking ONE question to any other player.
2. Questions and answers are typed in a shared chat visible to everyone.
3. **Engineer Strategy**: Ask questions that someone who knows the incident can answer, but vague enough that the Rogue Deployer can't deduce the incident.
   - Example: "Was the fix a config change or a code deploy?" (An engineer who knows it's a DB issue would say "code deploy" — the Rogue Deployer must bluff.)
4. **Rogue Deployer Strategy**: Give plausible, generic answers that don't reveal ignorance. Try to figure out the incident from the questions being asked.

### Voting Phase
1. After discussion, ALL players simultaneously vote for who they think the Rogue Deployer is.
2. Each player can also choose "Skip Vote".
3. Votes are revealed simultaneously (no sequential influence).

### Resolution
- **Engineers win** if the majority votes for the Rogue Deployer.
- **Rogue Deployer wins** if:
  - They are NOT voted out (someone else gets more votes or "Skip" wins), OR
  - Before votes are revealed, the Rogue Deployer can press "I KNOW THE INCIDENT" and type their guess. If the guess matches the incident title (fuzzy match), they win regardless of votes.

### Scoring
- Engineers who voted correctly: +10 points each.
- Rogue Deployer who survived: +15 points.
- Rogue Deployer who guessed the incident: +25 points.

---

## Incident Scenario Pool (80+ Scenarios)

### Why This Never Gets Repetitive
Each round draws from a large pool of realistic production incidents. These are NOT re-used within a session. Categories:

**Database & Storage**:
- Connection pool exhausted from unindexed query
- Deadlock from concurrent batch updates
- Replication lag causing stale reads
- Schema migration locking writes for 4 minutes
- Redis OOM from unbounded session cache

**Networking & Infrastructure**:
- DNS propagation failure after domain migration
- SSL certificate expired on payment gateway
- Load balancer health check misconfigured
- CDN cache poisoning serving stale assets
- VPN tunnel flap causing intermittent API failures

**Application & Code**:
- Memory leak from unclosed WebSocket connections
- Race condition in distributed lock acquisition
- Infinite retry loop overwhelming downstream service
- Regex catastrophic backtracking on user input
- Timezone bug causing double billing on DST boundary

**Security & Access**:
- API key leaked in public GitHub commit
- CORS misconfiguration allowing cross-origin data exfiltration
- JWT validation skipped on one endpoint
- Rate limiter bypass via header spoofing
- Admin panel exposed without authentication

**DevOps & Deployment**:
- Canary deployment with backward-incompatible schema change
- Rollback failed because migration was irreversible
- Docker image tagged `latest` pulled stale build
- Kubernetes pod OOMKilled due to missing resource limits
- GitHub Actions secret rotated but not updated in staging

Store these as a structured array:
```typescript
interface IncidentScenario {
  id: string;
  title: string;        // "Database Connection Pool Exhausted"
  system: string;       // "User Authentication Service"
  rootCause: string;    // "Unindexed query on users table during peak traffic"
  severity: string;     // "P1 — Complete auth outage"
  category: string;     // "database" | "network" | "application" | "security" | "devops"
  keywords: string[];   // For fuzzy matching the Rogue Deployer's guess
}
```

---

## Real-Time Architecture (Supabase Broadcast)

### Channel: `arcade:whobroke:${roomId}`

### Broadcast Events:

| Event | Sender | Payload | Purpose |
|-------|--------|---------|---------|
| `game:start` | Host | `{ rounds, playerOrder }` | Game begins |
| `round:assign` | Host | `{ roles: { [playerId]: 'engineer' \| 'rogue' }, incident?: IncidentScenario }` | Role + incident sent to each player (incident is null for the rogue) |
| `turn:active` | Host | `{ activePlayerId, targetPlayerId }` | Whose turn it is to ask a question |
| `chat:question` | Asker | `{ text, askerId, targetId }` | Question text |
| `chat:answer` | Target | `{ text, answererId }` | Answer text |
| `vote:start` | Host | `{}` | Voting phase begins |
| `vote:cast` | Player | `{ votedFor: playerId }` | Individual vote (sent only to host) |
| `vote:reveal` | Host | `{ votes: { [voter]: votedFor }, eliminated: playerId \| null }` | All votes revealed |
| `rogue:guess` | Rogue | `{ guess: string }` | Rogue's incident guess |
| `round:result` | Host | `{ winner: 'engineers' \| 'rogue', rogueId, incident, scores }` | Round outcome |
| `game:end` | Host | `{ finalScores, podium }` | Game complete |

### Security: Private Role Distribution
- The host sends `round:assign` to each player individually (using Supabase broadcast with per-player filtering, or by encrypting the role payload per player).
- **Alternative simpler approach**: The host sends the incident to everyone, but the rogue's message intentionally omits the `incident` field. Since broadcast goes to everyone, use a simple convention: `if (myPlayerId === roles.rogue) → show "You are the Rogue Deployer"`, else `→ show incident card`. The incident is visible in the broadcast payload in DevTools, but this is a casual party game — perfect security is not required; playability matters more.

---

## Technical Requirements

### Component Structure
```
src/components/arcade/WhoBrokeProd/
├── WhoBrokeProd.tsx          # Root: lobby → role reveal → discussion → voting → results
├── IncidentCard.tsx          # Styled incident display (for engineers)
├── RogueCard.tsx             # "You are the Rogue Deployer" display
├── DiscussionChat.tsx        # Turn-based Q&A chat interface
├── VotingPanel.tsx           # Grid of player avatars to vote on
├── RogueGuessModal.tsx       # Modal for the rogue to type their incident guess
├── RoundResults.tsx          # Who was the rogue, what was the incident, scores
├── FuzzyMatcher.ts           # Simple fuzzy string matching for rogue guess validation
└── scenarios.ts              # 80+ incident scenarios array
```

### Fuzzy Matching for Rogue Guess (`FuzzyMatcher.ts`)
The rogue's guess doesn't need to be exact. Use a simple approach:
```typescript
function fuzzyMatch(guess: string, incident: IncidentScenario): boolean {
  const normalized = guess.toLowerCase().trim();
  // Check if guess contains 2+ keywords from the incident
  const matchedKeywords = incident.keywords.filter(kw =>
    normalized.includes(kw.toLowerCase())
  );
  return matchedKeywords.length >= 2;
}
```

### Performance Mandates
- This game is chat-heavy, not graphics-heavy. Focus on clean, responsive UI rather than canvas performance.
- Chat messages must appear within 200ms of being sent (Supabase Realtime typical latency).
- Total bundle under 30KB gzipped.

### Styling
- Incident card: Dark terminal-style card with monospace font, bordered with severity-colored accent (P1 = red, P2 = orange, P3 = yellow).
- Rogue card: Ominous red-black gradient with skull emoji or warning icon.
- Discussion chat: Clean message bubbles. Active turn player highlighted with a glowing border.
- Voting: Player avatars in a grid. Click to vote. Selected vote has amber ring. 3-2-1 countdown before reveal.
- Results: Dramatic reveal animation — flip card showing who the rogue was.

---

## Astro Page Wrapper

`src/pages/arcade/who-broke-prod.astro`:
```astro
---
import ArcadeLayout from '../../layouts/ArcadeLayout.astro';
---
<ArcadeLayout
  title="Who Broke Production? — DevScrolls Arcade"
  description="Social deduction for engineering teams. Everyone knows the incident except the Rogue Deployer. Can you vote them out?"
  gameName="Who Broke Production?"
>
  <WhoBrokeProd client:only="react" />
</ArcadeLayout>
```
