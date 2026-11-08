---
name: build-regex-golf
description: >
  Build the Regex Golf solo game for DevScrolls Arcade (/arcade/regex-golf/).
  A dynamic pattern matching challenge where players write the shortest regex
  to match green strings and reject red ones. Procedural test set generation.
inputs:
  - trigger: User says "build regex golf", "regex game", or "pattern matching game".
---

# Regex Golf: Development Spec

## Game Identity
- **Route**: `/arcade/regex-golf/`
- **Type**: Solo (scored challenge rounds)
- **Time**: 3–5 minutes per round
- **Replay Guarantee**: Test sets are procedurally generated from parameterized string templates with randomized values — no memorizable static answers

---

## Core Gameplay Loop

1. **Round Start**: The screen splits into two columns:
   - **Left (Green / MATCH)**: 5–8 strings that the player's regex MUST match.
   - **Right (Red / REJECT)**: 5–8 strings that the regex must NOT match.

2. **Input**: A single regex input field at the top. As the player types each character:
   - Every green string is tested against the regex in real time. Matched strings get a green checkmark; unmatched get a gray X.
   - Every red string is tested similarly. If the regex accidentally matches a red string, it gets a red warning highlight.
   - A live score counter shows: `Matched: 5/7 | Rejected: 6/8 | Length: 14`.

3. **Completion**: The round is solved when ALL green strings match AND zero red strings match.

4. **Scoring**: `score = 100 - (regexLength * 2) + timeBonus`. Shorter regex = higher score. Par length is shown for reference.

5. **Difficulty Tiers**:
   - **Easy**: Strings differ by obvious substrings (e.g., greens all contain "http", reds don't).
   - **Medium**: Strings share common prefixes/suffixes; requires character classes or anchors.
   - **Hard**: Strings are adversarially similar; requires lookaheads, backreferences, or creative alternation.

---

## Procedural Test Set Generation

### Why This Never Gets Repetitive
Each round generates a fresh pair of (MATCH, REJECT) lists using this process:

1. **Pick a pattern archetype** from a pool:
   - Emails vs. non-emails
   - Valid IP addresses vs. malformed ones
   - camelCase vs. snake_case identifiers
   - Semantic versioning (1.2.3) vs. date strings (2024-01-15)
   - Hex colors (#fff, #aabbcc) vs. random hex strings
   - URLs with specific TLDs vs. URLs with other TLDs
   - File paths (Unix vs. Windows)

2. **Generate MATCH strings**: Use a template engine with randomized values:
   ```typescript
   // Example: email archetype
   const names = ['alice', 'bob', 'dev42', 'jane.doe', 'support'];
   const domains = ['github.com', 'company.io', 'devscrolls.dev'];
   // produces: "alice@github.com", "dev42@company.io", etc.
   ```

3. **Generate REJECT strings**: Similar format but with deliberate violations:
   ```typescript
   // Missing @, double dots, invalid TLDs, spaces, etc.
   // "alice.github.com", "bob@@company", "jane doe@mail.c"
   ```

4. **Calculate par regex length**: The generator knows the simplest distinguishing regex and provides its length as the par (e.g., par: 8 characters for `/^[^@]+@\w+\.\w{2,}$/`).

### Pattern Archetype Pool (minimum 15 archetypes):
Create at least 15 archetype generators to ensure variety:
- Email validation
- IPv4 addresses
- Hex color codes
- Semantic versions
- Unix file paths
- URL schemes
- camelCase identifiers
- ISO date formats
- CSS selectors (class vs. ID)
- Phone number formats
- Variable names (valid vs. reserved words)
- License plate patterns
- MAC addresses
- SQL keywords vs. identifiers
- JSON key patterns

---

## Technical Requirements

### Component Structure
```
src/components/arcade/RegexGolf/
├── RegexGolf.tsx             # Root: difficulty select → gameplay → results
├── RegexInput.tsx            # The regex input field with live syntax highlighting
├── StringColumns.tsx         # Green/Red string list columns with real-time match indicators
├── TestSetGenerator.ts       # Procedural archetype-based test set generation
├── RegexTester.ts            # Safe regex execution with timeout protection
└── archetypes/
    ├── emails.ts
    ├── ipv4.ts
    ├── hex-colors.ts
    ├── semver.ts
    ├── file-paths.ts
    ├── urls.ts
    ├── identifiers.ts
    ├── dates.ts
    ├── css-selectors.ts
    ├── phone-numbers.ts
    ├── variables.ts
    ├── license-plates.ts
    ├── mac-addresses.ts
    ├── sql-keywords.ts
    └── json-keys.ts
```

### Safe Regex Execution (`RegexTester.ts`)
**Critical**: User-typed regex can cause catastrophic backtracking (ReDoS). Protect against this:

```typescript
export function safeTestRegex(pattern: string, testString: string, timeoutMs = 50): boolean | null {
  try {
    const regex = new RegExp(pattern);
    const start = performance.now();
    const result = regex.test(testString);
    if (performance.now() - start > timeoutMs) {
      return null; // Timeout — regex is too slow, show warning
    }
    return result;
  } catch {
    return null; // Invalid regex syntax
  }
}
```

- Show a yellow "⚠ Slow regex" warning if any test takes >50ms.
- Show a red "✗ Invalid regex" indicator if the constructor throws.

### Live Regex Syntax Highlighting (`RegexInput.tsx`)
- Use a transparent `<input>` overlaid on a `<pre>` element that mirrors the input content with syntax coloring:
  - Character classes `[...]` → blue
  - Quantifiers `*+?{n,m}` → amber/orange
  - Groups `(...)` → purple
  - Anchors `^$\b` → green
  - Escape sequences `\.` → gray

### Performance Mandates
- Regex testing runs on every keystroke against all 10–16 test strings. Total test time per keystroke must be under 10ms. If any single test exceeds 50ms, abort and show the slow-regex warning.
- Debounce is NOT acceptable here — feedback must be truly real-time for the game to feel responsive.
- Total bundle under 20KB gzipped.

### Styling
- Split-pane layout: green column on left, red column on right, regex input spanning full width at top.
- Matched green strings: `background: rgba(34, 197, 94, 0.1)`, green checkmark icon.
- Accidentally matched red strings: `background: rgba(239, 68, 68, 0.15)`, pulsing red border.
- Regex input: large monospace font, dark background (`var(--blue-900)`), live syntax coloring.

### Storage & Sharing
- `storage.setHighScore('regex-golf', cumulativeScore)`.
- Share format:
```
Regex Golf .* | Round 5 Complete
Score: 847 | Shortest Regex: 11 chars (par: 14)
Difficulty: Hard | Streak: 🔥 3
devscrolls.dev/arcade/regex-golf/
```

---

## Astro Page Wrapper

`src/pages/arcade/regex-golf.astro`:
```astro
---
import ArcadeLayout from '../../layouts/ArcadeLayout.astro';
---
<ArcadeLayout
  title="Regex Golf — DevScrolls Arcade"
  description="Write the shortest regex to match green strings and reject red ones. Dynamic test sets across 15+ pattern archetypes."
  gameName="Regex Golf"
>
  <RegexGolf client:only="react" />
</ArcadeLayout>
```
