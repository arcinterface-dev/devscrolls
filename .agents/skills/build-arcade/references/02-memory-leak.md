---
name: build-memory-leak
description: >
  Build the Memory Leak solo game for DevScrolls Arcade (/arcade/memory-leak/).
  A chaos engineering survival simulation where players manage server nodes under
  escalating traffic pressure. Procedural simulation math ensures every run is unique.
inputs:
  - trigger: User says "build memory leak", "server game", or "chaos engineering game".
---

# Memory Leak: Chaos Engineering Simulator — Development Spec

## Game Identity
- **Route**: `/arcade/memory-leak/`
- **Type**: Solo (endless survival)
- **Time**: 3–5+ minutes (until all servers die)
- **Replay Guarantee**: All events (traffic spikes, memory leaks, process zombification) are driven by parameterized random simulation math — no two runs are alike

---

## Core Gameplay Loop

1. **Start**: Player oversees a cluster of 3 server nodes rendered as rectangular panels. Each node displays:
   - **CPU gauge** (0–100%, color gradient green → yellow → red).
   - **RAM gauge** (0–100%).
   - **Process list** (scrolling list of named processes with individual memory consumption).
   - **Temperature indicator** (visual heat glow effect on the node border).

2. **Simulation Tick** (every 500ms):
   - Incoming request traffic is distributed across nodes (round-robin with random spikes).
   - Each process on each node has a probability of becoming a "zombie" (stops serving requests, keeps consuming RAM).
   - RAM usage creeps upward. CPU follows request volume.
   - Random events trigger every 10–30 seconds:
     - **Memory Leak**: One process starts leaking 2–5% RAM per tick.
     - **DDoS Spike**: Request volume triples for 5 seconds.
     - **Disk Full Warning**: One node's disk fills; new logs can't write.
     - **Cascading Failure**: If one node hits 100% RAM, its traffic redistributes to remaining nodes.

3. **Player Actions** (click/tap interactions):
   - **Kill Process**: Click a zombie or leaking process to terminate it (frees its RAM instantly, but the node briefly loses throughput).
   - **Restart Node**: Hold-click a node for 2 seconds to reboot it (clears all processes, but the node is offline for 3 seconds and traffic redistributes).
   - **Scale Up**: Click a "+" button to add a temporary 4th node (available once per 60 seconds; it auto-terminates after 30 seconds).
   - **Flush Cache**: Quickly dumps 20% RAM from a node but increases CPU by 15% for 5 seconds.

4. **Game Over**: When ALL nodes simultaneously hit 100% RAM or CPU. The game tracks:
   - **Uptime** (total seconds survived).
   - **Requests Served** (total successful requests handled).
   - **Processes Killed** (total zombies terminated).
   - **Peak concurrent traffic**.

5. **Difficulty Escalation**: Every 30 seconds, the simulation parameters ramp:
   - Base traffic rate increases by 10%.
   - Zombie spawn probability increases by 5%.
   - Memory leak rate increases by 1%/tick.
   - New event types unlock at time thresholds (e.g., "Cascading Failure" only appears after 60s).

---

## Technical Requirements

### Component Structure
```
src/components/arcade/MemoryLeak/
├── MemoryLeak.tsx           # Root component (intro screen → simulation → game over)
├── ServerCluster.tsx        # Renders the grid of server node panels
├── ServerNode.tsx           # Individual node: gauges, process list, action buttons
├── SimulationEngine.ts      # Pure TypeScript class: tick logic, event generation, state mutation
├── GaugeBar.tsx             # Reusable animated gauge bar (CPU, RAM)
├── EventLog.tsx             # Scrolling event log at the bottom ("⚠️ Node 2: Memory leak detected in worker-7")
└── constants.ts             # Tuning parameters: tick rate, escalation curves, event probabilities
```

### Simulation Engine Design (`SimulationEngine.ts`)
This is the core class. It must be a **pure state machine** with no React dependencies so it can run deterministically:

```typescript
interface ServerState {
  id: number;
  cpu: number;        // 0-100
  ram: number;        // 0-100
  disk: number;       // 0-100
  temp: number;       // 0-100 (visual only)
  processes: ProcessState[];
  isOnline: boolean;
  rebootTimer: number; // seconds remaining if rebooting
}

interface ProcessState {
  pid: number;
  name: string;       // e.g., "api-worker", "db-conn-pool", "log-rotate"
  ramUsage: number;   // 0-100 (percentage of node RAM this process uses)
  isZombie: boolean;
  isLeaking: boolean;
  leakRate: number;   // RAM %/tick added if leaking
}

interface SimState {
  servers: ServerState[];
  tick: number;
  uptime: number;
  requestsServed: number;
  processesKilled: number;
  scaleUpCooldown: number;
  events: EventLogEntry[];
  isGameOver: boolean;
  difficulty: number; // escalation multiplier
}
```

- **Tick function**: `SimulationEngine.tick(actions: PlayerAction[]): SimState` — pure function, takes current state + any player actions queued this tick, returns new state.
- **Random seeding**: Use a lightweight PRNG (xoshiro128**) seeded from `Date.now()` so runs are unique but deterministic within a session.
- **Process name pool**: Randomly name processes from a pool: `['api-worker', 'db-conn-pool', 'cache-warmer', 'log-rotate', 'cron-scheduler', 'auth-service', 'webhook-dispatcher', 'search-indexer', 'session-gc', 'metrics-agent']`.

### Performance Mandates
- **Canvas2D rendering** for the gauges and heat effects — do NOT use DOM elements with CSS transitions for 60fps gauge animations.
- **requestAnimationFrame** render loop decoupled from simulation tick (simulation runs at fixed 500ms intervals via `setInterval`; rendering interpolates smoothly at 60fps).
- Total bundle size for this game must be under 40KB gzipped.
- No external charting or gauge libraries.

### Styling
- Dark "ops dashboard" aesthetic: `background: var(--blue-950)`, server nodes as bordered cards with subtle glow effects based on temperature.
- Gauge colors: green (`#22c55e`) at 0–50%, yellow (`#eab308`) at 50–80%, red (`#ef4444`) at 80–100%.
- Pulsing red border animation when a node exceeds 90% on any metric.
- Process list uses `var(--font-mono)` with zombie processes displayed in dim red with strikethrough.

### Storage & Sharing
- Use `storage.setHighScore('memory-leak', uptime)` from shared utilities.
- Share format:
```
Memory Leak 🔥 | Chaos Survived
Uptime: 3m 42s | Requests: 12,847
Zombies Killed: 23 | Peak Traffic: 847 req/s
devscrolls.dev/arcade/memory-leak/
```

---

## Astro Page Wrapper

`src/pages/arcade/memory-leak.astro`:
```astro
---
import ArcadeLayout from '../../layouts/ArcadeLayout.astro';
---
<ArcadeLayout
  title="Memory Leak — DevScrolls Arcade"
  description="Chaos engineering survival sim. Manage server nodes under escalating traffic, kill zombie processes, and prevent total meltdown."
  gameName="Memory Leak"
>
  <MemoryLeak client:only="react" />
</ArcadeLayout>
```
