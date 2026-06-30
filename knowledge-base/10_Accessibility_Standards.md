# 10 — Accessibility Standards

> The platform is accessible by default. Not a feature — a floor.

**Related:** [[02_Design_Principles]] · [[03_Color_System]] · [[04_Typography_System]] · [[05_UX_Guidelines]] · [[11_Performance_Guide]]

---

## Purpose

Define the platform's accessibility commitments, the WCAG criteria it must meet, and the operational rules that keep it accessible as content and code evolve.

> The PDFs informing this knowledge base are light on accessibility specifics. *(Color Theory PDF p. 24 acknowledges the limit explicitly.)* This document supplements them with modern WCAG 2.2 best practices, clearly marked as complementary guidance.

---

## Philosophy

1. **Accessibility is a baseline, not a feature.** Every reader can use the platform.
2. **No "accessible version" / "regular version" split.** One site, accessible by default.
3. **WCAG 2.2 AA is the floor.** AAA where reasonable (body text contrast, large hit areas).
4. **Test with real assistive tech.** Automated tools catch ~30% of issues; lived testing catches the rest.
5. **Design + content + code all share responsibility.** Alt text without keyboard navigation = still inaccessible.

---

## WCAG 2.2 Targets

The platform commits to **WCAG 2.2 Level AA** across all templates. Specific upgrades to AAA:

| Criterion | Level | Why |
|-----------|-------|-----|
| 1.4.6 Contrast (Enhanced) | AAA | Long-form reading benefits from 7:1 on body text |
| 1.4.8 Visual Presentation | AAA | Measure ≤ 80ch, justified text avoided, line-height ≥ 1.5 |
| 2.5.5 Target Size (Enhanced) | AAA | All touch targets ≥ 44×44px (we target 48×48px) |
| 3.3.7 Redundant Entry | A | Don't ask for the same info twice |

All other AA criteria are met as the minimum.

---

## Keyboard Navigation

Every interactive element must be operable via keyboard alone. *(WCAG 2.1.1.)*

### Required behaviors

- **Tab order follows visual reading order.** No DOM reshuffling that breaks the natural sequence.
- **Skip-to-content link** as first focusable element. Becomes visible on focus.
- **Focus rings always visible.** Never `outline: none` without an equivalent replacement. *(WCAG 2.4.7.)*
- **Esc closes modals and overlays.**
- **Enter activates links and buttons.**
- **Arrow keys** navigate within compound widgets (search results, command palette, TOC).
- **Tab traps** inside modals — focus stays within until dismissed.
- **No keyboard-only interactions** (e.g., hover-only menus) that lock out mouse users. Equally, no mouse-only interactions that lock out keyboard users.

### Documented keyboard shortcuts

Surface them in a `?`-triggered modal (see [[05_UX_Guidelines]] for the full list). Never invent shortcuts that conflict with browser/OS defaults.

---

## Screen Reader Support

### Semantic HTML first

Use the right element for the job:

- `<header>`, `<nav>`, `<main>`, `<footer>` for page regions.
- `<article>` for each post.
- `<aside>` for tangential content (TOC, related posts).
- `<button>` for actions; `<a>` for navigation. Never the other way around.
- `<h1>` once per page; `<h2>`–`<h6>` for hierarchy. No skipped levels.
- `<ul>`, `<ol>`, `<li>` for lists (don't fake with `<div>`).
- `<table>` with `<th scope="col|row">` for tabular data.
- `<figure>` + `<figcaption>` for images with captions.
- `<time datetime="...">` for dates.

### ARIA only when semantic HTML doesn't suffice

Per the first rule of ARIA: **don't use ARIA when semantic HTML works.**

When needed:
- `aria-label` for icon-only buttons (rare on this platform; icons should have visible labels).
- `aria-current="page"` for the active nav item.
- `aria-expanded` for disclosure widgets.
- `aria-live="polite"` for dynamic content (search results, toasts).
- `role="status"` for in-progress indicators.

### Avoid
- `role="button"` on `<div>` — use `<button>`.
- `aria-hidden="true"` on focusable elements — creates inconsistencies.
- `tabindex="-1"` everywhere — only on programmatically focused targets.

---

## Focus Management

### Visible focus rings

- Default: 2px ring, accent color, with 2px offset.
- Never invisible.
- Contrast against background ≥ 3:1. *(WCAG 1.4.11.)*
- Consistent shape across components.

### Focus shifts

- New page loads → focus the `<h1>` or first heading.
- Modal opens → focus the modal's first interactive element.
- Modal closes → return focus to the trigger.
- Single-page navigation → manage focus manually; announce route changes via `aria-live`.

### Focus traps

Modals and overlays trap focus until dismissed. Use a library or hand-rolled trap that:
- Cycles through focusable descendants.
- Returns focus to the trigger on close.
- Closes on `Esc`.

---

## Color Accessibility

Cross-reference [[03_Color_System]]:

### Contrast ratios (WCAG)

| Use | AA | AAA |
|-----|-----|-----|
| Body text ≤ 18px | 4.5:1 | **7:1** (platform target) |
| Large text (≥ 18.66px or ≥14px bold) | 3:1 | 4.5:1 |
| Non-text (UI controls, focus indicators) | **3:1** | — |
| Adjacent UI components | **3:1** | — |

### Test every state
- Hover.
- Active.
- Focus.
- Disabled (typically AA fails — acceptable if disabled means unreachable, but prefer not-rendering over disabled).

### Color is never the only signal

For every color-coded UI:
- State colors pair with icon + label.
- Diff blocks have `+`/`-` prefix in addition to color.
- Required form fields use "Required" or "*" symbol + color.
- Form errors have an icon + descriptive text + color.

### Color blindness

- Test palette against deuteranopia, protanopia, tritanopia (Sim Daltonism, Color Oracle, browser dev tools).
- Don't pair red and green alone for opposing states.
- Don't pair blue and purple for adjacent categories.

---

## Motion Reduction

Respect `prefers-reduced-motion: reduce`. *(WCAG 2.3.3.)*

### When motion-reduced is requested
- No parallax.
- No automatic scroll animations.
- No fade transitions longer than 100ms.
- No marquees, rotating banners, carousels.
- Static fallback for any animated illustration.

### Implementation pattern
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

### Auto-playing media
- **Never autoplay** video or audio with sound. *(WCAG 1.4.2.)*
- Video background loops: muted, 10–30 seconds, with pause control. *(Visual Storytellers p. 44.)*
- Static fallback when motion-reduced is requested.

---

## ARIA Philosophy

### First rule of ARIA
Don't use ARIA when semantic HTML works.

### Second rule
Use existing widgets when possible (`<details>` over custom disclosure).

### Third rule
When ARIA is needed, test with at least two screen readers (VoiceOver + NVDA, or VoiceOver + JAWS).

### Common patterns the platform uses

| Pattern | ARIA |
|---------|------|
| Current page in nav | `aria-current="page"` |
| Disclosure (FAQ, code-block toggles) | `<details>` or `aria-expanded` |
| Search results live update | `aria-live="polite"` on the results container |
| Toast notification | `role="status"` |
| Tabs (used sparingly) | Established APG pattern with `role="tab"` etc. |
| Skip-to-content link | Standard `<a href="#main">` |

---

## Reading Accessibility

### Type

- Body type ≥ 16px (default 18px desktop, 17px mobile).
- Line height ≥ 1.5 (target 1.6 for body).
- Measure ≤ 80ch (target 65ch). *(Human Eye p. 59.)*
- Sufficient paragraph spacing (≥ 1× line-height).
- No justified text (uneven word spacing harms dyslexic readers).
- Avoid italic for long passages (italics are slower to read).
- Use sentence case not title case for body content.

### Language

- Plain language preferred. *(See [[12_Branding_Guide]] — voice rules.)*
- Define jargon on first use.
- Acronyms expanded on first mention with `<abbr title="...">`.
- `<html lang="en">` on every page; localize per language as needed.

### Headings

- Hierarchical. No skips.
- Descriptive — "Setting up Astro" not "Step 1."
- Auto-generated anchor IDs for in-page linking.

### Lists

- Real `<ul>`/`<ol>`, not faux-lists with bullet glyphs.
- Don't use lists for layout.

### Images

- **Alt text required.** Empty `alt=""` only for purely decorative images.
- Alt text is descriptive of *function/content*, not file metadata.
- Captions in `<figcaption>` for context.
- Complex images (charts, diagrams) get a text equivalent in the body or a linked long-description.

### Code blocks

- High-contrast syntax theme (≥ 7:1 for most tokens).
- Resizable text (no `font-size` overrides preventing zoom).
- Don't rely on color alone — `+`/`-` for diffs.
- Provide a "copy" affordance accessible by keyboard.

---

## Forms (Accessibility)

- **Labels visible** (not placeholder-only).
- **Labels associated** via `<label for="...">` or wrapping.
- **Required fields** marked with text + symbol + ARIA.
- **Inline errors** announced via `aria-live`.
- **Group related fields** in `<fieldset>` with `<legend>`.
- **Field instructions** linked via `aria-describedby`.
- **Submit button label** is specific ("Subscribe to newsletter," not "Submit").
- **No CAPTCHA** that requires sight; if anti-spam needed, use honeypot or rate limit.

---

## Decision Framework

When making a design or code change:

1. **Can a keyboard user complete the task?**
2. **Can a screen reader user understand the structure and content?**
3. **Does color meet contrast (3:1 UI, 4.5:1 text, 7:1 body)?**
4. **Is there a non-color signal for state?**
5. **Does it respect `prefers-reduced-motion`?**
6. **Does the focus order match the visual order?**
7. **Is the focus indicator visible?**
8. **Are touch targets ≥ 44px?**
9. **Does it work at 200% zoom?**
10. **Does it use semantic HTML before ARIA?**

If any answer is "no," fix before merge.

---

## Rules

1. **WCAG 2.2 AA at minimum. AAA for body text contrast.**
2. **Keyboard-operable.** Test every interaction.
3. **Visible focus rings always.**
4. **Semantic HTML before ARIA.**
5. **Hierarchical headings, no skips.**
6. **Alt text required.**
7. **Color is never the only signal.**
8. **`prefers-reduced-motion` respected globally.**
9. **No autoplay with sound.**
10. **Touch targets ≥ 44px.**
11. **`lang` attribute on every page.**
12. **Tested with real assistive tech, not just automated tools.**

---

## Testing

### Automated tools (necessary, not sufficient)
- Lighthouse (Chrome devtools).
- axe DevTools.
- pa11y-ci in build pipeline.

### Manual testing
- **Keyboard-only:** Tab through every page. Can you do everything?
- **VoiceOver (macOS) / NVDA (Windows):** Read every template.
- **Zoom to 200%:** Does the layout hold?
- **High contrast mode:** Does the design hold?
- **Reduce motion:** Are all animations disabled?
- **Forced colors (Windows):** Does it survive?

### Per-release manual audit
Before any major release, run a full manual audit on a sample post + the home + a project page + the contact form. Document findings in [[15_Decision_Log_Template]].

---

## Examples

### Good — accessible form field

```html
<label for="email">Email address</label>
<input
  type="email"
  id="email"
  name="email"
  required
  aria-describedby="email-help email-error"
/>
<span id="email-help">Used only for newsletter delivery.</span>
<span id="email-error" role="alert"></span>
```

### Bad — accessible-looking but broken

```html
<div class="form-row">
  <span>Email</span>
  <input placeholder="Email address" />
</div>
```

*No label association, no required indicator, placeholder-only labeling fails when typing.*

### Good — accessible button

```html
<button type="button" aria-pressed="false" id="bookmark-btn">
  <svg aria-hidden="true">...</svg>
  Save for later
</button>
```

### Bad — div-as-button

```html
<div class="btn" onclick="save()">Save</div>
```

*Not keyboard-focusable. Not screen-reader-announced. Not standard interaction.*

---

## Common Mistakes

- **`outline: none` without replacement.** Disaster.
- **Placeholder-only form labels.** Disappear when typing.
- **Icon-only buttons without `aria-label`.**
- **`<div onclick>` instead of `<button>`.**
- **Skipped heading levels.** Confuses screen readers.
- **Color-only diff blocks.**
- **Carousels that don't pause on hover/focus.**
- **Auto-advancing slideshows.**
- **Decorative images with verbose alt text.** (Should be `alt=""`.)
- **Content images with empty alt text.** (Should be descriptive.)
- **`tabindex="0"` on non-interactive elements** to make them keyboard-focusable instead of making them buttons.
- **Trusting automated tools alone.** They catch ~30%.

---

## Checklist

For every page, component, or feature:

- [ ] Keyboard navigable end-to-end
- [ ] Focus order matches visual order
- [ ] Focus rings visible
- [ ] Skip-to-content link present
- [ ] `<html lang>` set
- [ ] Semantic HTML throughout
- [ ] Headings hierarchical, no skips
- [ ] Alt text on images (descriptive or empty for decorative)
- [ ] Form labels associated
- [ ] Required fields marked with text + symbol + ARIA
- [ ] Errors announced via `aria-live`
- [ ] Color contrast 4.5:1 (text), 3:1 (UI), 7:1 (body)
- [ ] State signals beyond color (icon, label)
- [ ] `prefers-reduced-motion` respected
- [ ] No autoplay sound
- [ ] Touch targets ≥ 44px
- [ ] Tested at 200% zoom
- [ ] Tested with at least one screen reader
- [ ] Automated audit (Lighthouse, axe) passes

---

## References

PDF sources informing this doc:
- *Web UI Design for the Human Eye.* UXPin, 2015 — measure ≤ 80ch, line-height 1.3–1.5, hierarchy aids screen readers.
- *White Space in Web UI Design.* UXPin, 2015 — proximity and grouping for assistive tech parsing.
- *Color Theory in Web UI Design.* UXPin, 2015 — acknowledges accessibility gap (p. 24); informs supplemental contrast policy.
- *Visual Storyteller's Guide.* UXPin, 2015 — age-sensitive picture superiority; text labels alongside imagery.

Complementary modern guidance (primary):
- **WCAG 2.2** (W3C Recommendation, 2023).
- **WAI-ARIA Authoring Practices** (W3C).
- **The A11y Project Checklist.**
- *Inclusive Components* (Heydon Pickering).
- *Accessibility for Everyone* (Laura Kalbag).
- WebAIM contrast checker.
