# 04 — Typography System

> Type is the primary vehicle for content on a technical platform. Get type right and most other design problems get easier.

**Related:** [[02_Design_Principles]] · [[03_Color_System]] · [[05_UX_Guidelines]] · [[10_Accessibility_Standards]] · [[12_Branding_Guide]]

---

## Purpose

This document defines the typographic philosophy, scale, pairing strategy, and treatment rules for every text element on the platform — from display headlines to inline code, from mobile body copy to long-form prose.

Type is not styling. It is the *interface* through which content reaches the reader. A poor typographic system degrades comprehension even when the content is excellent. *(Web UI Design for the Human Eye, p. 47–60.)*

---

## Philosophy

Every printed word carries two meanings: the **literal definition** of the word and the **emotion** suggested by its typographic treatment. *(Human Eye p. 47–49.)* The typography on this platform must serve four jobs:

1. **Read** — body copy must vanish into immersion. *(Human Eye p. 63.)*
2. **Scan** — headings, leads, and pull-quotes must let scanners find what they need in seconds. *(Human Eye p. 20.)*
3. **Structure** — hierarchy must telegraph structure at a glance.
4. **Signal voice** — type choices must read as "credible, calm, considered" to a technical audience.

Four principles flow from this:

- **Restraint over expression.** "Don't be too literal" — a coding blog should not use a "hacker" pixel font; subdued professional type telegraphs competence better. *(Human Eye p. 55–56.)*
- **One sans + one mono + optional serif.** Don't need many typefaces — need disciplined *treatment* of a small set. *(Human Eye p. 53–55.)*
- **Three explicit hierarchy levels.** Primary, secondary, tertiary. Without them, scanning collapses. *(Human Eye p. 62.)*
- **Body is plain on purpose.** Tertiary type's job is immersion, not attraction. *(Human Eye p. 63.)*

---

## The Five-Word Test

Before locking down typography, run this test. *(Human Eye p. 52.)*

Look at a sample of your typography. Write the **top five words** that come to mind. Compare them against the platform's intended voice:

> Target voice: **trustworthy, technical, sharp, considered, readable.**

If the five words you wrote include "playful," "decorative," "vintage," "cute," or "edgy" — iterate. The visual tone doesn't match.

This test gets run on every type change and any new template.

---

## Font Pairing Strategy

The platform uses **three families** with strictly assigned roles. *(Human Eye p. 59, 22.)*

### 1. Sans-serif (body + UI workhorse)

Used for: body copy, UI labels, navigation, captions, microcopy, h3–h6.

Selection criteria:
- High x-height (improves readability at small sizes).
- Range of weights (regular through bold at minimum).
- Variable-font support for performance.
- Open-source if possible (Inter, Geist, IBM Plex Sans, Source Sans 3 all qualify).

> **Decision:** Default to **Inter** as a starting point. It satisfies all four criteria and is widely tested. Substitute only with a clear reason logged in [[15_Decision_Log_Template]].

### 2. Serif (display + long-form prose, optional)

Used for: h1/h2 on article pages (optional), pull-quotes.

Selection criteria:
- Editorial weight without "old-book" feel.
- Strong italics — needed for prose emphasis.
- Web-optimized rendering.

> **Decision:** Optional. The platform can ship sans-only and still feel credible. If a serif is introduced, it carries the editorial voice and must pair tonally with the sans (e.g., Source Serif 4 with Inter, or Newsreader with Inter).

### 3. Monospace (code)

Used for: code blocks, inline code, syntax-sensitive content (file paths, command snippets, keyboard shortcuts).

Selection criteria:
- Distinct from body sans (ligatures *or* obvious mono character).
- Tabular figures.
- Programming ligatures (optional but appreciated by developer audience).

> **Decision:** Default to **JetBrains Mono** or **Geist Mono**. Both are designed for code reading, ship in multiple weights, and feel modern.

---

## Type Scale

A modular scale, not arbitrary sizes. Each step has a *role*; never invent ad-hoc sizes.

| Token | Size (base = 16px) | Line height | Weight | Role |
|-------|---------------------|-------------|--------|------|
| `display` | 60px / 3.75rem | 1.05 | 700 | Hero on landing / home only |
| `h1` | 40px / 2.5rem | 1.1 | 700 | Article title |
| `h2` | 30px / 1.875rem | 1.2 | 600 | Major section |
| `h3` | 24px / 1.5rem | 1.25 | 600 | Sub-section |
| `h4` | 20px / 1.25rem | 1.3 | 600 | Minor heading |
| `lead` | 20px / 1.25rem | 1.5 | 400 | Article introduction paragraph |
| `body` | 18px / 1.125rem | 1.6 | 400 | Long-form prose |
| `ui` | 16px / 1rem | 1.5 | 400 | Default UI text |
| `small` | 14px / 0.875rem | 1.5 | 400 | Captions, meta, microcopy |
| `xs` | 12px / 0.75rem | 1.4 | 500 | Tags, eyebrows, labels |
| `code` | 15px / 0.9375rem | 1.6 | 400 | Inline + block code |

### Why these specific values

- **Body at 18px, not 16px.** Long-form reading benefits from a step up; 16px is the *UI* default, not the *reading* default. Modern editorial sites (Stripe blog, Linear blog, Smashing Magazine) trend toward 18–20px body.
- **Line height 1.5–1.6 for body.** Human Eye PDF mandates 1.3–1.5 *(p. 60)*; long-form benefits from the upper edge of that window or slightly above. White Space PDF echoes 1.5 *(p. 13)*.
- **Line height 1.05–1.3 for display/headings.** Tighter leading at large sizes prevents floating-fragment feel.
- **Display only on home/landing.** It is a hierarchy weapon — overuse blunts it. *(Human Eye p. 62.)*

---

## Measure (Line Length)

Body line length should sit at **60–70 characters**. *(Human Eye p. 59.)* — Hard rule.

| Context | `max-width` | Why |
|---------|------------|-----|
| Article body | `65ch` | Optimal scan + read |
| Article body on wide screens | clamp to 720px | Prevents 100ch on 4K displays |
| Mobile body | `100%` of viewport minus padding | One-handed thumb reach |
| Lead paragraph | Match body (`65ch`) | Don't break the column |
| Code block | wider than prose, up to 90ch | Code lines often exceed prose |
| Pull-quote | narrower than body (`50ch`) | Visual emphasis through compression |

> **Rule:** Never let body copy exceed 80ch on any breakpoint. Wider measures cause readers to lose their place between lines.

---

## Reading Experience

The platform exists to be read. These rules optimize reading sessions of 5–30 minutes.

### Vertical rhythm

- Paragraph spacing: `0.75 × line-height` of the surrounding body. Consistent throughout the article.
- Heading spacing: more margin *above* than below. A heading attaches to the content that *follows* it.
- First paragraph after heading: no extra top margin (it's already separated by the heading's bottom margin).
- Lists: same line-height as body; tighter inter-item spacing than inter-paragraph spacing.

### Paragraph length

Aim for 2–5 sentences per paragraph. Long monolithic paragraphs hide structure; one-sentence paragraphs feel choppy.

### Inline emphasis

- **Bold** (`<strong>`): genuine emphasis, "this is the key idea." Avoid for whole sentences. *(Human Eye p. 66.)*
- *Italic* (`<em>`): soft emphasis, terms of art, titles of works. *(Human Eye p. 66.)*
- `Inline code`: literal code, paths, commands. Distinct color + sunken background.
- **Never combine** bold + italic + underline. Pick one.

### ALL CAPS

Use sparingly. Caps read as yelling and dominate the foreground. *(Human Eye p. 67.)* Allowed for:
- Eyebrow labels above headings ("CASE STUDY")
- Tag chips
- Section labels in side-rails

Never in body text, headlines, or links.

---

## Mobile Typography

Mobile is read on small screens, in poor light, one-handed. *(Modern best practice; PDFs predate mobile-first.)*

| Token | Mobile size (≤640px) | Adjustment |
|-------|----------------------|-----------|
| `display` | 36px | Down from 60px |
| `h1` | 30px | Down from 40px |
| `h2` | 24px | Down from 30px |
| `body` | 17px | Down from 18px (slight) |
| `code` | 14px | Down from 15px |

Line height stays the same on mobile; only size shrinks.

> **Rule:** Mobile body must never go below 16px (browser default). The visited link's tap target must stay ≥44×44px even when the link text itself is smaller.

---

## Desktop Typography

Desktop assumes a focused reading position, often longer sessions.

- Body lands at 18px (or 19–20px on articles that lean editorial).
- Generous margins around the column. The platform leans toward white-space-heavy layouts. *(White Space p. 27.)*
- Articles can offer an optional "increase text size" toggle (16, 18, 20, 22) stored in localStorage — power-reader affordance.

---

## Code Typography

Code is content, not chrome. *(See [[03_Color_System]] for code colors.)*

### Inline code

- Mono family at `code` token size.
- Sunken or subtly-tinted background.
- Slightly rounded corners (~2–3px).
- No border.
- Inline code inside a link gets underlined + colored.

### Block code

- Mono family at `code` token size.
- Full-width within the article column (may exceed body measure up to 90ch).
- Generous padding (≥1rem all sides).
- Optional language label in top-right.
- Optional copy button in top-right (UI conventions — *Consistency p. 13.*)
- Line numbers: opt-in per block via metadata, default off.
- Horizontal scroll allowed; never wrap (mangles code).
- Soft top/bottom margins of one line-height to separate from prose.

### Diff blocks

Use color *plus* a leading `+ / -` character so color-blind readers can still parse changes.

### Keyboard combos

Use `<kbd>` with a distinct treatment: subtle border, sunken surface, slightly smaller than body. Compose with `+` for chords (`⌘ + K`).

---

## Heading Hierarchy

The three-tier rule. *(Human Eye p. 62–64.)*

### Primary (display, h1)
- Largest, brightest, sparest.
- One per page maximum.
- Tracks the article's *single* main topic.

### Secondary (h2, h3, lead, pull-quote)
- Subhead the article into navigable sections.
- Carry the editorial voice through emphasis.
- Lead paragraph signals "this is the article's premise."
- Pull-quotes spotlight quotables for scanners. *(White Space p. 17.)*

### Tertiary (h4, body, caption, code)
- Understated. Plain on purpose.
- Body is the *most plain* element on the page. Resist styling it. *(Human Eye p. 63.)*
- Captions and meta are smaller and lower-contrast than body.

### Emphasis tier (italic, bold, link, code)
- Inline, sparingly applied within tertiary.

> **Rule:** Skip no level downward (`h1 → h2 → h3 → h4`, not `h1 → h3`). Heading levels are semantic, not stylistic — screen readers depend on them.

---

## Technical Article Readability

Specific patterns for the platform's primary content type.

### Table of contents (TOC)

- Right rail on desktop (≥1024px), sticky.
- Collapses to top-of-article on mobile.
- Active section highlighted in the warm accent (matches the article's "one accent" rule from [[03_Color_System]]).
- Limit depth to h2 and h3.

### Callouts

Use a small set of named callouts (Note, Tip, Warning, Danger). Each gets:
- An icon + label (color + non-color signal).
- A `state-*` color from [[03_Color_System]].
- Same body type as prose; never a different font.

### Footnotes & references

- Inline reference number raised (`<sup>`).
- Linked to footnote at end of article.
- Back-link arrow returns reader to position in body.

### Image captions

- `small` token, italic.
- Below the image, centered.
- Lower contrast than body — captions are tertiary content.

---

## Markdown Rendering

Markdown is the platform's authoring format. The rendering pipeline must:

1. Render headings semantically (`#` → `h1`, never skipped).
2. Render inline emphasis correctly (`*` → italic, `**` → bold, ``` ` ``` → inline code).
3. Generate IDs for headings (slug-from-text) for anchor links.
4. Wrap code blocks with the language-specific syntax highlighter.
5. Render tables responsively (horizontal scroll on narrow viewports).
6. Render blockquotes with a left-edge accent rule.
7. Render task lists (`- [ ]`) with proper checkboxes.
8. Auto-link bare URLs.

**Never** mangle the author's intent. If the markdown source says "this is bold," render bold — don't auto-apply a heading because it's short.

---

## Long-Form Reading Optimization

Beyond the size and leading rules above:

- **Reading progress indicator** at the top of articles. Subtle. Uses the accent color.
- **Estimated reading time** in the article meta (e.g., "12 min read"). Computed from word count.
- **Optional dark mode** for evening reading.
- **No autoplay video** in body. Hurts focus + bandwidth.
- **No animated GIFs** in body without a freeze frame and click-to-play.
- **No animated text** (typewriter effects, fade-ins on scroll for paragraphs). Distracting and slows comprehension.

---

## Decision Framework

When making any type change, walk through these questions:

1. **What role does this text play?** (display, heading, body, UI, code, meta?) → Use the matching token.
2. **Does it pass the Five-Word Test?** *(Human Eye p. 52.)*
3. **Does the size fit the modular scale?** If not, pick the nearest scale step.
4. **Does the measure stay within 60–70ch for body?**
5. **Does the line-height match the role?** (Display 1.05; body 1.6; etc.)
6. **Does it work on mobile and desktop?**
7. **Does it preserve semantic HTML?** (Real `<h2>`, not styled `<div>`.)
8. **Does it pass accessibility?** Contrast, focus, screen-reader.

---

## Rules

1. **Body at 18px on desktop, 17px on mobile.** No exceptions without a logged decision.
2. **Measure ≤80ch.** Targets 65ch for body.
3. **Line height 1.5–1.6 for body, 1.05–1.3 for headings.**
4. **One sans + one mono.** Serif is optional; never three sans families.
5. **Three hierarchy levels minimum.** Plus an emphasis tier.
6. **No skipped heading levels** (semantic).
7. **All-caps only for eyebrows, chips, side labels.**
8. **Body is plain.** Resist styling.
9. **Pull-quote is wider on margins, narrower on measure.**
10. **Code is content.** Generous padding, distinct surface, never tiny.
11. **Variable fonts when available.** Reduces weight on the network.
12. **Self-host fonts.** No Google Fonts CDN for privacy + performance. See [[11_Performance_Guide]].
13. **`font-display: swap`.** Avoid invisible text.

---

## Examples

### Pull-quote pattern (good)

> White space around the quote signals importance. Slightly larger size, italic, narrower measure (50ch), with a left-edge rule in the warm accent. *(White Space p. 17; Human Eye p. 33.)*

### Heading hierarchy (bad)

An article uses `h1` for the title, then `h4` for the first section, then `h2`, then `h6`. → Fails semantic HTML, breaks screen readers, no consistent visual structure.

### Italic abuse (bad)

A paragraph italicizes every fifth word "for emphasis." → Emphasis is a *contrast* technique. When everything is emphasized, nothing is. *(Human Eye p. 35.)*

---

## Future Considerations

- **User-adjustable font size**. Power-reader feature, stored in localStorage.
- **Dyslexia-friendly mode**. Substitute a higher-readability face (Atkinson Hyperlegible, OpenDyslexic) and tighten paragraph spacing.
- **Reading mode**. Strips chrome, gives long-form content full attention.
- **Variable font axis controls** for power users (weight, optical size).
- **Print stylesheet**. Different scale for print; serif body; no display sizes.

---

## Common Mistakes

- **Body at 14px.** Optimized for marketing density; punishing for long reading. *(Human Eye p. 56–60.)*
- **Line height 1.2 in body.** Lines crash together. *(p. 60.)*
- **Same font for everything.** Loses the secondary-tier signal. *(p. 59.)*
- **Three sans families.** Decision fatigue without payoff. *(p. 59.)*
- **Decorative body font.** Cognitive load tax on every word. *(p. 57.)*
- **All-caps in body.** Reads as yelling, slows reading. *(p. 67.)*
- **Auto-rendering markdown headings at arbitrary levels.** Breaks the semantic tree.
- **Italic *and* bold *and* underline together.** Inflation of emphasis.

---

## Checklist

Before merging a typography change:

- [ ] Does the change pass the Five-Word Test?
- [ ] Does the size hit a step on the modular scale?
- [ ] Does body still land at 60–70ch measure?
- [ ] Does line-height match role (1.6 body, 1.1–1.3 heading)?
- [ ] Does it render correctly at mobile + desktop?
- [ ] Does the semantic HTML reflect the visual hierarchy (no skipped headings)?
- [ ] Does it pass WCAG AA contrast against its background?
- [ ] Does it use semantic tokens from [[03_Color_System]]?
- [ ] Have I checked print rendering (if applicable)?
- [ ] Are fonts self-hosted and font-display: swap applied?

---

## References

- *Web UI Design for the Human Eye: Content Patterns & Typography.* Jerry Cao et al., UXPin, 2015 — primary source for hierarchy levels (p. 62–64), measure (p. 59), line height (p. 60), font pairing (p. 59), five-word test (p. 52), and emphasis rules (p. 66–67).
- *White Space in Web UI Design.* UXPin, 2015 — line height 1.5 rule (p. 13), pull-quote spacing (p. 17), and micro white space (p. 12–13).
- *Consistency in UI Design.* UXPin, 2015, p. 20 — typography as one of the six axes of internal consistency.
- **Complementary modern guidance:** Butterick's *Practical Typography*; *Web Typography* by Richard Rutter; WCAG 2.2 for type sizing minimums.
