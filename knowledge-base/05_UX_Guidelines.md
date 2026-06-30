# 05 — UX Guidelines

> The operational rules that turn design principles into reader experience.

**Related:** [[02_Design_Principles]] · [[04_Typography_System]] · [[06_Content_Strategy]] · [[07_Information_Architecture]] · [[10_Accessibility_Standards]] · [[14_AI_Context]]

---

## Purpose

This document translates design principles into concrete interaction rules: navigation, search, feedback, error handling, accessibility, friction reduction, and progressive enhancement. It governs *how* the platform behaves when a reader touches it.

---

## Philosophy

UX ≠ UI. UI is which buttons to press; UX is **how the overall design makes the reader feel.** *(3 UX Mistakes p. 9–10.)*

The platform's UX is built on four commitments:

1. **The reader is always right.** "When in doubt, ask what the user would do, then work back to business goals." *(3 UX Mistakes p. 18.)*
2. **Frictionless beats clever.** "Users are lazy." *(3 UX Mistakes p. 13.)*
3. **Familiarity beats novelty for core flows.** Principle of Least Astonishment. *(Consistency p. 10.)*
4. **Every page is potentially a first page.** The "lost traveler" mentality. *(3 UX Mistakes p. 17.)*

---

## Navigation

### Primary navigation

- **≤5 items.** *(Minimalism p. 24.)* Default set: Home, Writing, Projects, About, Contact.
- **Always visible on desktop.** Hamburger only at narrow viewports. *(Minimalism p. 11–12.)*
- **Icons always paired with labels.** Never icon-only nav. *(Minimalism p. 32; Visual Storytellers p. 31–32.)*
- **Logo upper-left, links home.** *(Human Eye p. 21; Consistency p. 13.)*
- **Active state is unmistakable.** Underline, accent color, or both — but never color alone.
- **Same nav across the site.** Internal consistency violated by per-page nav = orientation loss. *(Consistency p. 33.)*

### Secondary navigation

- **In-article TOC** on the right rail (desktop), top-of-article (mobile). Sticky on desktop.
- **Tag/category navigation** in the article footer + tag-index page.
- **Prev/next post** linking at article end for series.
- **Breadcrumbs** on deep pages (`/writing/series/title`) to support "lost traveler" arrivals. *(3 UX Mistakes p. 17.)*

### Mobile navigation

- Hamburger acceptable on viewports <768px. *Always* labeled "Menu" or paired with the icon.
- Touch targets minimum **44×44px** with non-encroaching padding. *(3 UX Mistakes p. 17.)*
- Bottom-bar nav is acceptable for power-user shortcuts (search, theme, command palette) — never as the only navigation.

---

## Discoverability

> Critical actions visible. Occasional/playful ones can hide. *(Web Storytelling p. 23; Visual Storytellers p. 64.)*

| Tier | Examples | Visibility |
|------|----------|------------|
| Critical | Read article, subscribe, contact | Always visible, prominent |
| Secondary | Share, save, copy code | Visible at component level, possibly on hover |
| Power-user | Command palette, keyboard shortcuts, theme toggle | Discoverable, not load-bearing |
| Easter eggs | Konami code, hidden console messages | Pure delight; primary tasks must work without |

For technical/developer audiences, easter eggs are tolerated and shared. *(Visual Storytellers p. 63.)* If hidden interactions exist, hint at them — "click around to discover more." *(Web Storytelling p. 22.)*

---

## Search

Search is the universal escape hatch. *(Minimalism p. 32 — alternative to linear-only nav.)*

- **Always visible** or one keystroke away (e.g., `Cmd+K` command palette).
- **Top-right placement** on desktop; collapsed into a search icon on mobile.
- **Instant results** preferred over submit-then-render.
- **Indexed**: post titles, post bodies, tags, code snippets, author names.
- **Keyboard-first**: arrow keys to navigate, Enter to open, Esc to close. *(Accessibility — see [[10_Accessibility_Standards]].)*
- **No-result state** suggests alternative actions: browse categories, view archive, "submit a topic request."

---

## Categories, Tags, and Related Articles

### Categories
- **Controlled vocabulary** — ≤7 categories at the start. *(UX Process p. 18 — taxonomies as controlled vocabularies.)*
- Each post belongs to **one** category.
- Categories represent durable topic areas (e.g., "Engineering," "Design Systems," "Career"), not transient themes.

### Tags
- Free-form but governed — author-suggested tags reviewed before publish.
- Limit per post: **5 tags maximum.** More dilutes signal.
- Tags surface as chips: small, sans-serif, low-saturation surface, accent-colored on hover.

### Related articles
- Algorithm: same category > same tags > recent.
- Displayed at article end, **3–4 cards maximum.** More crowds the CTA.
- Card visual language identical to the article cards on the index — *(Card-Based p. 10, visual consistency card → destination)*.

---

## Reading Flow

Article reading is the platform's primary user task. Every UX choice serves uninterrupted reading.

### Article anatomy (top to bottom)
1. **Eyebrow / category label** (small caps, low contrast).
2. **Title** (h1, primary type).
3. **Meta row**: author + date + reading time. Tight proximity (Gestalt grouping). *(Human Eye p. 68.)*
4. **Lead paragraph** (larger than body, sets premise).
5. **Hero image / code snippet** (5–7 word title supported by visual — *Web Storytelling p. 16; Visual Storytellers p. 59*).
6. **Body** — generous vertical rhythm, max 65ch, line-height 1.6.
7. **In-article callouts, pull-quotes, figures** for texture. *(White Space p. 17; Human Eye p. 69.)*
8. **Conclusion + single CTA** (subscribe OR contact OR next post — not all).
9. **Author bio** (with photo — social approval signal). *(Visual Storytellers p. 49.)*
10. **Related posts** (≤4 cards).
11. **Footer** (minimal — see Information Architecture).

### Reading aids
- **Reading progress indicator** at the top of the page. Subtle, uses accent color.
- **Sticky TOC** on the right rail (desktop) ≥1024px viewports.
- **"Copy link to this section"** on heading hover (icon next to heading).
- **Estimated reading time** computed from word count + code block weight.

### Density curve
Article opens **airy** at the top (large title, generous lede); body becomes **denser** with code, images, tables; footer returns to airy. *(Minimalism p. 22.)*

---

## Friction Reduction

> The Imaginary Landscapes case: 4-field form vs 11-field form → 140% more signups. *(3 UX Mistakes p. 13–15.)*

### Forms

- **Every field needs a documented rationale.** No "while we're here" creep. *(3 UX Mistakes p. 15.)*
- **Default to the minimum.** Newsletter signup: email only.
- **Optional fields labeled "(Optional)"** rather than asterisks on required. *(Consistency p. 16–17.)*
- **Never collect phone numbers** without explicit justification. *(3 UX Mistakes p. 15.)*
- **Inline validation** with helpful error text (see Error Handling below).
- **Submit button label is specific**: "Subscribe to newsletter," not "Submit."

### Comments
- Identity options: email + name (no account required by default), optional GitHub/Bluesky/Mastodon OAuth in future.
- Markdown rendering supported. Live preview.
- Spam protection without CAPTCHA where possible (honeypot, rate limit).
- Moderation queue for first-time commenters.

### Sign-up
- One step: email. Magic-link confirmation. No password required.
- Optional preferences post-signup (categories, frequency).

---

## Interaction Feedback

Every user action gets a response in the same frame.

| Action | Feedback |
|--------|----------|
| Hover a link | Underline appears or strengthens; color shifts one ramp step |
| Click "copy code" | Button label changes to "Copied" for 1.5s with checkmark icon |
| Submit a form | Inline spinner in button; disabled state until response |
| Save a post | Bookmark icon fills + brief toast confirmation |
| Like / react | Subtle scale animation on the icon (respects `prefers-reduced-motion`) |
| Search keystroke | Results render within 100ms (debounce-aware) |
| Navigate to new page | Top progress bar (Astro/Vercel pattern) |

### Animation budget
- Default: 150–250ms ease-out for state changes. *(Minimalism p. 31.)*
- Page transitions: maximum 300ms.
- All animations respect `prefers-reduced-motion`. Fallback: no animation, instant state change.
- Hero animations time-boxed: capture interest, **yield to content quickly.** *(3 UX Mistakes p. 7.)*

---

## Empty States

Empty states are first impressions. *(UX Process — every page potentially a landing page.)*

- **Search with no results**: "No posts match `[query]`. Try [adjacent terms] or browse the [category archive]."
- **No posts in category yet**: "This section is just getting started. Subscribe for new posts on [topic]."
- **Reader's bookmarks empty**: "Save posts as you read. Bookmarks appear here, synced across devices."
- **404**: friendly, with search field + 3 recommended posts. Brand voice opportunity. *(Visual Storytellers p. 40 — surface design persona in error states.)*

> Empty states use the same design persona as the rest of the site. Don't go sarcastic on a serious technical platform.

---

## Error Handling

Errors are honest, specific, and offer a path forward.

- **Inline form errors**: red `state-error` color + icon + explanation ("Email looks invalid — does it contain `@`?").
- **Server errors**: a stable error page with the request ID and a contact link. Never blame the user.
- **Network errors**: retry button, plus instructions for offline reading if the post is cached.
- **Broken images**: graceful fallback (placeholder + alt text), never a broken-icon glyph.

### Never trick the user
- No "Are you sure?" dialogs on safe actions.
- No fake progress bars.
- No "discount expires in 5 minutes" countdowns (this isn't a dark-pattern e-commerce site).
- No infinite-scroll fatigue baits (pagination is honest about scope).

---

## Accessibility (Cross-Reference)

Accessibility is not a feature — it's a baseline. The platform must be operable via keyboard only and via screen reader. See [[10_Accessibility_Standards]] for the full WCAG handbook. UX-relevant essentials:

- **Tab order** follows visual reading order.
- **Skip-to-content link** as first focusable element.
- **Focus rings** visible, never `outline: none` without replacement.
- **Color is never the only signal.** Every state pairs color with icon or label.
- **Form labels** always visible (not placeholder-only).
- **Headings hierarchical** (h1 → h2 → h3, no skips).
- **Touch targets** ≥44px.
- **Motion respects `prefers-reduced-motion`.**

---

## Keyboard Navigation

For developer audiences, keyboard-first matters. *(Visual Storytellers p. 63 — easter eggs and shortcuts for technical users.)*

Recommended shortcuts:

| Key | Action |
|-----|--------|
| `Cmd/Ctrl + K` | Open command palette / search |
| `Cmd/Ctrl + .` | Toggle dark mode |
| `/` | Focus search |
| `g h` | Go home |
| `g w` | Go to writing index |
| `g p` | Go to projects |
| `?` | Show all shortcuts |
| `Esc` | Close modal / overlay |

Shortcuts are documented in a `?`-triggered modal. Not all users need them, but those who do will value them deeply.

---

## Progressive Enhancement

The site works **without JavaScript** for reading. *(See [[11_Performance_Guide]].)*

- HTML-first article rendering — Markdown → HTML at build time.
- Search degrades to a server-rendered search page (full-page reload).
- Forms post via standard HTTP, with JS-enhanced inline submission as a layer on top.
- Theme toggle works via system preference; JS adds manual override.
- Reading progress bar adds via JS but absence doesn't break reading.

---

## The "Lost Traveler" Page Checklist

Every page must answer three questions for a first-time arrival: *(3 UX Mistakes p. 17.)*

1. **Where am I?** — Breadcrumb or section indicator + clear page title.
2. **What is this site?** — Logo (top-left, linking home) + tagline within reach.
3. **What's next?** — A clear next action: read another, subscribe, contact, related.

Run this audit on every new template.

---

## When to Break Consistency (Decision Rubric)

Three legitimate reasons to deviate. *(Consistency p. 25–33; Web Storytelling p. 23.)*

| Reason | Example | Constraint |
|--------|---------|------------|
| **Draw attention** | One CTA accent-colored | Exactly one per view |
| **Improve usability** | Drop logo on mobile (looks like hamburger); strip nav in focused reading | Document in [[15_Decision_Log_Template]] |
| **Match content tone** | Visual case study uses a non-standard hero | Site chrome (header, footer, nav) stays identical |

Anywhere else, consistency wins.

---

## Decision Framework

When designing or reviewing an interaction:

1. **Does it pass "lost traveler"?** Where am I, what is this, what's next?
2. **Is the friction justified?** Each field, click, or wait must earn its place.
3. **Does feedback close every action loop?** No silent submits.
4. **Does it work without JS?**
5. **Does it work with keyboard only?**
6. **Does it respect `prefers-reduced-motion`?**
7. **Is the interaction Externally consistent?** (Floppy = save, blue underline = link.)
8. **Is it Internally consistent?** Six-axis check (color, typography, language, visuals, layout, interactions). *(Consistency p. 19–20.)*

---

## Rules

1. **Logo upper-left, links home, every page.**
2. **One primary CTA per view.**
3. **All touch targets ≥44px.**
4. **No primary action only on hover.**
5. **No color-only state signals.**
6. **Tab order matches visual order.**
7. **Inline validation, never blocking modal.**
8. **Animation respects reduced-motion.**
9. **Search reachable from every page.**
10. **404 page is helpful, not snarky.**
11. **Every form field has a documented rationale.**
12. **Site is readable with JS disabled.**

---

## Common Mistakes

- **Hover-only primary actions.** *(Consistency p. 10.)*
- **Asterisks on optional fields.** *(Consistency p. 15–17.)*
- **Three primary CTAs at article end.** Choice paralysis. *(White Space p. 25.)*
- **Hamburger nav on desktop.** *(Minimalism p. 11.)*
- **Icon-only navigation.** *(Minimalism p. 32.)*
- **No focus rings.** WCAG fail + UX disaster.
- **Form errors that say "Invalid"** without explaining what to fix.
- **Animation everywhere.** *(Web Storytelling p. 18.)*
- **Designing for "power users only."** Locks out new readers.
- **Auto-playing audio or video.** *(Visual Storytellers p. 44 — sound off by default.)*

---

## Checklist

For every new interaction or template:

- [ ] Passes "Lost Traveler" three-question audit.
- [ ] One primary CTA, accent-colored.
- [ ] Touch targets ≥44px.
- [ ] Keyboard fully navigable.
- [ ] Focus states visible.
- [ ] No color-only signals.
- [ ] Animation respects reduced-motion.
- [ ] Empty + error states designed.
- [ ] Form fields justified individually.
- [ ] External consistency (envelope = email, etc.).
- [ ] Internal consistency (six-axis).
- [ ] Works without JS for reading.
- [ ] Tested on mobile + desktop.

---

## References

- *3 Common UX Mistakes Killing Good Design.* UXPin, 2015 — friction policy, lost-traveler, content-first, animation budget.
- *Consistency in UI Design.* UXPin, 2015 — Least Astonishment, six-axis consistency, when to break.
- *Web UI Design for the Human Eye.* UXPin, 2015 — scanning, hierarchy, F/Z patterns, upper-left anchor.
- *White Space in Web UI Design.* UXPin, 2015 — proximity grouping, choice paralysis.
- *Web UI Trends: The Elegance of Minimalism.* UXPin, 2015 — nav cap at 5, hamburger costs, persona-first.
- *Visual Storyteller's Guide.* UXPin, 2015 — iconic nav, hint at hidden interactions, social approval imagery.
- *Clever Interactive Techniques for Web Storytelling.* UXPin, 2015 — visibility by task criticality.
- *Web UI Trends: Card-Based Design Patterns.* UXPin, 2015 — Fitts's Law, card click target.
- *Getting Started With UX Design Process & Documentation.* UXPin, 2015 — taxonomies, journey maps.

Complementary modern guidance: WCAG 2.2 SC 2.1.1 (Keyboard) and 2.4.7 (Focus Visible); Inclusive Components by Heydon Pickering; Refactoring UI for state design.
