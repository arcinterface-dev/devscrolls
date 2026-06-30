---
name: new-component
description: >
  Invoke when creating a new reusable Astro/React component for the platform's
  design system — buttons, cards, callouts, navigation elements, form controls, etc.
  Ensures the component follows all design principles, uses design tokens, and
  meets accessibility standards.
inputs:
  - component_name: Name of the component (e.g., Card, Button, Callout)
  - component_type: astro | react-island | both
  - interactive: Whether the component requires client-side JS
---

# New Component Skill

## Knowledge Base Files to Consult

1. `knowledge-base/02_Design_Principles.md` — 12 principles, especially #4 (consistency), #6 (subtraction), #9 (one card = one thought)
2. `knowledge-base/03_Color_System.md` — semantic token model, state colors, CTA colors
3. `knowledge-base/04_Typography_System.md` — type scale tokens, code typography
4. `knowledge-base/05_UX_Guidelines.md` — interaction feedback, touch targets, animation budget
5. `knowledge-base/10_Accessibility_Standards.md` — keyboard, focus, ARIA, screen reader
6. `knowledge-base/11_Performance_Guide.md` — JS budget, hydration strategy
7. `knowledge-base/16_Checklists.md` — Checklist #3 (New Feature) + #7 (UI Review)

## Rationale

Components are the most repeated unit in the codebase. Getting them right once avoids
compounding design debt. This skill ensures every component is born with tokens, states,
accessibility, and performance considered — not bolted on later.

## Steps

### 1. Define the component's role
- What content or action does it serve?
- Which persona benefits?
- Does a similar component already exist?

### 2. Design with tokens
- Use semantic color tokens (never raw hex)
- Use type scale tokens
- Use spacing scale tokens
- Define all visual states: default, hover, focus, active, disabled

### 3. Implement accessibility
- Use semantic HTML (`<button>`, `<a>`, `<nav>`, etc.)
- Add ARIA only if semantic HTML doesn't suffice
- Ensure keyboard operability
- Visible focus rings
- Touch targets ≥ 44px
- Color is never the only signal

### 4. Handle states
- Default state
- Hover state
- Focus state (visible ring)
- Active/pressed state
- Disabled state (prefer not-rendering over disabled)
- Loading state (if async)
- Error state (if applicable)
- Empty state (if content-dependent)

### 5. Performance
- Prefer Astro component (zero JS) unless interactivity required
- If React: use `client:visible` or `client:idle` hydration
- Keep JS footprint within budget
- No render-blocking

### 6. Animation
- 150–250ms ease-out for state changes
- Animate only `transform` and `opacity`
- Respect `prefers-reduced-motion`

### 7. Test
- Keyboard navigation
- Screen reader (VoiceOver / NVDA)
- Mobile + desktop
- Light + dark mode
- Reduced motion

## Checklist

- [ ] Uses semantic HTML
- [ ] Uses design tokens (color, type, spacing)
- [ ] All visual states designed (default/hover/focus/active/disabled)
- [ ] Keyboard operable
- [ ] Focus rings visible
- [ ] Touch targets ≥ 44px
- [ ] ARIA only where semantic HTML doesn't suffice
- [ ] Animation respects `prefers-reduced-motion`
- [ ] Works without JS (for non-interactive variants)
- [ ] JS footprint within budget
- [ ] Light + dark mode tested
- [ ] Mobile + desktop tested
- [ ] Screen-reader tested

## Output

- Component file(s) (.astro and/or .tsx)
- Associated styles using CSS custom properties
- Usage documentation / examples
