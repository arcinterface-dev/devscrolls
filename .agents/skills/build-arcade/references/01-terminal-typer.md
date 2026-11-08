---
name: build-terminal-typer
description: >
  Build the Terminal Typer solo game for DevScrolls Arcade (/arcade/terminal-typer/).
  A code-syntax speed typing test with language selection, live WPM tracking,
  accuracy heatmaps, and localStorage high scores. Procedural snippet generation
  ensures infinite replayability.
inputs:
  - trigger: User says "build terminal typer", "typing game", or "code typing test".
---

# Terminal Typer: Development Spec

## Game Identity
- **Route**: `/arcade/terminal-typer/`
- **Type**: Solo
- **Time**: ~2 minutes per round
- **Replay Guarantee**: Snippets are procedurally assembled from token pools, never repeated

---

## Core Gameplay Loop

1. **Language Select Screen**: Player picks a language: TypeScript, Python, Go, Rust, SQL, Bash.
2. **Mode Select**: Standard (full code lines), Symbol Sprint (heavy `=>`, `&&`, `{}`, `[]`, `::`), Regex Rush (regex patterns only).
3. **Countdown**: 3-2-1 countdown overlay.
4. **Typing Phase**:
   - A code snippet (3–5 lines, ~80–150 characters) is displayed in a monospace code block.
   - A cursor indicator shows the current expected character.
   - The player types into an invisible input field. Each keypress:
     - If correct: the character highlights green and the cursor advances.
     - If incorrect: the character highlights red, an error counter increments, and the cursor does NOT advance (the player must type the correct character to proceed).
   - A live WPM counter and accuracy percentage update every 500ms.
5. **Results Screen**: Shows final WPM, accuracy %, character error heatmap (which keys were most frequently wrong), personal best comparison, streak count.
6. **"Try Again"** and **"Share Result"** buttons (share copies an emoji matrix to clipboard).

---

## Procedural Snippet Generation (The Anti-Boredom Engine)

### Why This Never Gets Repetitive
Snippets are NOT stored as static strings. They are assembled at runtime from token pools:

```typescript
// Example token pool structure for TypeScript mode
const TS_TOKENS = {
  declarations: [
    'const {name} = ',
    'let {name}: {type} = ',
    'export const {name} = ',
    'type {Name} = ',
    'interface {Name} ',
  ],
  values: [
    'await fetch("{url}")',
    'new Map<{type}, {type}>()',
    '({params}) => {expression}',
    'Object.keys({name}).filter(k => k)',
    'JSON.parse(response.text())',
  ],
  structures: [
    '{ {key}: {value}, {key}: {value} }',
    '[...{name}, ...{other}]',
    '({a}, {b}) => ({ ...{a}, [{b}]: true })',
  ],
  // Variable name pools, type pools, URL pools, etc.
  names: ['data', 'result', 'config', 'user', 'items', 'response', 'cache', 'state'],
  types: ['string', 'number', 'boolean', 'Record<string, unknown>', 'Promise<void>'],
};
```

The generator randomly selects tokens, fills placeholders with random pool values, and concatenates 3–5 lines. This creates effectively infinite unique snippets.

### Language-Specific Pools:
- **TypeScript**: Arrow functions, generics, destructuring, type annotations, async/await.
- **Python**: f-strings, list comprehensions, decorators, type hints, with statements.
- **Go**: `:=`, `func`, `if err != nil`, struct literals, goroutine invocations.
- **Rust**: `let mut`, `match`, `impl`, `Result<T, E>`, lifetime annotations.
- **SQL**: SELECT with JOINs, WHERE clauses, GROUP BY, window functions, CTEs.
- **Bash**: Pipes, redirects, variable expansion, `$(command)`, conditionals.

---

## Technical Requirements

### Component Structure
```
src/components/arcade/TerminalTyper/
├── TerminalTyper.tsx        # Root component (state machine: menu → countdown → typing → results)
├── TypingEngine.tsx         # The core typing input + character-by-character rendering
├── SnippetGenerator.ts      # Procedural snippet assembly from token pools
├── WpmTracker.ts            # Live WPM calculation utility (characters / 5 / elapsed minutes)
├── ResultsPanel.tsx         # Post-game stats, heatmap, share button
└── token-pools/
    ├── typescript.ts
    ├── python.ts
    ├── go.ts
    ├── rust.ts
    ├── sql.ts
    └── bash.ts
```

### Performance Mandates
- **Input latency**: Keystroke-to-visual-feedback must be under 16ms (single `requestAnimationFrame` frame). Do NOT use React state updates for per-character rendering — use a `ref` to the DOM element and mutate `textContent` / `className` directly.
- **WPM calculation**: Standard formula: `(totalCorrectCharacters / 5) / elapsedMinutes`. Update display every 500ms via `setInterval`.
- **No external dependencies**: Pure React + vanilla TS. No typing test libraries.
- **Monospace font**: Use `var(--font-mono)` (JetBrains Mono) for all code display.

### Styling
- Dark terminal aesthetic within the code display area (even in light mode): `background: var(--blue-900)`, green/red character highlights.
- Surrounding UI uses standard DevScrolls design tokens.
- Subtle cursor blink animation using CSS `@keyframes`.

### Storage
- Use `storage.setHighScore('terminal-typer', wpm)` and `storage.incrementStreak('terminal-typer')` from shared utilities.
- Store per-language high scores: `storage.setHighScore('terminal-typer-typescript', wpm)`.

### Share Format
```
Terminal Typer ⌨️ | TypeScript
WPM: 87 | Accuracy: 96.2%
🟩🟩🟩🟩🟥🟩🟩🟩 (8 lines)
New personal best! 🔥 Streak: 5
devscrolls.dev/arcade/terminal-typer/
```

---

## Astro Page Wrapper

`src/pages/arcade/terminal-typer.astro`:
```astro
---
import ArcadeLayout from '../../layouts/ArcadeLayout.astro';
---
<ArcadeLayout
  title="Terminal Typer — DevScrolls Arcade"
  description="Code-syntax speed typing test for developers. Race against your WPM across TypeScript, Python, Go, Rust, SQL, and Bash."
  gameName="Terminal Typer"
>
  <TerminalTyper client:only="react" />
</ArcadeLayout>
```
