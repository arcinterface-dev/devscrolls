# 15 — Decision Log Template

> The audit trail of every non-trivial decision made on the platform.

**Related:** [[01_Project_Vision]] · [[13_Future_Scalability]] · [[14_AI_Context]] · [[16_Checklists]]

---

## Purpose

A **reusable template** and a **growing log** of architectural and design decisions. Each entry is a self-contained record of context, options, decision, and trade-offs.

This is the platform's equivalent of an Architecture Decision Record (ADR). Future contributors — human or AI — read these to understand *why* the platform is the way it is, not just *what* it currently looks like.

> "If your documentation isn't usable, there's no reason to create it." *(10 Pro Tips p. 16.)*
> Decision logs only work if they're written when the decision is fresh, not retroactively.

---

## When to Log

Log any decision that meets **at least one** of these criteria:

1. **Affects a platform invariant** (see [[14_AI_Context]]).
2. **Is irreversible or expensive to reverse.** *(See [[13_Future_Scalability]] five-year test.)*
3. **Sets a precedent** — future decisions will reference it.
4. **Has trade-offs worth remembering.**
5. **Required research** — not obvious from a quick read.

Don't log: typo fixes, dependency upgrades, copy tweaks.
Do log: framework choice, URL structure change, monetization addition, taxonomy revision, brand voice shift.

---

## Template

Copy this for every new entry. File naming: `YYYY-MM-DD-short-slug.md` in `_decisions/`.

```markdown
---
id: 001
title: "Brief decision name"
status: proposed | accepted | rejected | superseded | deprecated
date: 2026-06-30
author: Santhana
deciders: [Santhana]
tags: [architecture, brand, performance]
supersedes: []          # ids of prior entries this replaces
superseded-by: null     # set when a later entry replaces this one
review-date: 2027-06-30 # when this should be re-evaluated
---

## Context

What is the situation that prompted this decision? Include:
- Symptoms of the problem (not just the problem itself).
- Who's affected.
- The emotional landscape — why does this matter?
- How users (or the owner) currently cope without a decision.

*Grounded in 10 Pro Tips p. 22 — Process Map "Define the Problem" phase.*

## Problem

The single sentence that captures what we are solving for.

## Hypothesis

In Wambach format: **If [action] then [outcome] because [customer need / problem].**

*Grounded in 10 Pro Tips p. 12.*

## Options Considered

List at least three options, including one "extreme" or unconventional choice. *(10 Pro Tips p. 9 — consider extreme solutions.)*

### Option A — [name]
- Description.
- Pros.
- Cons.

### Option B — [name]
- ...

### Option C — [extreme option] — [name]
- ...

## Decision

The option chosen. Be specific.

## Rationale

Why this option, not the others? Reference [[02_Design_Principles]], [[01_Project_Vision]], or other docs.

## Trade-offs

What did we give up by choosing this? Be honest.

## Future Impact

How does this affect future decisions? What does it lock in?

## Reversal Cost

How hard would it be to undo this in 1 / 3 / 5 years?
- **Trivial** — change a CSS variable, swap a hosting provider.
- **Moderate** — migrate templates, re-edit posts.
- **High** — re-auth users, migrate data.
- **Catastrophic** — break URLs, lose content.

*Grounded in [[13_Future_Scalability]] five-year test.*

## Review Date

When should this be re-evaluated? (Default: 1 year from acceptance.)

## Outcome (filled in at review)

What actually happened? Was the hypothesis confirmed? What was learned?

*Grounded in 10 Pro Tips Process Map "Test and Refine" phase.*

## Notes

Crap-sandwich format: what worked → what didn't → next steps. *(UX Process p. 26–27.)*
```

---

## Status Lifecycle

```
proposed → accepted → (optional: superseded | deprecated)
proposed → rejected
```

- **proposed**: under consideration, not yet enacted.
- **accepted**: enacted, in effect.
- **rejected**: considered, decided against. Still logged for "why didn't we do X" future reference.
- **superseded**: replaced by a later decision (link via `superseded-by`).
- **deprecated**: no longer in effect, but not replaced (retiring a feature).

---

## Required Fields (per decision)

Each entry must answer four questions immediately. *(UX Process p. 27 — "stakeholders must immediately understand: why, when, how, key takeaways.")*

1. **Why** was this decision made? (Context + Problem)
2. **When** was it made? (Date in frontmatter)
3. **How** was it made? (Options considered + Rationale)
4. **Key takeaways**? (Trade-offs + Future Impact)

If any of these can't be answered, the entry is incomplete.

---

## Anti-Patterns Checklist

Before accepting a decision, verify (must answer **no** to each): *(10 Pro Tips Process Map.)*

- [ ] Are we designing for "everybody"? *(p. 8.)* If yes, narrow the audience.
- [ ] Is this a whack-a-mole symptom fix? *(p. 6.)* If yes, find the root cause.
- [ ] Are we committee-driven (no decider)? *(p. 13.)* If yes, identify the decider.
- [ ] Did we skip the paper / lo-fi prototype stage? *(p. 16–17.)* If yes, prototype first.
- [ ] Is this a document nobody will read? *(p. 16.)* If yes, scrap it.
- [ ] Are we adding without subtracting?  *(Minimalism p. 7.)* If yes, what comes out?
- [ ] Does it violate a platform invariant from [[14_AI_Context]]?  If yes, reconsider or seek explicit approval.

---

## Example Entry

```markdown
---
id: 001
title: "Use Astro instead of Next.js for the platform"
status: accepted
date: 2026-06-30
author: Santhana
deciders: [Santhana]
tags: [architecture, framework, performance]
supersedes: []
superseded-by: null
review-date: 2027-06-30
---

## Context

The platform must serve technical content fast, statically, with minimal JS. The owner is comfortable in React but the platform's interactivity is minimal. Most pages are reading surfaces with occasional interactive components (search, theme toggle, command palette).

Currently no framework is chosen; an initial vendor decision is needed.

## Problem

Which static-site framework best fits a Markdown-first, content-heavy, low-JS platform with island-style interactivity?

## Hypothesis

**If** we use Astro, **then** we ship significantly less JS to readers than a Next.js setup, **because** the platform's interactivity is component-isolated (not app-wide), and Astro's island architecture matches that need exactly.

## Options Considered

### Option A — Astro
- Pros: ships zero JS by default; Markdown/MDX first-class; island pattern matches our needs; growing ecosystem; SSG-friendly.
- Cons: smaller community than Next.js; fewer third-party templates.

### Option B — Next.js
- Pros: huge ecosystem; React-first; familiar to most contributors.
- Cons: ships React runtime even on static pages; over-engineered for our needs; complex perf tuning required.

### Option C — Hand-rolled static generator (extreme option)
- Pros: zero framework lock-in; full control.
- Cons: massive maintenance burden; reinventing wheels; slows content production.

## Decision

**Astro.**

## Rationale

The platform is content-heavy with minimal app-state behavior. Astro's islands hydrate only what needs interactivity, which directly serves [[02_Design_Principles]] Principle 6 (sculpture through subtraction) and [[11_Performance_Guide]] JS budget. Markdown / MDX support is first-class.

Next.js is over-engineered for this need; the extra JS payload conflicts with the platform's performance budget. Hand-rolled would slow content production.

## Trade-offs

- Smaller community = fewer ready-made templates, more first-time-build work.
- React-first habits don't fully transfer; some Astro idioms have a learning curve.
- If a feature requires deep SSR + dynamic per-request rendering, Astro's hybrid mode supports it but is less mature than Next.js's.

## Future Impact

Future surfaces (tools, docs) can also be built in Astro. Content stays in Markdown so a renderer swap remains possible. URL structure is framework-agnostic.

## Reversal Cost

**Moderate.** Templates would need re-implementation; content stays as-is (markdown). URL structure preserved. Estimated 1–2 weeks of focused work to migrate.

## Review Date

2027-06-30 — reassess if Astro maintenance status changes or if requirements shift dramatically.

## Outcome

(to be filled at review)

## Notes

Astro 4.x in use at decision time. The 5.x roadmap was reviewed and considered favorable.
```

---

## Decision Log Index

Maintain `_decisions/INDEX.md` with a one-line summary per entry:

```markdown
# Decision Log Index

| ID | Date | Title | Status |
|----|------|-------|--------|
| 001 | 2026-06-30 | Use Astro instead of Next.js | accepted |
| 002 | 2026-07-15 | URL structure for posts | accepted |
| 003 | 2026-08-01 | Adopt Inter as primary sans | accepted |
| 004 | 2026-09-12 | Reject Google Analytics | accepted |
| ... | ... | ... | ... |
```

---

## When to Update an Entry

Don't edit accepted entries in place (except for typos). Instead:

- **Adding info** — append to "Notes" section with a date.
- **Outcome at review** — fill in "Outcome" at review date.
- **Replacing the decision** — create a new entry, mark prior as `superseded`, link via `superseded-by`.
- **Deprecating** — change status to `deprecated` and add a note explaining why.

Decision log = audit trail. Edit history is a feature, not a bug.

---

## Rules

1. **Every non-trivial decision logged** within a week of being made.
2. **Required fields complete** before status moves to `accepted`.
3. **Hypothesis in Wambach format.**
4. **At least three options considered**, including one extreme/unconventional.
5. **Anti-patterns checklist run** before accepting.
6. **Review date set** for every accepted decision.
7. **Index updated** with each new entry.
8. **Outcomes recorded** at review date.
9. **Superseded entries linked**, not deleted.

---

## Common Mistakes

- **Retroactive logging.** Writing the entry months later loses the *why*.
- **Single-option entries.** "We chose X" without "we considered Y and Z" hides the reasoning.
- **No reversal-cost estimate.** Forgets the five-year test.
- **No review date.** Decision lives forever unchallenged.
- **Editing accepted entries.** Loses the audit trail. Supersede instead.
- **Logging trivia.** Every typo fix doesn't need an entry.
- **Logging in private.** This document should be in the repo, in source control.

---

## Checklist

For every new entry:

- [ ] Decision affects an invariant, is irreversible, sets precedent, or has notable trade-offs?
- [ ] Context, Problem, Hypothesis (Wambach format) written?
- [ ] At least three options listed, one extreme?
- [ ] Anti-patterns checklist run?
- [ ] Decision and Rationale clear, cites docs?
- [ ] Trade-offs honest?
- [ ] Future Impact stated?
- [ ] Reversal Cost categorized (trivial/moderate/high/catastrophic)?
- [ ] Review date set?
- [ ] Status set (proposed/accepted/rejected)?
- [ ] Index updated?

For periodic reviews:

- [ ] Has the review date arrived?
- [ ] Was the hypothesis confirmed?
- [ ] What changed since the decision?
- [ ] Should the decision stand, evolve, or be superseded?
- [ ] Outcome section filled in?

---

## References

PDF sources informing this doc:
- *10 Pro Tips to a Smarter UX Design Process.* UXPin, 2015 — Process Map (p. 22), Wambach hypothesis format (p. 12), anti-patterns checklist (p. 6, 8, 13, 16).
- *Getting Started With UX Design Process & Documentation.* UXPin, 2015 — required fields format (p. 27), crap-sandwich for outcomes (p. 26–27), maintenance comes first.
- *Web UI Trends: The Elegance of Minimalism.* UXPin, 2015 — subtraction discipline.
- *Consistency in UI Design.* UXPin, 2015 — version preservation, when to break consistency justifies decision logging.

Complementary modern guidance:
- Architecture Decision Records (ADRs) — Michael Nygard's original write-up.
- ThoughtWorks Technology Radar method for status tracking.
- *The Design of Everyday Things* (Don Norman) — making invisible decisions visible.
