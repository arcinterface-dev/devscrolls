---
name: scaffold-design-tokens
description: >
  Invoke when setting up or modifying the platform's design token system —
  color palette, semantic color tokens, typography scale, spacing scale,
  and dark mode mappings. This is a foundational task; most other skills depend on it.
inputs:
  - scope: What to scaffold (colors | typography | spacing | all)
  - mode: Whether to include dark mode mappings (default: true)
---

# Scaffold Design Tokens Skill

## Knowledge Base Files to Consult

1. `knowledge-base/03_Color_System.md` — palette philosophy, 3-layer token model, 60/30/10, dark mode
2. `knowledge-base/04_Typography_System.md` — font pairing, modular scale, measure, mobile adjustments
3. `knowledge-base/02_Design_Principles.md` — hierarchy, white space, contrast rules
4. `knowledge-base/10_Accessibility_Standards.md` — contrast ratios (4.5:1, 7:1)
5. `knowledge-base/11_Performance_Guide.md` — font optimization, CSS budget

## Steps

### 1. Define palette layer (raw values)
Create CSS custom properties for the raw color ramps:
```
--blue-50 → --blue-900     (brand ramp, 10 stops)
--gray-50 → --gray-950     (neutral ramp, 11 stops)
--amber-50 → --amber-900   (warm accent ramp, 10 stops)
--green-500, --red-500, --yellow-500  (state hues)
```

### 2. Define semantic layer (role-based)
Map semantic tokens to palette tokens:
```
text-primary, text-secondary, text-muted, text-inverse, text-link, text-link-hover
surface-base, surface-raised, surface-sunken, surface-inverse, surface-overlay
border-subtle, border-default, border-strong, border-focus
state-success, state-warning, state-error, state-info
syntax-comment, syntax-keyword, syntax-string, syntax-function, syntax-number
accent-default, accent-hover, accent-active
```

### 3. Define dark mode mappings
- Surface-base: `#0f1115` (soft dark, not pure black)
- Body text: `#e8e9eb` (not pure white)
- Reduce saturation on accent colors by ~10%
- Tune syntax highlighting for dark surface contrast
- Test WCAG AA against dark surfaces

### 4. Define typography tokens
Per the modular scale from 04_Typography_System:

| Token | Desktop | Mobile (≤640px) | Line height | Weight |
|-------|---------|-----------------|-------------|--------|
| display | 60px | 36px | 1.05 | 700 |
| h1 | 40px | 30px | 1.1 | 700 |
| h2 | 30px | 24px | 1.2 | 600 |
| h3 | 24px | — | 1.25 | 600 |
| h4 | 20px | — | 1.3 | 600 |
| lead | 20px | — | 1.5 | 400 |
| body | 18px | 17px | 1.6 | 400 |
| ui | 16px | — | 1.5 | 400 |
| small | 14px | — | 1.5 | 400 |
| xs | 12px | — | 1.4 | 500 |
| code | 15px | 14px | 1.6 | 400 |

### 5. Define font stack
```css
--font-sans: 'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif;
--font-mono: 'JetBrains Mono', ui-monospace, 'Cascadia Code', monospace;
--font-serif: /* optional, if decided */;
```

### 6. Define spacing scale
Consistent spacing tokens (e.g., 4px base unit):
```
--space-1: 0.25rem (4px)
--space-2: 0.5rem (8px)
--space-3: 0.75rem (12px)
--space-4: 1rem (16px)
--space-6: 1.5rem (24px)
--space-8: 2rem (32px)
--space-12: 3rem (48px)
--space-16: 4rem (64px)
--space-24: 6rem (96px)
```

### 7. Verify
- Run contrast checks on all text/surface pairs (body: 7:1, UI: 4.5:1, non-text: 3:1)
- Check 60/30/10 dominance balance
- Verify both light and dark modes
- Test with real article content, not lorem ipsum
- Run the Five-Word Test on typography choices

## Checklist (from 03_Color_System + 04_Typography_System)

### Color
- [ ] All colors map to semantic tokens
- [ ] WCAG AA contrast (AAA for body text)
- [ ] Works in both light and dark modes
- [ ] State colors pair with non-color signals
- [ ] Existing palette ramps (no unjustified new ramps)
- [ ] 60/30/10 dominance preserved
- [ ] Tested against real content
- [ ] Decision logged if new tokens introduced

### Typography
- [ ] Passes Five-Word Test
- [ ] Sizes hit modular scale steps
- [ ] Body at 60–70ch measure
- [ ] Line heights match role
- [ ] Renders correctly at mobile + desktop
- [ ] Semantic HTML reflects visual hierarchy
- [ ] WCAG AA contrast against backgrounds
- [ ] Fonts self-hosted, `font-display: swap`

## Output

- CSS file with all custom properties (light + dark)
- Font files downloaded and placed in assets
- Preload `<link>` tags for critical fonts
- Documentation of any decisions made (logged per 15_Decision_Log_Template)
