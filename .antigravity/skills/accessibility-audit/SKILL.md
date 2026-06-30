---
name: accessibility-audit
description: >
  Invoke when auditing the platform for WCAG 2.2 AA compliance. Run quarterly,
  before major releases, or when accessibility concerns are raised.
inputs:
  - scope: What to audit (full-site | template:[name] | component:[name] | page:[url])
  - depth: automated-only | automated+manual | full (includes screen reader testing)
---

# Accessibility Audit Skill

## Knowledge Base Files to Consult

1. `knowledge-base/10_Accessibility_Standards.md` — WCAG 2.2 targets, keyboard nav, screen reader, ARIA, focus, forms
2. `knowledge-base/03_Color_System.md` — contrast ratios, color-blind safety, state colors
3. `knowledge-base/04_Typography_System.md` — reading accessibility, heading hierarchy
4. `knowledge-base/05_UX_Guidelines.md` — keyboard shortcuts, touch targets, motion reduction
5. `knowledge-base/16_Checklists.md` — Checklist #5 (Accessibility Review)

## Steps

### 1. Automated testing
Run these tools and capture results:
- **Lighthouse Accessibility** — target ≥ 95 per template
- **axe DevTools** — no critical violations
- **pa11y-ci** — passes in build pipeline

### 2. Manual keyboard testing
- [ ] Skip-to-content link is first focusable element
- [ ] Every interactive element reachable via Tab
- [ ] Focus order matches visual reading order
- [ ] Focus rings always visible (2px ring, accent color, 2px offset)
- [ ] Esc closes modals and overlays
- [ ] Modal focus traps work correctly
- [ ] No keyboard-only or mouse-only exclusive interactions

### 3. Screen reader testing
Test with at least two screen readers:
- **VoiceOver (macOS)** on home + article + form
- **NVDA (Windows)** on home + article + form

Verify:
- [ ] Headings announce hierarchy correctly
- [ ] Form labels are associated
- [ ] Live regions work for dynamic content (search, toasts)
- [ ] ARIA is used only where semantic HTML doesn't suffice

### 4. Vision testing
- [ ] 200% zoom — layout holds on each template
- [ ] High contrast mode — design holds
- [ ] Forced colors (Windows) — design survives
- [ ] Color blindness simulator (deuteranopia, protanopia, tritanopia)

### 5. Contrast verification
Check all text/surface pairs against WCAG requirements:

| Use | AA | AAA (target) |
|-----|-----|------|
| Body text ≤ 18px | 4.5:1 | 7:1 |
| Large text (≥18.66px or ≥14px bold) | 3:1 | 4.5:1 |
| Non-text (UI controls, focus rings) | 3:1 | — |

### 6. Motion reduction
- [ ] `prefers-reduced-motion` honored globally
- [ ] No autoplay sound
- [ ] Video has controls + poster fallback

### 7. Touch targets
- [ ] All touch targets ≥ 44px
- [ ] No targets within 8px of each other

## Checklist (from 16_Checklists.md #5)

### Automated
- [ ] Lighthouse Accessibility ≥ 95 per template
- [ ] axe DevTools no critical violations
- [ ] pa11y-ci passes in build

### Manual — keyboard
- [ ] Skip-to-content link first focusable
- [ ] Every interactive element reachable
- [ ] Focus order matches visual order
- [ ] Focus rings always visible
- [ ] Esc closes modals
- [ ] Modal focus traps work

### Manual — screen reader
- [ ] VoiceOver test on home + article + form
- [ ] NVDA test on home + article + form
- [ ] Headings announce hierarchy correctly
- [ ] Form labels associated
- [ ] Live regions for dynamic content
- [ ] ARIA only where needed

### Manual — vision
- [ ] 200% zoom test
- [ ] High contrast mode test
- [ ] Forced colors test
- [ ] Color blindness simulator

### Manual — motion
- [ ] `prefers-reduced-motion` honored
- [ ] No autoplay sound
- [ ] Video has controls + poster

### Touch
- [ ] All touch targets ≥ 44px
- [ ] No targets within 8px of each other

## Output

- Audit report (markdown) with findings, severity, and remediation steps
- List of WCAG criterion violations with specific elements
- Recommended fixes prioritized by severity
