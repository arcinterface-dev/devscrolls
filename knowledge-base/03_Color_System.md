# 03 — Color System

> The single source of truth for color decisions on the platform. Every hue, every token, every state.

**Related:** [[02_Design_Principles]] · [[04_Typography_System]] · [[10_Accessibility_Standards]] · [[12_Branding_Guide]] · [[14_AI_Context]]

---

## Purpose

This document defines the color philosophy, semantic token model, and decision rules that govern every pixel of color on the platform — from body text to syntax highlighting, from error states to dark mode.

It exists so that:
- Future AI assistants apply colors consistently without re-deriving choices.
- Future contributors understand *why* a color exists before changing it.
- A redesign can swap palettes without re-architecting the system.

---

## Philosophy

Color is not decoration; it is a UX lever with scientifically proven emotional and physiological effects. *(Color Theory in Web UI Design, UXPin 2015, p. 6.)* Every color decision must serve **content first** and **emotion second**.

The platform's color philosophy rests on four anchors:

1. **Cool and neutral surfaces; warm and saturated accents.** Reading surfaces stay calm so prose, code, and imagery dominate attention. A single warm accent does all the work of directing attention — to CTAs, links, and highlights. *(Color Theory p. 8; Human Eye p. 67.)*
2. **Monochromatic-first, split-complementary when needed.** A monochromatic blue ramp emphasizes content and makes even the simplest typeface feel deliberate. *(Color Theory p. 20.)* Split-complementary adds a single accent for action affordances. *(Color Theory p. 27.)*
3. **60 / 30 / 10 dominance.** One dominant brand color drives ~60% of color real estate; neutrals fill ~30%; a single accent covers ~10%. *(Color Theory p. 22.)* Stronger colors (red, black) appear *less* frequently than weaker ones. *(p. 30.)*
4. **Tokens before hex.** Every color used in production must resolve to a *semantic* token (`text-primary`, `surface-elevated`, `accent-link`), never a raw `#0066ff`. *(Color Theory p. 31; Mozilla Sandstone / Lonely Planet style guides cited p. 32.)*

---

## Color Psychology Reference

Use this table when defending or revisiting a brand color choice. Every entry is grounded in the Color Theory PDF.

| Color | Emotional signal | Recommended use on this platform | Page |
|-------|------------------|-----------------------------------|------|
| **Red** | Stimulating, alarm, power | Destructive actions, errors, validation failures *only* | p. 8–9 |
| **Orange** | Cheerful, energetic, calmer than red | Optional accent for "new" badges | p. 9 |
| **Yellow** | Bright = stimulating; gold = timeless | Featured/editor's-pick badges; avoid pure yellow on long-form text | p. 10 |
| **Green** | Energy + relaxation, growth, money | Success states, "published" indicators, confirmation toasts | p. 10 |
| **Light blue** | Friendly, safe, inviting | Social/share buttons, onboarding tooltips | p. 11 |
| **Dark blue** | Somber, reliable, professional | **Recommended primary brand color** — communicates engineering credibility | p. 11 |
| **Purple** | Royalty, luxury, mystery | Premium/advanced-topic accent (use sparingly) | p. 12 |
| **Black** | Power, sophistication, default text | Body type, hero surfaces | p. 12 |
| **White** | Cleanliness, purity, supporting role | Article surfaces, breathing space | p. 13 |
| **Gray** | Neutrality — tunable across the ramp | Borders, secondary text, disabled states, code surfaces | p. 13 |

> **Decision:** Position the platform on a **dark-blue primary + warm-accent + extensive gray ramp** axis. Dark blue carries the "trusted technical voice" the platform exists to express. Warm accent (orange or amber) does the attention-grabbing work for CTAs. Gray is the workhorse for everything between.

---

## Semantic Token Model

Tokens are organized in three layers. Production CSS / Astro components must consume **semantic** tokens only; semantic tokens point to **palette** tokens; palette tokens own the hex values.

### Layer 1 — Palette (raw values)

Never consumed directly by components. Mirrors the Mozilla Sandstone / Lonely Planet pattern. *(Color Theory p. 31–32.)*

```
--blue-50  → --blue-900    (brand ramp, 10 stops)
--gray-50  → --gray-950     (neutral ramp, 11 stops)
--amber-50 → --amber-900    (warm accent ramp, 10 stops)
--green-500, --red-500, --yellow-500   (state hues, single value per state)
```

### Layer 2 — Semantic (role-based)

This is what components read. Each name describes a *role*, not a color.

```
text-primary, text-secondary, text-muted, text-inverse, text-link, text-link-hover
surface-base, surface-raised, surface-sunken, surface-inverse, surface-overlay
border-subtle, border-default, border-strong, border-focus
state-success, state-warning, state-error, state-info
syntax-comment, syntax-keyword, syntax-string, syntax-function, syntax-number
accent-default, accent-hover, accent-active
```

### Layer 3 — Component (optional aliases)

Created only when a component needs special treatment that cannot be expressed semantically. Used sparingly to avoid token sprawl.

```
button-primary-background → accent-default
codeblock-background       → surface-sunken
tag-background             → surface-raised
```

> **Rule:** A new component should *first* try to use existing semantic tokens. New tokens are added only when the semantic vocabulary genuinely cannot describe the role. *(Consistency in UI Design, p. 21.)*

---

## Light Mode Philosophy

Light mode is the reading default. Goals:

- **High contrast for body text** without screaming. Near-black text (`#1a1a1a`) on near-white background (`#fafafa`) — slightly softened from pure values to reduce eye strain on long sessions.
- **Generous white space.** The luxury / craft signal scales linearly with white space *(White Space PDF p. 27)* — the platform leans heavy-to-balanced.
- **Cool chrome, warm accent.** Surfaces use cool grays; the warm accent reserved exclusively for CTAs, links, active-nav indicators, and inline highlights.
- **Surface elevation via lightness, not shadow.** Use small shifts in the gray ramp (`surface-raised` lighter than `surface-base`) before reaching for `box-shadow`. Shadows slow rendering and clutter long-form layouts.

---

## Dark Mode Philosophy

Dark mode is a first-class peer to light mode, not a CSS afterthought. Goals:

- **Soft dark, not pure black.** Pure `#000` produces halation on most LCD panels and feels stark. Default to `#0f1115` for `surface-base`. *(Modern best practice; PDFs do not address dark mode directly.)*
- **Reduced saturation in dark mode.** Saturated colors vibrate against dark backgrounds. Map the accent palette to *desaturated* equivalents (e.g., amber-400 in light becomes amber-300 with -10% saturation in dark).
- **Body text never pure white.** Use `#e8e9eb` for body text — full white on dark causes "shimmer" effect on long reading.
- **Code block contrast tuned for dark.** Syntax highlighting must clear WCAG AA against the dark surface — this is *not* automatic from inverting a light theme.

---

## Code Block Colors & Syntax Highlighting

Code is content. The block is its surface; the highlighter is its typography in color.

### Block surface

- Light mode: `surface-sunken` (slightly darker than the page) gives the block weight without a border.
- Dark mode: `surface-raised` (slightly lighter than the page) for the same effect inverted.
- Padding: generous — code needs breathing room equal to or greater than body prose. *(White Space p. 10.)*

### Syntax highlighting palette

A custom palette is preferable to off-the-shelf themes because off-the-shelf themes often violate the platform's own color rules.

Recommended structure (illustrative, not prescriptive on exact hex):

| Role | Light mode | Dark mode | Notes |
|------|-----------|-----------|-------|
| Comment | gray-500 | gray-400 | Lower contrast — comments should fade |
| Keyword | blue-700 | blue-300 | Brand-aligned |
| String | green-700 | green-300 | Reads as "data" |
| Function | amber-700 | amber-300 | The single warm accent |
| Number | purple-700 | purple-300 | Uncommon enough that purple won't compete |
| Operator | text-primary | text-primary | No special color |

> **Why:** Off-the-shelf themes like Dracula or One Dark optimize for code aesthetics in isolation. They use saturated reds, pinks, and cyans that clash with a content-first platform. Building a brand-aligned palette keeps code blocks reading as *part of the article*, not as foreign embedded artifacts.

---

## Link Colors

Links are the only common UI element where the user knows the color means "clickable." *(Consistency PDF p. 13, 19.)* Don't fight that.

- **Body links**: use a brand-aligned hue (blue ramp), underlined by default. Underline persists on hover; the color may shift one ramp step on hover.
- **Visited links**: subtle hue shift (one ramp step toward purple), preserved across sessions when possible.
- **In-nav links**: no underline; rely on weight and a left-edge accent for the active state.
- **Inline code links**: combine the syntax highlighter's keyword color with an underline to disambiguate "code that links" from "code that doesn't."

---

## CTA Colors

> **Rule:** One primary CTA per view. *(White Space p. 25; Human Eye p. 41.)*

- **Primary CTA**: the single warm accent (`accent-default`). It should contrast with the surrounding section background by approximately 3 wheel-steps to grab attention. *(Color Theory p. 16.)*
- **Secondary CTA**: outlined or "ghost" style using `border-strong` and `text-primary`. Never a second saturated color — that creates two primaries.
- **Tertiary actions**: text-only links. No button chrome.

---

## State Colors

State colors should always have **two** signals: color *and* an icon or label. Color alone is inaccessible. *(Modern WCAG best practice; PDFs do not cover this — see [[10_Accessibility_Standards]].)*

| State | Hue | Use |
|-------|-----|-----|
| `state-success` | Green | Confirmation toasts, "published" badge, form-valid |
| `state-warning` | Amber/yellow | Deprecation notices, draft status |
| `state-error` | Red | Validation failure, build error, broken link |
| `state-info` | Blue | Tips, callouts, neutral notifications |

Pair each with an icon: ✓, ⚠, ✕, ⓘ — never rely on color alone.

---

## Accessibility & Contrast (Cross-Reference)

Color Theory PDF is light on accessibility. The Color System imposes these floors regardless:

- **Body text on surface-base**: WCAG AA at minimum (4.5:1). Target AAA (7:1) on long-form article pages.
- **UI text on surface-raised**: AA (4.5:1).
- **Large text (≥18.66px or ≥14px bold)**: AA Large (3:1).
- **Non-text contrast (buttons, focus rings, icons)**: 3:1 against adjacent color.
- **Focus state**: never use color alone. Pair the accent color with a 2px ring offset.
- **Color-blind safety**: every color-coded state must have a non-color signal (icon, label, position).

See [[10_Accessibility_Standards]] for the full WCAG handbook.

---

## Long Reading Comfort

The platform exists for technical reading. Color choices that aid long sessions:

1. **Slightly off-white background.** Pure `#fff` is harsh under bright environments. Default `#fafafa` or `#f7f7f8`.
2. **Slightly off-black text.** Pure `#000` increases pupil strain. Default `#1a1a1a` or `#15171a`.
3. **Low-chroma chrome.** Saturated borders, dividers, or backgrounds pull attention from text. Keep chrome at <10% saturation.
4. **Distinct but quiet code blocks.** Code should *feel* different (sunken/raised surface) without flashing.
5. **One accent per article.** Inline highlights, the active TOC item, and the primary CTA all share the *same* warm accent. Multiple accents fracture focus.

---

## Decision Framework

When choosing or revising a color, walk through these questions in order:

1. **What role does this color play?** (text? surface? border? state? accent?) → Find or define the right *semantic token*.
2. **Does an existing semantic token already cover this role?** If yes, use it. New tokens require justification.
3. **Does the new color carry the right *emotion*?** Check the Color Psychology table. Red on a "trust" surface fails this test.
4. **Does it pass WCAG AA against its background?** Run the contrast check. Don't trust your eye.
5. **Does it work in both modes?** Map both `light` and `dark` tokens.
6. **Does it preserve the 60/30/10 balance?** If this addition pushes the accent above ~10% of color area, reconsider.
7. **Could it be expressed by an existing tier instead?** Often "we need a new color" really means "we need more of the same color in a different role."

---

## Rules

1. **No raw hex in components.** Components consume semantic tokens only.
2. **One dominant + one accent.** Multi-accent palettes fragment focus.
3. **Color ≠ semantics alone.** Every color-coded state pairs with icon or label.
4. **Cool surfaces, warm accents.** Reverse only with explicit justification in a [[15_Decision_Log_Template]] entry.
5. **Test against full content.** Use real article HTML, not lorem ipsum, when previewing palette changes. *(Human Eye p. 9.)*
6. **Dark mode is designed, not derived.** It gets its own ramp, not an inverted light theme.
7. **Saturation rules in dark.** Saturated hues vibrate on dark surfaces — desaturate accents.
8. **One accent per article.** Highlights, active TOC, CTA all share the same hue.
9. **State colors are non-decorative.** Never use red/green/yellow as branded accents elsewhere.
10. **Document any palette extension** in [[15_Decision_Log_Template]].

---

## Examples

### Brand color justification (good)

> "Primary brand color: dark blue (`#1f3d6b`). Chosen because dark blue communicates professionalism and reliability — Color Theory PDF p. 11 cites it as the preferred hue for companies known for credibility. The platform exists to establish technical authority, so a 'trusted engineering voice' visual identity is foundational."

### Adding a new accent (bad)

> "Adding teal because I want a friendlier vibe on the homepage." → Fails decision framework Q3 + Q6. Teal would compete with the existing warm accent for the "one warm accent" slot, fragmenting attention. Reject.

### Off-the-shelf syntax theme (bad)

> Importing Dracula syntax theme wholesale. → Fails Q2 (introduces 8+ new raw hexes), Q3 (Dracula's pink contradicts the platform's emotional tone), Q6 (heavy magenta usage breaks 60/30/10). Build a brand-aligned syntax palette instead.

---

## Future Considerations

- **Themed presets.** Future feature: user-selectable preset palettes (e.g., Solarized-warm, Nord-cool) that swap *palette* tokens while preserving the *semantic* layer. The semantic layer is the contract.
- **Color tokens as exportable design tokens.** Generate from a single source of truth (JSON / YAML) into CSS variables, Tailwind config, and Figma styles. Avoid drift.
- **Print stylesheet.** Articles printed must collapse the warm accent into black + underline since color printers vary.
- **OLED-true-black option.** Future option for power users — *not* the default (loses surface elevation).
- **Color in MDX components.** Future custom MDX components (Callout, Note, Warning) must use `state-*` tokens, not hardcoded hues.

---

## Common Mistakes

- **Using state colors as decorative.** Putting green on a "Subscribe" button because green "feels positive." Now success toasts and CTAs share a color → user can't tell what is feedback vs. action.
- **Two competing accents.** Adding a "secondary brand color" that is also saturated. Result: two primaries fighting for attention. *(White Space p. 25, choice paralysis.)*
- **Inverting light theme into dark.** Mathematical inversion produces oversaturated, eye-burning surfaces.
- **Color-only meaning.** Red text means "error" only if the user can see red. *(Modern WCAG.)*
- **Saturated body text.** Body text in any color other than near-black/near-white reduces readability and fights typography hierarchy. *(Human Eye p. 63.)*
- **Off-the-shelf syntax themes.** Introduce hues that don't match the rest of the platform.

---

## Checklist

Before shipping any palette change or new colored element:

- [ ] Does it map to a semantic token?
- [ ] Does it pass WCAG AA against its background (AAA for body text)?
- [ ] Does it work in both light and dark modes?
- [ ] Does it pair with a non-color signal if it's state-related?
- [ ] Is it one of the existing palette ramps, or is a new ramp justified?
- [ ] Does it preserve the 60/30/10 dominance?
- [ ] Have I tested it against real content (article body, code block, image-heavy post)?
- [ ] Have I logged the change in [[15_Decision_Log_Template]] if it introduces a new token?

---

## References

- *Color Theory in Web UI Design: A Practical Approach to the Principles.* Jerry Cao et al., UXPin Inc., 2015 — primary source for color psychology, schemes, 60/30/10, and style-guide patterns.
- *Web UI Design for the Human Eye: Content Patterns & Typography.* Jerry Cao et al., UXPin Inc., 2015, p. 67 — warm/cool attention dynamics and color as a hierarchy lever.
- *White Space in Web UI Design.* UXPin, 2015 — color-luxury correlation (p. 27).
- *Consistency in UI Design.* UXPin, 2015, p. 19–20 — color as a six-axis consistency element.
- **Complementary modern guidance** (not from PDFs): WCAG 2.2 contrast ratios; Material Design 3 color roles; Apple Human Interface Guidelines on dark mode.
