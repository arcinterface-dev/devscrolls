# 12 — Branding Guide

> The voice, visual identity, and personality of the platform.

**Related:** [[01_Project_Vision]] · [[02_Design_Principles]] · [[03_Color_System]] · [[04_Typography_System]] · [[06_Content_Strategy]]

---

## Purpose

This document defines the platform's voice, visual personality, logo direction, illustration system, and trust signals. It exists so that everything — posts, code comments, error messages, OG images, social posts — reads as belonging to the same brand.

---

## Philosophy

The brand voice is **"the thoughtful builder."** *(See [[01_Project_Vision]].)*

The brand is signaled through **restraint and craft**:

- Generous white space signals luxury and credibility. *(White Space p. 27.)*
- Distinctive typography (well-chosen, not decorative) signals taste. *(Minimalism p. 12.)*
- Custom illustration signals authentic effort. *(Visual Storytellers p. 49.)*
- Consistent voice signals reliability. *(Consistency p. 19–20.)*

The brand is **not** signaled by:
- Loud color palettes
- Big logos
- Aggressive CTAs
- Stock photography
- Self-congratulation

---

## Tone of Voice

### Voice attributes

| Attribute | What it means | Example |
|-----------|---------------|---------|
| **Rigorous** | Claims backed by evidence | "Lighthouse scored this 98 after the change — here's the trace." |
| **Calm** | No exclamation marks, no hype | "This works well for most cases; here are the limits." |
| **Curious** | Ask questions in the open | "I'm still figuring out how this should handle edge case X." |
| **Honest** | Admit uncertainty and failure | "This took me three tries. The first two are in the appendix." |
| **Approachable** | Plain language, first person | "I" not "the author." "you" not "the reader" in tutorials. |
| **Crafted** | Word choice, type, color reflect care | "Migrated" not "moved." "Repositioned" not "fixed." |

### Voice anti-attributes

The platform's writing **never** sounds:

- **Hyped**: "This will change everything!" → No.
- **Authoritative**: "As an expert..." → No.
- **Engagement-farming**: "Like and share!" → No.
- **Patronizing**: "Obviously..." / "Simply..." / "Just..." → No.
- **Trendy**: "Web3" / "Crypto" / "Web4" without genuine analysis → No.
- **Defensive**: "Don't @ me but..." → No.

### Writing rules

1. **First person, present tense** for active learning. Past tense for retrospectives.
2. **Concrete > abstract.** "Migrated 200K rows" not "executed a data transformation."
3. **One claim per sentence** in technical writing.
4. **Cite when you can.** Even informally.
5. **Show the failure.** Especially in AI and experimental posts.
6. **End with a question or an opening.** Not a sales pitch.

---

## Writing Personality

The platform writes the way a senior engineer talks at a code review — direct, respectful, generous with context, willing to be wrong.

### Inspirations
- Julia Evans on technical explanation (clarity + visuals)
- Robin Sloan on long-term web thinking (calm, considered)
- Bartosz Ciechanowski on depth (single subject, comprehensive)
- Maggie Appleton on personal knowledge (notes as first-class)
- Linear's changelog on product writing (specific, useful, no hype)

### What we borrow from each
- **Evans**: diagrams, "here's what's happening" pedagogy.
- **Sloan**: long horizons, durable language.
- **Ciechanowski**: depth over breadth, interactive when it helps.
- **Appleton**: digital garden, notes as legitimate writing.
- **Linear**: specific changelogs, no marketing-speak.

---

## Visual Identity

### Logo direction

The logo is **a wordmark**, not a symbol. *(Minimalism p. 12 — type carries identity when ornament is removed.)*

- **Wordmark in the brand display typeface.**
- **Lowercase preferred** — feels approachable, modern.
- **Optional dot or accent character** — restrained ornament (e.g., a period, a colon).
- **Single color** — uses `text-primary` from [[03_Color_System]]. Reverses to `text-inverse` on dark surfaces.
- **No icon mark** initially. If added later, must be derivable from initials or wordmark.
- **Minimum size**: ~80px wide. Maintain padding equal to the cap-height on all sides.

### Logo usage rules
- Top-left of every page, linking home. *(Human Eye p. 21.)*
- Same size and position across all pages.
- Never stretched, never recolored beyond the two token values, never rotated.
- Favicon derived from the wordmark or a single-character mark.
- Apple touch icon, Android maskable icon — derived from the same.

---

## Icon Philosophy

Icons are **functional, not decorative.** *(Visual Storytellers p. 24–32 — iconic for navigation.)*

### Icon system rules
- **One icon family** site-wide. (e.g., Lucide, Heroicons, Phosphor.)
- **Stroke-based**, weight matching the surrounding typography.
- **24×24 base size**, scalable to 16 / 20 / 32.
- **Always pair with text labels** in navigation and primary actions. *(Minimalism p. 32; Visual Storytellers p. 31–32.)*
- **No emoji as UI icons.** Emoji are content, not chrome.
- **Standard meanings**: trash = delete, envelope = email, magnifier = search. *(Consistency p. 13 — UI patterns.)*

### What's in the icon set
A minimal set — only what the platform actually uses:
- Navigation: home, menu (mobile only), search, close.
- Actions: copy, share, bookmark, link, external.
- States: success (✓), warning (⚠), error (✕), info (ⓘ).
- Social: GitHub, Bluesky/Mastodon/X (only the ones actually used).
- Content: code, tag, calendar, clock, author.

Don't import a 1000-icon library and use 12. Tree-shake or hand-pick.

---

## Illustration Style

Custom illustration > generic stock. *(Visual Storytellers p. 49.)*

### Illustration system rules
- **Consistent line weight** across all custom illustrations.
- **Brand color overlay** when reusing photographic imagery. *(Visual Storytellers p. 49.)*
- **Simple geometric language.** Avoid overly cartoonish or hyper-realistic styles.
- **Single accent color** in illustrations matches the brand accent.
- **Functional > decorative.** Diagrams that explain. Hero illustrations that signal topic.

### Types of imagery
1. **Diagrams**: explanatory line-art (architecture, flows, comparisons).
2. **Hero illustrations**: post-specific custom illustration when budget allows.
3. **Screenshots**: with rounded corners and a subtle border or shadow.
4. **Photographs**: people (author, contributors) and topic-specific only. No "hands on keyboard" stock.
5. **Memes / casual visuals**: rare, must match brand voice (calm-curious, not hype).

### Mascot (optional, future)
*Visual Storytellers p. 40–41 suggests a mascot for personality. The platform may consider one for state moments (empty, success, error, 404) — but only if it reads as crafted, not cute.*

### Anti-patterns
- "Diverse people pointing at laptop" stock — banned.
- Memoji/emoji as hero images — banned.
- AI-generated images without disclosure — banned (or disclosed when used experimentally).
- Random unsplash photos labeled "code" — banned.

---

## Color System (Cross-Reference)

The brand color identity is anchored in [[03_Color_System]]:

- **Primary brand color**: dark blue (`#1f3d6b` or similar) — communicates trust and engineering credibility. *(Color Theory p. 11.)*
- **Accent**: a warm hue (amber/orange) reserved exclusively for CTAs, links, active states. *(Color Theory p. 22, 16; Human Eye p. 67.)*
- **Neutrals**: an extensive gray ramp.
- **State colors**: success (green), warning (amber), error (red), info (blue).
- **Dark mode**: first-class, designed not derived.

---

## Typography Identity (Cross-Reference)

The brand typographic identity is anchored in [[04_Typography_System]]:

- **Sans-serif** (default Inter or similar) for body and UI.
- **Serif** (optional, e.g., Source Serif) for editorial headings.
- **Mono** (JetBrains Mono or similar) for code.
- **Distinctive display** treatment for h1 and brand wordmark.
- **Three-level hierarchy** rigorously applied.

The typography *is* the visual identity for a platform with no logomark.

---

## Professional Image

The platform should read, in 5 seconds, as:

> **"A serious technical practitioner. Cares about craft. Worth reading."**

### Signals of professionalism
- Consistent type, color, spacing across all pages.
- No typos, no broken links, no missing images.
- Custom illustration where it matters.
- Performance metrics visible (fast load).
- About page with real biography, real photo, real bona fides.
- Code that runs.
- Citations to real sources.
- Honest dates on all content.

### Anti-signals of professionalism
- Auto-play video.
- Pop-ups asking for email.
- "Limited time offer" CTAs.
- Stock photography clichés.
- Excessive social-share buttons.
- "As seen on" logo bars.
- Cookie banners more elaborate than necessary.

---

## Technical Authority

Authority is **earned**, not claimed.

### How the platform earns it
- **Show the work.** Code, tests, before/after numbers.
- **Show the bugs.** Postmortems, retro posts.
- **Show the unknowns.** "I haven't figured out X yet."
- **Show the sources.** Cite books, papers, talks.
- **Show the durability.** Old posts still work. Old code still runs.

### How the platform avoids over-claiming
- Never "expert" in self-description. Specify experience instead ("Frontend engineer for 8 years").
- No "trusted by Fortune 500" without specifics.
- No certifications listed without explanation.
- No skill bars ("React 95%, CSS 87%"). Show projects instead.

---

## Trustworthiness

Trust is a sum of micro-signals:

| Signal | How it's expressed |
|--------|--------------------|
| **Transparency** | About page explains who, why, how content is funded. |
| **Permanence** | URLs don't change. Archive is complete. |
| **Privacy** | No tracking. No third-party scripts. Privacy page in plain English. |
| **Accessibility** | Site works for everyone (WCAG AA at minimum). |
| **Performance** | Fast pages. Respect for reader time and bandwidth. |
| **Source attribution** | All quotes, code excerpts, ideas credited. |
| **Date honesty** | publishDate + updatedDate visible on every post. |
| **Public mistakes** | Errata posted publicly when a post is corrected. |

---

## Design Persona (Optional)

A design persona is the brand's voice surfaced in micro-copy. *(Visual Storytellers p. 40.)*

### Where it shows up
- Empty states ("Save posts as you read — they'll appear here.")
- Errors ("Email looks invalid — does it have an `@`?")
- 404 ("This page doesn't exist (yet). Try the search or one of these recent posts.")
- Loading states ("Indexing… (this only happens once)")
- Newsletter confirmation ("Thanks. Check your inbox for the confirmation link.")
- Form success ("Thanks for writing. I read every message; expect a reply within a few days.")

### Tone of micro-copy
Same as long-form writing: calm, curious, honest, approachable. No corporate auto-respond. No exclamation marks. No "Oops!" or "Whoops!" cuteness.

---

## Brand Asset Inventory

What lives in the brand asset library:

- Logo wordmark — SVG + variants (light/dark, with/without accent).
- Favicon set — `favicon.ico`, multiple sizes, `apple-touch-icon`, `safari-pinned-tab.svg`.
- OG image template — generated per-post via build script (title + brand wordmark).
- Twitter/X card template — derived from OG.
- Author avatar — high-res photo + circular crop.
- Illustration library — diagrams, hero illustrations.
- Color tokens — JSON / YAML source of truth.
- Type specimens — sample paragraphs for proofing.

All assets live in source control. All assets are versioned.

---

## Decision Framework

When making a brand-touching decision:

1. **Does it match the "thoughtful builder" voice?**
2. **Does it pass the Five-Word Test** (Human Eye p. 52) — would the words readers list match the intended voice?
3. **Does it serve content** or compete with it?
4. **Is it consistent** with established brand assets?
5. **Could the platform's owner write this** in their own voice without cringing?
6. **Does it earn authority** rather than claim it?
7. **Does it respect the reader's time and attention?**

---

## Rules

1. **One brand voice across writing, code comments, UI text, errors, social posts.**
2. **No stock photography.** Custom illustration or topic-specific photos only.
3. **No corporate hype words.** No "revolutionary," "game-changing," "next-gen."
4. **No exclamation marks** in body text.
5. **Logo upper-left, same on every page.**
6. **One icon family** across the site.
7. **State colors used only for state** — never as decorative accents.
8. **Author photo on every article** — social approval signal. *(Visual Storytellers p. 49.)*
9. **Custom OG images** per post, brand-consistent.
10. **Voice survives translation** — translating writing to UI copy preserves tone.

---

## Examples

### Good — error message

> "Couldn't reach the server. This sometimes happens during deploys. Try again in a minute, or [reach out](mailto:...) if it persists."

*Honest, specific, offers next step, calm.*

### Bad — error message

> "Oops! Something went wrong! 😬 Try again later or contact our support team!"

*Cutesy, vague, exclamation marks, "support team" implies enterprise scale.*

### Good — about page opening

> "I'm Santhana — a frontend engineer working on design systems and AI tooling. I write here about what I'm learning, mostly so I can come back to it later."

*First person, specific, honest about motivation.*

### Bad — about page opening

> "Welcome to my world-class digital home, where I share thought-leadership content for the modern developer!"

*Hyped, generic, third-person-feeling, hollow.*

---

## Future Considerations

- **Mascot.** If introduced, must come from a deliberate decision logged in [[15_Decision_Log_Template]]. Should serve state moments, not be the brand mark.
- **Sub-brands.** If specific sections (e.g., AI experiments, a documentation site) need distinct identity, derive from the parent brand — don't fragment.
- **Print stylesheet.** Even though primarily digital, articles should print cleanly with the brand voice intact.
- **Newsletter design.** When introduced, must follow the same voice, color, type rules.
- **Talks and slides.** Same wordmark, same color, same type. Treat presentation as a brand surface.
- **Open-source project READMEs.** Treat as brand surfaces. Same voice.

---

## Common Mistakes

- **Inconsistent voice between posts and UI.** *(Consistency p. 19–20.)*
- **Logo treated as decoration** (centered, animated, resized). It's an anchor.
- **Two icon families** because "I needed one missing icon."
- **Stock photos returning** under deadline pressure. Resist.
- **Hype words creeping into headlines** as the platform grows.
- **Social-share buttons everywhere.** Pick one location, keep it minimal.
- **"As featured in" / "Trusted by"** without specifics or value. Cut these.
- **Skill bars or self-rated proficiency.** Show work, not numbers.

---

## Checklist

For any brand-touching change:

- [ ] Does it pass the Five-Word Test?
- [ ] Does it use the established type, color, icon system?
- [ ] Is the voice consistent with current posts?
- [ ] Is there custom imagery (no stock)?
- [ ] Does it claim or earn authority?
- [ ] Is there an exclamation mark? (Likely cut it.)
- [ ] Does the OG image use the brand template?
- [ ] Does it match across dark/light mode?
- [ ] Does the print version still look brand-aligned?
- [ ] Has it been read aloud — does it sound human?

---

## References

- *The Visual Storyteller's Guide.* UXPin, 2015 — custom illustration, design persona, social-approval imagery, mascots.
- *Color Theory in Web UI Design.* UXPin, 2015 — color psychology, brand justification (dark blue for credibility).
- *White Space in Web UI Design.* UXPin, 2015 — perception of luxury through white space.
- *Web UI Trends: The Elegance of Minimalism.* UXPin, 2015 — typography as identity, single accent as brand.
- *Consistency in UI Design.* UXPin, 2015 — what's expressive vs conformant.
- *Web UI Design for the Human Eye.* UXPin, 2015 — Five-Word Test (p. 52).

Complementary modern guidance:
- *Designing for Emotion* (Aarron Walter) on design persona.
- *Brand Thinking* (Debbie Millman) on brand-as-promise.
- Linear's product writing guide (public) as an example.
- Stripe's documentation style guide (public) for tone.
