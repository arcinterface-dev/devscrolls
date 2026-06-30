---
name: dark-mode-implementation
description: >
  Invoke when implementing or auditing the platform's dark mode. Dark mode is a
  first-class peer to light mode, not a CSS afterthought. This skill ensures
  proper token remapping, contrast verification, and syntax theme adaptation.
inputs:
  - scope: initial-implementation | audit | fix:[component]
---

# Dark Mode Implementation Skill

## Knowledge Base Files to Consult

1. `knowledge-base/03_Color_System.md` — dark mode philosophy, saturation rules, code block contrast
2. `knowledge-base/10_Accessibility_Standards.md` — contrast ratios in dark mode
3. `knowledge-base/04_Typography_System.md` — reading comfort in dark mode
4. `knowledge-base/11_Performance_Guide.md` — no extra CSS or JS for mode switching
5. `knowledge-base/05_UX_Guidelines.md` — theme toggle interaction, prefers-color-scheme

## Rationale

The docs explicitly state "dark mode is designed, not derived" and "mathematical inversion
produces oversaturated, eye-burning surfaces." This is a common AI mistake — naively
inverting light mode. This skill ensures dark mode is built correctly from the start.

## Steps

### 1. Remap semantic tokens for dark mode
Following 03_Color_System dark mode philosophy:

| Token | Light value | Dark value |
|-------|------------|------------|
| surface-base | near-white (#fafafa) | soft dark (#0f1115) |
| surface-raised | lighter than base | slightly lighter than base |
| surface-sunken | darker than base | slightly darker than base |
| text-primary | near-black (#1a1a1a) | off-white (#e8e9eb) |
| text-secondary | gray-600 | gray-400 |
| accent-default | amber-600 | amber-300 (desaturated -10%) |

### 2. Desaturate accent colors
- Saturated colors vibrate against dark backgrounds
- Reduce saturation by ~10% for accent ramp in dark mode
- Test that desaturated accents still pass contrast checks

### 3. Tune syntax highlighting for dark
- Each syntax token must clear WCAG AA against the dark surface
- Comments fade (lower contrast)
- Keywords brand-aligned (blue-300)
- Strings (green-300), Functions (amber-300), Numbers (purple-300)
- This is NOT automatic from inverting a light theme

### 4. Implementation approach
```css
:root { /* light mode tokens */ }

@media (prefers-color-scheme: dark) {
  :root { /* dark mode token overrides */ }
}

[data-theme="dark"] { /* manual toggle overrides */ }
```

### 5. Theme toggle
- System preference is the default
- JS adds manual override stored in localStorage
- Toggle respects `prefers-color-scheme` as initial state
- Works without JS (falls back to system preference)

### 6. Verify all surfaces
Test every template in dark mode:
- [ ] Body text contrast ≥ 7:1 against surface-base
- [ ] UI text contrast ≥ 4.5:1 against surface-raised
- [ ] Focus rings visible on dark surfaces
- [ ] State colors (success/warning/error/info) distinguishable
- [ ] Code blocks readable with dark syntax theme
- [ ] Images don't blow out on dark backgrounds
- [ ] No pure black (#000) used as surface
- [ ] No pure white (#fff) used as text

## Checklist

- [ ] Dark mode designed independently (not inverted)
- [ ] Surface-base is soft dark (#0f1115), not pure black
- [ ] Body text is off-white (#e8e9eb), not pure white
- [ ] Accent colors desaturated for dark mode
- [ ] Syntax highlighting tuned and contrast-checked
- [ ] WCAG AA met on all dark surfaces
- [ ] Theme toggle works (system pref + manual override)
- [ ] Falls back correctly without JS
- [ ] Tested on all templates
- [ ] No new CSS file added (token remapping only)
- [ ] Images reviewed on dark backgrounds

## Output

- Updated CSS custom properties with dark mode values
- Theme toggle component (Astro or React island)
- Dark syntax highlighting theme
- Dark mode test report
