---
name: review-against-principles
description: >
  Invoke when reviewing any design proposal, UI component, page layout, or
  template against the platform's 12 foundational design principles. Use before
  merging visual changes or approving design mockups.
inputs:
  - target: What to review (component:[name] | page:[url] | template:[name] | mockup:[path])
---

# Review Against Principles Skill

## Knowledge Base Files to Consult

1. `knowledge-base/02_Design_Principles.md` — the 12 principles, decision framework, rules
2. `knowledge-base/03_Color_System.md` — 60/30/10, accent rules, token model
3. `knowledge-base/04_Typography_System.md` — hierarchy, Five-Word Test, measure
4. `knowledge-base/05_UX_Guidelines.md` — Lost Traveler, interaction feedback, consistency
5. `knowledge-base/12_Branding_Guide.md` — voice, visual identity
6. `knowledge-base/16_Checklists.md` — Checklist #7 (UI Review) + Checklist #8 (UX Review)

## Steps

### 1. Walk the Design Decision Framework (from 02_Design_Principles)

Answer these gates in order. If any fails, stop and fix:

1. **Does it serve content?** If defending decoration, reject.
2. **Does it preserve hierarchy?** Is the biggest/brightest element the most important?
3. **Does the user know what to do?** Can a new visitor orient and find next step?
4. **Has it been subtracted enough?** Can anything be removed without breaking the task?
5. **Is it consistent — or deliberately inconsistent?** If inconsistent, what is it drawing attention to?
6. **Does it serve the narrative arc?** What beat (beginning/middle/end)?
7. **Does it respect platform invariants?** Cross-check 14_AI_Context list.

### 2. Check each of the 12 Principles

| # | Principle | Check |
|---|-----------|-------|
| 1 | Content-First | Is content the hero, not chrome? |
| 2 | Visual Hierarchy | ≥3 explicit type levels? Biggest = most important? |
| 3 | White Space | Active use of space? Generous = luxury signal? |
| 4 | Consistency Over Novelty | Core interactions follow conventions? |
| 5 | Inconsistency as Spice | Any deviation justified and documented? |
| 6 | Sculpture Through Subtraction | Can anything else be removed? |
| 7 | Contrast Governs Attention | Warm/saturated reserved for CTAs only? |
| 8 | Scanning Patterns | F-pattern for content, Z-pattern for landing? |
| 9 | One Card = One Thought | Each card has single primary action? |
| 10 | Visuals Carry Meaning | No decorative-only images? Custom > stock? |
| 11 | Make the User a Character | Any personalization opportunity? |
| 12 | Narrative Arc | Beginning, middle, end identifiable? |

### 3. Run the Five-Word Test (from 04_Typography_System)
Look at the design. Write 5 words that come to mind. Compare against target:
> **trustworthy, technical, sharp, considered, readable**

If words include "playful," "decorative," "vintage," "cute," or "edgy" — iterate.

### 4. Color verification
- [ ] All colors from semantic tokens (no raw hex)
- [ ] 60/30/10 dominance preserved
- [ ] One warm accent for action affordances
- [ ] Dark mode tested
- [ ] Code block colors brand-aligned

### 5. Typography verification
- [ ] Body 18px desktop / 17px mobile
- [ ] Line height 1.5–1.6 body
- [ ] Measure ≤ 80ch
- [ ] Three font families max
- [ ] No all-caps in body
- [ ] Hierarchy preserved across templates

### 6. Consistency check (6-axis from Consistency PDF)
- [ ] Color — consistent use of tokens across similar elements
- [ ] Typography — same roles get same treatment
- [ ] Language — same terms for same concepts
- [ ] General visuals — icons, imagery style consistent
- [ ] Layout/location — similar elements in same positions
- [ ] Interactions — same gestures produce same results

## Checklist (from 16_Checklists.md #7 + #8)

### UI Review
- [ ] One clear focal point per view
- [ ] At least 3 typographic levels
- [ ] Biggest/brightest element is most important
- [ ] 60/30/10 dominance preserved
- [ ] One warm accent for action affordances
- [ ] Dark mode tested
- [ ] Grid consistent, spacing from scale
- [ ] Cards: one thought, simple type
- [ ] Navigation: ≤5 items, logo upper-left

### UX Review
- [ ] "Lost Traveler" audit passes
- [ ] ≤5 primary nav items
- [ ] Every action has feedback
- [ ] Empty + error states designed
- [ ] One CTA per view
- [ ] No popups, interstitials, paywalls
- [ ] Page works without JS for reading
- [ ] Touch targets ≥ 44px

## Output

- Review report (markdown) with pass/fail per principle
- Specific issues with element references
- Recommended changes prioritized by principle severity
