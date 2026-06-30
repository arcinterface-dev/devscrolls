---
name: log-decision
description: >
  Invoke when making any non-trivial decision on the platform — framework choice,
  URL restructuring, taxonomy revision, monetization addition, brand voice shift,
  or any change that affects a platform invariant.
inputs:
  - title: Brief name of the decision
  - context: What prompted this decision
  - options: At least 3 options considered (including one extreme)
---

# Log Decision Skill

## Knowledge Base Files to Consult

1. `knowledge-base/15_Decision_Log_Template.md` — template, status lifecycle, required fields, anti-patterns
2. `knowledge-base/14_AI_Context.md` — platform invariants (never-change list)
3. `knowledge-base/01_Project_Vision.md` — decision framework, core principles
4. `knowledge-base/13_Future_Scalability.md` — five-year test, reversal cost categories
5. `knowledge-base/16_Checklists.md` — Decision Log checklist in doc 15

## Steps

### 1. Determine if logging is required
Log if the decision meets at least one criterion:
- Affects a platform invariant
- Is irreversible or expensive to reverse
- Sets a precedent for future decisions
- Has trade-offs worth remembering
- Required research (not obvious)

Do NOT log: typo fixes, dependency upgrades, copy tweaks.

### 2. Create the entry file
File naming: `YYYY-MM-DD-short-slug.md` in `knowledge-base/_decisions/`

### 3. Fill in the template

```yaml
---
id: [next sequential ID]
title: "[Brief decision name]"
status: proposed | accepted | rejected
date: YYYY-MM-DD
author: [name]
deciders: [names]
tags: [architecture, brand, performance, etc.]
supersedes: []
superseded-by: null
review-date: YYYY-MM-DD  # default: 1 year from acceptance
---
```

Required sections:
- **Context** — situation, symptoms, who's affected
- **Problem** — single sentence
- **Hypothesis** — Wambach format: "If [action] then [outcome] because [need]"
- **Options Considered** — at least 3, including one extreme
- **Decision** — the chosen option
- **Rationale** — why this, not the others; cite docs
- **Trade-offs** — what was given up (be honest)
- **Future Impact** — what this locks in
- **Reversal Cost** — trivial / moderate / high / catastrophic
- **Review Date** — when to re-evaluate

### 4. Run anti-patterns checklist
Before accepting, verify "no" to each:
- [ ] Designing for "everybody"?
- [ ] Whack-a-mole symptom fix?
- [ ] Committee-driven (no decider)?
- [ ] Skipped prototyping?
- [ ] Document nobody will read?
- [ ] Adding without subtracting?
- [ ] Violates a platform invariant?

### 5. Update the decision log index
Add one-line entry to `knowledge-base/_decisions/INDEX.md`:

```
| [ID] | [Date] | [Title] | [Status] |
```

## Checklist (from 15_Decision_Log_Template)

- [ ] Decision affects invariant, is irreversible, sets precedent, or has notable trade-offs
- [ ] Context, Problem, Hypothesis (Wambach format) written
- [ ] At least three options listed, one extreme
- [ ] Anti-patterns checklist run
- [ ] Decision and Rationale clear, cites docs
- [ ] Trade-offs honest
- [ ] Future Impact stated
- [ ] Reversal Cost categorized
- [ ] Review date set
- [ ] Status set
- [ ] Index updated

## Output

- A decision log entry file in `knowledge-base/_decisions/`
- Updated `_decisions/INDEX.md`
