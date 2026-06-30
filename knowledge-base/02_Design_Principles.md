# 02 — Design Principles

> The foundational design principles that govern every visual and structural decision on the platform.

**Related:** [[01_Project_Vision]] · [[03_Color_System]] · [[04_Typography_System]] · [[05_UX_Guidelines]] · [[12_Branding_Guide]] · [[14_AI_Context]]

---

## Purpose

This document is the **constitution** of the platform's design. Every other design document — Color, Typography, UX, Branding — interprets these principles for its own scope. When two documents disagree, this one wins.

It exists so that:
- The platform's visual identity stays coherent across years and contributors.
- Future AI assistants and humans evaluate design proposals against shared invariants.
- "Why does this exist?" has a canonical answer.

---

## Philosophy

Design serves content; content serves the reader. *(3 Common UX Mistakes p. 12; Minimalism p. 8.)* Every other principle in this document is downstream of that single sentence.

A technical reading and portfolio platform succeeds when:
1. Long-form content is unmistakably the hero.
2. Chrome (nav, footers, sidebars) recedes until the reader needs it.
3. Visual hierarchy makes structure scannable in seconds. *(Human Eye p. 19–28.)*
4. Decisions accumulate into a coherent system, not ad-hoc styling. *(Consistency p. 18.)*

---

## The Twelve Principles

### 1. Content-First Design
> Design in the absence of content is not design, it's decoration. — Zeldman *(Human Eye p. 9)*

Build layouts around real content — actual article drafts, real titles, real code blocks. Lorem ipsum hides design failures that surface only at launch. *(Human Eye p. 9–18; 3 UX Mistakes p. 10–12.)*

Decision order is fixed: **Content structure → Interaction → Visual.** *(3 UX Mistakes p. 10–12.)* Reverse this order and you encode wrong assumptions.

### 2. Visual Hierarchy Is Non-Negotiable
Every page has at least three explicit type levels (primary, secondary, tertiary). *(Human Eye p. 62–64.)* Without them, scanning collapses into noise.

Hierarchy is built by manipulating: **Size, Weight, Italics, Capitalization, Color, Contrast, Space, Position, Orientation, Texture.** *(Human Eye p. 65–69.)*

The eye is always drawn to the **biggest and brightest** element. *(Human Eye p. 41.)* Make sure that element is the most important.

### 3. White Space Is an Active Design Tool
White space is not absence — it is a vacuum that draws attention to surrounding content. *(White Space p. 7.)* It serves four jobs simultaneously: **eye-scanning, legibility, aesthetics, luxury perception.** *(White Space p. 9.)*

Two axes structure every spacing decision:
- **Macro vs micro** — between large elements vs within small ones.
- **Passive vs active** — invisible baseline vs deliberate attention-direction.

**Generous white space = perceived luxury.** *(White Space p. 27.)* The platform leans heavy-to-balanced to signal craft and authority.

### 4. Consistency Over Novelty for Core Functions
**Principle of Least Astonishment.** *(Consistency p. 10.)* Delightful surprises are fine, but core interactions must not stray from norms. Don't make primary actions appear only on hover. Don't redefine universal icons.

Two kinds of consistency must be balanced:
- **External** — match the outside world and platform conventions. *(Consistency p. 12.)*
- **Internal** — match yourself across pages, components, terminology. *(Consistency p. 18.)*

Six axes of internal consistency: **Color, Typography, Language, General visuals, Layout/location, Interactions.** *(Consistency p. 19–20.)*

### 5. Inconsistency Is a Spice
> A pinch is enough; too much spoils the design. — *(Consistency p. 26.)*

Inconsistency only signals when everything else is consistent. Reserve deviation for:
- **Drawing attention** — one CTA per page.
- **Usability** — when consistency hurts (e.g., dropping logo on mobile because it looks like hamburger). *(Consistency p. 27.)*
- **Content tone** — different page templates for different content types (Jawbone case). *(Consistency p. 28–30.)*

> **Rule:** Usability trumps consistency, BUT consistency in navigation is essential for orientation. *(Consistency p. 33.)*

### 6. Sculpture Through Subtraction (Minimalism as Philosophy)
> Perfection is achieved not when there's nothing more to add, but when there's nothing more you can take away. *(Minimalism p. 7.)*

Iterate by **removing**, not adding. Every component must justify itself. Minimalism is a *philosophy that prioritizes content*, not a visual style. *(Minimalism p. 8, 23, 33.)*

But: **Never delete irreplaceable functionality.** *(Minimalism p. 33.)* Subtract until the design almost fails, then user-test, stop at the tipping point. *(White Space p. 26.)*

### 7. Eye Attraction Is Governed by Contrast
The eye is drawn to the **biggest, brightest, warmest, most isolated**. *(Human Eye p. 41, 67.)*

- **Warm > cool** for attention. *(Human Eye p. 67.)*
- **Saturated > muted** for attention. *(Human Eye p. 67.)*
- **Isolated by space > clustered.** *(White Space p. 16–17.)*

One warm accent reserved for CTAs/links. Cool/neutral everywhere else.

### 8. Scanning Patterns Drive Layout Choice
Users read only ~20% of words. *(Human Eye p. 20, citing Nielsen.)*

- **F-pattern** for content-heavy pages (blog index, archives, article body). Horizontal across top, vertical down left.
- **Z-pattern** for sparse action-oriented pages (landing, hire-me, course pages). Top-left → top-right → diagonal down-left → bottom-right CTA.

**F organizes content; Z emphasizes a CTA.** *(Human Eye p. 35, 41.)*

The **upper-left** is the only spot guaranteed to be seen — logo lives there. *(Human Eye p. 21.)*

### 9. One Card = One Thought
Each card represents a single primary action or piece of content. *(Card-Based p. 7.)* Avoid stacking secondary actions at equal weight.

The seven components of a successful card: plenty of space, one piece of info, clear crisp image (50–75% of area), simple typography, **one** unexpected detail (sparingly), open consistent grid, prioritize usability over aesthetics. *(Card-Based p. 22–23.)*

Cards generalize: this rule applies to any composable component (callout, table row, navigation tile).

### 10. Visuals Are the Primary Medium of Meaning
Pictures convey up to **6×** more information than words alone; processed up to **60,000× faster** than text. *(Visual Storytellers p. 11, 16.)*

- **Bullet points are NOT pictures.** *(Visual Storytellers p. 22.)*
- Every substantive section pairs prose with a relevant visual.
- Three image types serve different jobs: **iconic** (literal — navigation), **symbolic** (abstract — brand marks), **indexical** (association — mood/emotion). *(Visual Storytellers p. 24–31.)*
- **Custom > stock.** Stock photos and stock illustrations are differentiation enemies. *(Visual Storytellers p. 49.)*

### 11. Make the User a Character
Personalize via input or real-time data so the experience is about **them**. *(Web Storytelling p. 8–10; Visual Storytellers p. 52–54.)*

Examples for this platform:
- "Read this as [Frontend / Backend / Designer]" toggles.
- Code examples that swap to the reader's stack.
- "Recommended for you" feeds based on reading history.
- Personalized reading-time estimates.

### 12. Every Experience Has a Narrative Arc
Beginning, middle, end — mapped from the **user's** POV. *(Web Storytelling p. 24–25; Visual Storytellers p. 17, 65–66.)*

- **Article**: hook (intro) → engagement (body) → resolution (CTA).
- **Site**: stimulus (search/social arrival) → engagement (read, explore) → resolution (subscribe, contact).
- **Component**: default → interaction → confirmation.

If you can't identify the three beats, you don't have a design — you have an arrangement of elements.

---

## Decision Framework

When evaluating ANY design proposal, walk through these gates in order:

1. **Does it serve content?** *(Principle 1.)* If the answer requires defending decoration, reject.
2. **Does it preserve hierarchy?** *(Principle 2.)* Is the most important element still the biggest/brightest?
3. **Does the user know what to do?** *(Principle 4 + 8.)* If a new visitor can't immediately orient and find the next step, redesign.
4. **Has it been subtracted enough?** *(Principle 6.)* Can anything be removed without breaking the user task?
5. **Is it consistent — or deliberately inconsistent?** *(Principle 4 + 5.)* If deliberately inconsistent, what specifically is it drawing attention to? Justify in [[15_Decision_Log_Template]].
6. **Does it serve the narrative arc?** *(Principle 12.)* What beat?
7. **Does it respect the platform's invariants?** Cross-check against [[14_AI_Context]] invariants list.

---

## Rules

1. **Real content drives layout.** No locking down templates on lorem ipsum. *(Human Eye p. 16.)*
2. **One primary CTA per view.** *(White Space p. 25; Minimalism p. 24.)*
3. **Logo always upper-left, always links home.** *(Human Eye p. 21; Consistency p. 13.)*
4. **Primary navigation: 5 items maximum.** *(Minimalism p. 24.)*
5. **Use F-pattern for content pages, Z-pattern for landing pages.** *(Human Eye p. 41.)*
6. **One warm accent reserved for action affordances.** *(Human Eye p. 67.)*
7. **Body type is plain on purpose.** *(Human Eye p. 63.)*
8. **Whole-card click target with secondary controls ≥44px.** *(Card-Based p. 23; 3 UX Mistakes p. 17.)*
9. **Every visual decision needs a content justification.** *(3 UX Mistakes p. 12.)*
10. **No primary action hidden behind hover.** *(Consistency p. 10.)*
11. **Animation is restrained and respects `prefers-reduced-motion`.** *(3 UX Mistakes p. 7; Web Storytelling p. 18.)*
12. **Custom illustration, no generic stock.** *(Visual Storytellers p. 49.)*

---

## Examples

### Good — featured-post promotion

> Promote one post per week to a "hero card": full-bleed image, oversized title, dedicated accent color. All other cards stay standard size. → Embodies: mixed-size hierarchy *(Card-Based p. 27)*, drawing attention via deliberate inconsistency *(Consistency p. 25–26)*, one focal point per view *(Human Eye p. 41)*.

### Bad — three "primary" CTAs at article end

> "Subscribe," "Read related," and "Comment" all styled identically with accent color. → Violates Principle 2 (no hierarchy among them), Principle 4 (decision paralysis), Principle 5 (inconsistency spice spilled too liberally). *(White Space p. 25.)*

### Bad — flashy hero animation that lasts 8 seconds

> User must wait through the animation before reading. → Violates Principle 1 (content second), Principle 7 (animation isolates wrong element). Time-box hero animations to capture interest, then yield to content quickly. *(3 UX Mistakes p. 7.)*

---

## Future Considerations

- **Personalization layer.** As Principle 11 evolves, the platform may offer reader-tracked personalization (stack preference, theme preference, reading-list).
- **Editorial templates.** As content matures, multiple per-type templates may emerge (tutorial, essay, case study, note, talk). Each must preserve the principles, not each invent its own.
- **Live components.** Future "now" cards, GitHub activity, live build status. *(Card-Based p. 25–26.)* Must respect content-first and not overshadow articles.
- **Motion system.** As the design system matures, a motion vocabulary (durations, easings, signature transitions) should be codified. *(Web Storytelling p. 18.)*

---

## Common Mistakes

- **Designing for self, not user.** *(3 UX Mistakes p. 5.)* "Isolate passion from ego."
- **Mistaking UX for UI.** *(3 UX Mistakes p. 9–10.)* Polish without research = pretty failure.
- **Pinterest-clone card sameness.** *(Card-Based p. 19.)* Identical card heights, no typography variation.
- **Hamburger nav on desktop.** *(Minimalism p. 11–12.)* Reduces discoverability; ~52% comprehension over 44 years.
- **Animation everywhere.** *(Web Storytelling p. 18.)* Effects compound and dilute.
- **Bullet points masquerading as visuals.** *(Visual Storytellers p. 22.)*
- **Inverting universal icons** (e.g., asterisks for optional fields). *(Consistency p. 15–17.)*
- **Designing for "everybody."** *(10 Pro Tips p. 8.)* Scope creep guaranteed.

---

## Checklist

Before approving a design proposal:

- [ ] Does real content drive the layout?
- [ ] Are there ≥3 hierarchy levels?
- [ ] Is the biggest/brightest element the most important?
- [ ] Is the logo upper-left and linking home?
- [ ] Is there exactly one primary CTA?
- [ ] Does the layout follow F or Z deliberately?
- [ ] Have I subtracted as much as possible without breaking tasks?
- [ ] Is there a narrative arc (beginning/middle/end)?
- [ ] Are core interactions externally consistent?
- [ ] Are any inconsistencies justified in writing?
- [ ] Does the accent color do exactly one job?
- [ ] Do visuals carry meaning (not just decoration)?

---

## References

Direct PDF sources:
- *Web UI Design for the Human Eye.* UXPin, 2015 — scanning, hierarchy, contrast levers, content-first.
- *White Space in Web UI Design.* UXPin, 2015 — active space, perception of luxury.
- *Consistency in UI Design.* UXPin, 2015 — internal/external, spice metaphor.
- *Color Theory in Web UI Design.* UXPin, 2015 — psychology, schemes, 60/30/10.
- *Web UI Trends: Card-Based Design Patterns.* UXPin, 2015 — one card = one thought.
- *Web UI Trends: The Elegance of Minimalism.* UXPin, 2015 — subtractive design.
- *3 Common UX Mistakes Killing Good Design.* UXPin, 2015 — content-first ordering.
- *Visual Storyteller's Guide.* UXPin, 2015 — picture superiority, iconic/symbolic/indexical.
- *Clever Interactive Techniques for Web Storytelling.* UXPin, 2015 — narrative arc, restraint.

Complementary modern guidance: Nielsen Norman Group on F-pattern eye-tracking; *Refactoring UI* (Wathan & Schoger) on hierarchy levers; Web.dev on Core Web Vitals as a design constraint.
