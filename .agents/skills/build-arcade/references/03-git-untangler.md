---
name: build-git-untangler
description: >
  Build the Git Untangler solo puzzle for DevScrolls Arcade (/arcade/git-untangler/).
  A graph theory puzzle where players drag commit nodes to untangle overlapping branch
  lines. Levels are procedurally generated using planar graph algorithms.
inputs:
  - trigger: User says "build git untangler", "git puzzle", or "graph untangle game".
---

# Git Untangler: Development Spec

## Game Identity
- **Route**: `/arcade/git-untangler/`
- **Type**: Solo (progressive levels)
- **Time**: 2–5 minutes per level
- **Replay Guarantee**: Every level is generated algorithmically from planar graph embeddings — there are no pre-built puzzles to memorize

---

## Core Gameplay Loop

1. **Level Start**: A tangled commit graph appears on a Canvas2D surface. The graph consists of:
   - **Nodes**: Colored circles representing commits. Each has a short label (hash-like: `a3f`, `b7c`, `d12`).
   - **Edges**: Lines connecting commits (parent-child relationships in a Git DAG). Edges that cross over each other are highlighted in red.
   - **Branch labels**: Small colored tags at leaf nodes (`main`, `feature/auth`, `hotfix/db`).

2. **Objective**: Drag nodes to new positions until **zero edge crossings remain** (all red lines turn green).

3. **Interaction**:
   - **Click + drag** a node: the node follows the cursor/finger. All connected edges redraw in real time.
   - After each drag release, the engine recounts edge crossings and updates the crossing counter.
   - When crossings reach 0: level complete with a celebration animation.

4. **Scoring**:
   - **Moves** (number of drag operations).
   - **Time** (seconds to solve).
   - Star rating: 3 stars (under par moves), 2 stars (within 1.5x par), 1 star (completed at all).
   - Par moves are calculated by the generator based on graph complexity.

5. **Level Progression**:
   - Level 1: 5 nodes, 5 edges, 2–3 crossings.
   - Level 2: 7 nodes, 8 edges, 4–6 crossings.
   - Level 3: 10 nodes, 12 edges, 6–10 crossings.
   - Level N: `3 + N*2` nodes, `3 + N*3` edges (capped at 25 nodes for mobile usability).
   - Levels are NOT stored — they are generated fresh on each play using the seed `level_number + Date.now()`.

---

## Procedural Level Generation Algorithm

### Step 1: Generate a Valid Planar Graph
Start with a planar embedding (a graph that CAN be drawn without crossings):
- Use a random spanning tree of N nodes.
- Add M-N additional edges, checking planarity after each addition (Kuratowski's theorem shortcut: for small graphs <25 nodes, trial-and-error works within ms).

### Step 2: Scramble Node Positions
- Place all nodes in a deliberately tangled layout by:
  - Randomly assigning positions within the canvas bounds.
  - Verifying the scrambled layout has at least `minCrossings` edge crossings (re-randomize if too few crossings exist).

### Step 3: Calculate Par
- Par = `Math.ceil(crossings * 0.6)` (approximate minimum moves to untangle).

### Edge Crossing Detection
Use the standard segment intersection test:
```
Two segments (p1,p2) and (p3,p4) intersect iff:
  d1 = direction(p3, p4, p1)
  d2 = direction(p3, p4, p2)
  d3 = direction(p1, p2, p3)
  d4 = direction(p1, p2, p4)
  if ((d1 * d2 < 0) && (d3 * d4 < 0)) → they cross
```
This runs in O(E²) per check. For E≤75 edges, this is well under 1ms.

---

## Technical Requirements

### Component Structure
```
src/components/arcade/GitUntangler/
├── GitUntangler.tsx          # Root: level select → gameplay → level complete
├── GraphCanvas.tsx           # Canvas2D rendering of nodes and edges with drag interaction
├── LevelGenerator.ts         # Procedural graph + scramble + par calculation
├── IntersectionEngine.ts     # Edge crossing detection math
└── constants.ts              # Level curve parameters, colors, node sizes
```

### Canvas Rendering (`GraphCanvas.tsx`)
- Use a single `<canvas>` element with `Canvas2D` context.
- Render loop via `requestAnimationFrame`:
  1. Clear canvas.
  2. Draw all edges: green if uncrossed, red if crossed, with rounded line caps.
  3. Draw all nodes: filled circles with drop shadows. Dragged node gets a glow effect.
  4. Draw labels (commit hashes inside nodes, branch names near leaf nodes).
- Touch and mouse support:
  - `onPointerDown`: Hit-test nodes (check if pointer position is within node radius). If hit, enter drag mode.
  - `onPointerMove`: Update dragged node position. Recount crossings every frame.
  - `onPointerUp`: Release drag. Final crossing recount.

### Performance Mandates
- **Canvas2D only** — no SVG, no DOM per-node.
- Crossing recount must complete in under 2ms per frame for smooth 60fps drag.
- Use `devicePixelRatio` for crisp rendering on Retina/HiDPI screens.
- Total bundle under 25KB gzipped.

### Styling
- Canvas background: `var(--surface-sunken)`.
- Nodes: Circular, 24px radius, filled with branch-themed colors (blue for `main`, green for `feature/*`, orange for `hotfix/*`).
- Crossed edges: Dashed red line with 50% opacity.
- Uncrossed edges: Solid green line.
- Level complete: Confetti-like particle burst (8–12 small circles expanding outward then fading — hand-rolled, no library).

### Storage
- `storage.setHighScore('git-untangler', highestLevelReached)`.
- Store best star-ratings per level in localStorage: `ds_arcade_git-untangler_level_N_stars`.

### Share Format
```
Git Untangler 🌿 | Level 7 Complete
⭐⭐⭐ | 12 moves (par: 15) | 34s
devscrolls.dev/arcade/git-untangler/
```

---

## Astro Page Wrapper

`src/pages/arcade/git-untangler.astro`:
```astro
---
import ArcadeLayout from '../../layouts/ArcadeLayout.astro';
---
<ArcadeLayout
  title="Git Untangler — DevScrolls Arcade"
  description="Drag commit nodes to untangle crossing branches. Procedurally generated graph puzzles that never repeat."
  gameName="Git Untangler"
>
  <GitUntangler client:only="react" />
</ArcadeLayout>
```
