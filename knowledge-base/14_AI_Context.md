# 14 — AI Context

> The handoff document for any AI assistant working on this platform — across workspaces, sessions, and models.

**Related:** [[01_Project_Vision]] · [[02_Design_Principles]] · [[05_UX_Guidelines]] · [[12_Branding_Guide]] · [[15_Decision_Log_Template]]

---

## Purpose

This is the single document an AI assistant should read first to understand the platform deeply enough to contribute consistently. It exists because the platform is built across many workspaces, sessions, and AI models — and consistency requires shared invariants.

> "The shared 'wall' of artifacts for an AI collaborator." *(10 Pro Tips p. 18–19.)*
> "Pair design reduces blind spots." *(10 Pro Tips p. 21.)*

If you are an AI reading this in a fresh workspace: **read [[01_Project_Vision]] and [[02_Design_Principles]] before suggesting any changes.**

---

## How to Use This Document

When you (the AI) are asked to:

- **Write a post** → check [[06_Content_Strategy]] + [[12_Branding_Guide]] (voice).
- **Style a component** → check [[03_Color_System]] + [[04_Typography_System]] + [[02_Design_Principles]].
- **Add a feature** → check [[01_Project_Vision]] + [[05_UX_Guidelines]] + [[13_Future_Scalability]].
- **Make an architectural decision** → check [[13_Future_Scalability]] + [[15_Decision_Log_Template]].
- **Optimize performance** → check [[11_Performance_Guide]].
- **Improve SEO** → check [[08_SEO_Master_Guide]].
- **Ensure accessibility** → check [[10_Accessibility_Standards]].

When in doubt, check [[02_Design_Principles]] — it is the constitution.

---

## Project Philosophy (Compressed)

The platform is a **personal technical reading and exhibition platform**:

- Reader-first, not advertiser-first.
- Static-first, dynamic only when justified.
- Performance as respect for reader time.
- Accessibility as baseline.
- Content-first design.
- Permanent URLs.
- Learner voice (never expert).

The brand voice is "the thoughtful builder" — rigorous, calm, curious, honest, approachable, crafted.

---

## Design Rules (Compressed)

From [[02_Design_Principles]]:

1. Content-first. Design serves content.
2. Three explicit hierarchy levels.
3. White space is an active design tool.
4. Principle of Least Astonishment for core interactions.
5. Inconsistency is a spice — use sparingly.
6. Sculpture through subtraction (minimalism as philosophy).
7. Eye attracts to biggest/brightest/warmest/most-isolated.
8. F-pattern for content pages, Z-pattern for landing pages.
9. One card = one thought.
10. Visuals carry meaning — pictures > bullets.
11. Make the user a character.
12. Every experience has beginning, middle, end.

---

## Coding Philosophy

The implementation is currently **Astro + Markdown + TypeScript + minimal React**. But the philosophy outlives the implementation:

### Code quality rules

- **Boring is good.** Standard patterns over clever ones.
- **Semantic HTML first.** ARIA only when needed.
- **Tokens, not magic numbers.** Spacing, color, type all consume tokens.
- **Mobile-first responsive.**
- **No third-party tracking.**
- **Self-host fonts.**
- **Performance budgets are non-negotiable.** *(See [[11_Performance_Guide]].)*
- **Accessibility WCAG AA at minimum.** AAA for body text contrast.
- **Build-time over runtime** for content rendering.

### When generating code, you should:

- Prefer Astro components and `.astro` files for static content.
- Use TypeScript with proper types.
- Use CSS variables for colors (never raw hex in components).
- Use semantic HTML.
- Add alt text to every image.
- Test code samples mentally before suggesting.

### When NOT generating code, you should:

- Not invent fictional libraries or APIs.
- Not suggest features that conflict with the vision.
- Not recommend tracking/analytics by default.
- Not assume frameworks not currently used.

---

## UX Expectations (Compressed)

From [[05_UX_Guidelines]]:

- Logo upper-left, links home, every page.
- One primary CTA per view.
- ≤5 primary nav items.
- Touch targets ≥44px.
- No primary action only on hover.
- No color-only state signals.
- Tab order matches visual order.
- Search reachable from every page.
- 404 is helpful, not snarky.
- Animation respects `prefers-reduced-motion`.

---

## SEO Expectations (Compressed)

From [[08_SEO_Master_Guide]]:

- Unique `<title>` ≤ 60 chars per page.
- Unique meta description 140–160 chars per page.
- Canonical URL on every page.
- One `<h1>` per page; hierarchical headings.
- Open Graph + Twitter Card per post.
- JSON-LD Article schema per post.
- Sitemap auto-generated.
- RSS with full content.
- No keyword stuffing.
- AI-generated content disclosed.

---

## Markdown Standards (Compressed)

From [[06_Content_Strategy]]:

### Frontmatter (required fields)

```yaml
---
title: "Post Title"          # ≤70 chars, ≤7 words preferred
description: "..."           # 140–160 chars
publishDate: 2026-06-30
updatedDate: 2026-07-15      # optional
category: engineering        # one from controlled list
tags: [astro, performance]   # ≤5 from allowlist
heroImage: ./hero.jpg
heroImageAlt: "..."
draft: false
---
```

### Voice rules

- First person, present tense for ongoing learning.
- No exclamation marks in body.
- No "obviously" / "simply" / "just."
- Specific > clever for headlines.
- Cite sources.
- Show failure as well as success.

### Code blocks

- Always specify language.
- Filename comment on first line when context matters.
- Comment to explain *why*, not what.

---

## Decision Priorities

When tradeoffs arise, resolve in this order:

1. **Reader experience.** *(3 UX Mistakes p. 18 — "user requirements steer the ship.")*
2. **Accessibility.** Non-negotiable baseline.
3. **Performance.** Budgets are floors.
4. **Brand voice.** Voice must survive design decisions.
5. **SEO.** A side effect of doing the above right.
6. **Maintainability.** Optimize for the next contributor.
7. **Author/owner preference.** Surfaces when prior tiers don't decide.

---

## Things AI Should NEVER Change Without Explicit Permission

These are platform invariants. Modifying any of these requires explicit owner approval and a [[15_Decision_Log_Template]] entry.

1. **URLs.** Never rename a URL. Never restructure a path. Permanent URLs are sacred.
2. **Primary navigation structure.** ≤5 items. Don't add a 6th without justification.
3. **The brand voice.** Don't shift from "thoughtful builder" to "marketer."
4. **Color tokens at the palette layer.** Semantic tokens can be remapped; raw palette values cannot.
5. **Typography roles.** Don't introduce a 4th font family.
6. **Markdown frontmatter schema.** Adding fields requires a migration plan.
7. **Privacy posture.** No tracking. No ads (unless [[09_Google_AdSense_Guide]] criteria are met).
8. **Author identity.** Don't rewrite the "about me" without context.
9. **Existing posts' content.** Don't edit published posts beyond typo fixes / link updates without an "Updated" note.
10. **The five-year-test commitments** in [[13_Future_Scalability]].

### When you're tempted to change one of these:

Pause. Ask the owner. Log the question. Don't ship a change to invariants under time pressure.

---

## Things AI May Improve Without Permission

These are optimizations within established rules:

1. **Add cross-links** between posts that are clearly related (must be accurate).
2. **Fix typos and grammar** in drafts (not published posts without flagging).
3. **Optimize images** within performance budget rules.
4. **Improve alt text** to be more descriptive.
5. **Add JSON-LD structured data** where missing.
6. **Add `prefers-reduced-motion` support** where missing.
7. **Add focus styles** where missing.
8. **Refactor code** for clarity within existing patterns.
9. **Update outdated dates** in templates (year, copyright).
10. **Replace stock-feeling phrasing** with more specific language consistent with voice.
11. **Add semantic HTML** where it's been replaced by `<div>` soup.
12. **Suggest** improvements to the owner via comments — but don't ship without approval.

---

## How to Interact With Other AI Assistants

The platform may be touched by multiple AI tools (Claude, Cursor, GitHub Copilot, future agents). When you're one of them:

- **Read [[15_Decision_Log_Template]]** to understand the trail of past decisions.
- **Read recent commit messages** to understand recent intent.
- **Write your own decision-log entries** for non-trivial changes.
- **Don't undo** previous AI's work unless you understand why.
- **Flag uncertainty.** "I think this is right but should confirm with owner."

---

## How to Handle Ambiguity

When an instruction is ambiguous:

1. **Re-read the relevant documentation** in this knowledge base.
2. **Check the [[15_Decision_Log_Template]]** for prior decisions.
3. **Default to the more conservative option** (reversible, preserves invariants).
4. **Flag the ambiguity** in your response to the owner. Don't silently choose.
5. **Don't make irreversible decisions** under ambiguity.

---

## Pattern Library Reference

When generating UI/components, refer to these patterns documented elsewhere:

| Pattern | Documented in |
|---------|--------------|
| Color tokens (semantic + palette layers) | [[03_Color_System]] |
| Type scale (display/h1-h4/lead/body/ui/small/xs/code) | [[04_Typography_System]] |
| Article anatomy (top to bottom) | [[06_Content_Strategy]] |
| Card component (7 components) | [[02_Design_Principles]] Principle 9 |
| F-pattern + Z-pattern templates | [[02_Design_Principles]] Principle 8 + [[05_UX_Guidelines]] |
| Callouts (Note, Tip, Warning, Danger) | [[06_Content_Strategy]] + [[03_Color_System]] state-* tokens |
| URL patterns | [[07_Information_Architecture]] |
| Image optimization | [[11_Performance_Guide]] |
| Form patterns | [[05_UX_Guidelines]] + [[10_Accessibility_Standards]] |
| Loading and empty states | [[05_UX_Guidelines]] + [[12_Branding_Guide]] |

---

## Common AI Mistakes to Avoid

Patterns where AI assistants frequently err on this platform:

1. **Generic stock-photo recommendations.** *(Visual Storytellers p. 49.)* Always custom.
2. **Suggesting Google Fonts CDN.** Self-hosted only.
3. **Recommending Google Analytics.** None or privacy-respecting only.
4. **Suggesting carousels.** Almost always wrong here.
5. **Hamburger nav on desktop.** *(Minimalism p. 11.)*
6. **Three primary CTAs at article end.** One only.
7. **Adding tracking pixels** for "engagement insights."
8. **Auto-playing media.**
9. **Inventing new colors instead of using existing tokens.**
10. **Using `<div onclick>` instead of `<button>`.**
11. **Removing focus styles** for "cleaner design."
12. **Adding "subscribe to keep reading" gates.**
13. **Re-naming URLs** "for SEO."
14. **Suggesting popups** for newsletter signup.
15. **Adding a CMS or backend** when static + markdown suffices.
16. **Treating the platform as a startup product** instead of a personal practice.

---

## Quick-Reference Checklist (for any AI contribution)

Before suggesting or shipping any change:

- [ ] Does it serve the reader?
- [ ] Does it match the brand voice?
- [ ] Does it preserve URLs?
- [ ] Does it use semantic tokens (color, type, spacing)?
- [ ] Does it pass WCAG AA?
- [ ] Does it fit performance budget?
- [ ] Does it preserve permanent URLs?
- [ ] Does it touch a platform invariant? (If yes, stop and ask.)
- [ ] Did I document the change in [[15_Decision_Log_Template]] if significant?
- [ ] Did I use existing patterns rather than inventing?
- [ ] Is the change reversible?

---

## Communication With the Owner

When responding to the platform's owner:

- **Be concise.** State the change, the rationale, the tradeoffs.
- **Flag uncertainty.** "I'm not 100% sure this aligns with your vision because X."
- **Cite the docs.** Reference [[02_Design_Principles]] or [[01_Project_Vision]] when defending a choice.
- **Offer alternatives.** When the request might conflict with invariants, propose two paths and let the owner decide.
- **Don't agree reflexively.** If a request conflicts with documentation, raise it — politely.

---

## How to Update This Document

This document is *itself* a piece of the knowledge base. When the platform evolves:

- New invariants get added to the "Never change without permission" list.
- New permissible improvements get added to the "May improve" list.
- New patterns get added to the Pattern Library Reference.
- Outdated guidance gets revised, not removed (the change itself is information).

---

## The Five Most Important Rules (TL;DR)

If you read nothing else:

1. **Content first.** The reader's experience of the writing is paramount.
2. **Permanent URLs.** Never rename a path.
3. **Static-first.** Don't reach for backends until justified.
4. **Brand voice is sacred.** Calm, curious, honest, approachable.
5. **When in doubt, ask** the owner before shipping. Reversible > optimal.

---

## References

PDF sources informing this doc:
- *10 Pro Tips to a Smarter UX Design Process.* UXPin, 2015 — shared "wall" of artifacts (p. 18–19), pair-design with AI (p. 21).
- *3 Common UX Mistakes Killing Good Design.* UXPin, 2015 — three anti-patterns to flag, content-first ordering.
- *Consistency in UI Design.* UXPin, 2015 — Least Astonishment, six-axis consistency, preservation of terminology.
- *Getting Started With UX Design Process & Documentation.* UXPin, 2015 — learner mindset (p. 31), maintenance comes first.

The other 7 PDFs are referenced throughout this knowledge base.
