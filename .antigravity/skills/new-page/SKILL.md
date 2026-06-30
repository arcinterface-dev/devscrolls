---
name: new-page
description: >
  Invoke when creating a new non-article page (About, Contact, Project case study,
  Tool, Now, or any custom page). Covers strategic justification, design token
  usage, UX validation, and the full New Page Checklist.
inputs:
  - page_type: The kind of page (about, contact, project, tool, now, custom)
  - purpose: One-sentence purpose of the page
  - primary_cta: The single primary call-to-action
---

# New Page Skill

## Knowledge Base Files to Consult

1. `knowledge-base/05_UX_Guidelines.md` — navigation, Lost Traveler audit, interaction feedback
2. `knowledge-base/07_Information_Architecture.md` — URL patterns, site structure, IA rules
3. `knowledge-base/02_Design_Principles.md` — 12 principles, hierarchy, consistency
4. `knowledge-base/01_Project_Vision.md` — persona fit, decision framework
5. `knowledge-base/16_Checklists.md` — Checklist #2 (New Page)

## Steps

### 1. Strategic justification
- Confirm the page serves at least one of the three personas
- Verify it fits in the IA — no orphan pages
- Determine the URL pattern from 07_Information_Architecture
- Identify the single primary CTA

### 2. "Lost Traveler" audit
Every page must answer three questions for a first-time visitor:
1. **Where am I?** — Breadcrumb or section indicator + clear page title
2. **What is this site?** — Logo (top-left, linking home) + tagline within reach
3. **What's next?** — One clear next action

### 3. Design implementation
- Use platform color tokens (no raw hex)
- Use platform type scale (body 18px desktop, 17px mobile)
- Use platform spacing tokens
- One primary CTA, accent-colored
- Logo upper-left, links home
- Navigation consistent with site-wide nav
- Measure ≤ 80ch for body content

### 4. Content
- Voice matches "thoughtful builder" brand
- Headings hierarchical (no skipped levels)
- Calls to action are specific (not "Submit")

### 5. Technical implementation
- Semantic HTML (`<header>`, `<main>`, `<footer>`, `<nav>`)
- Unique `<title>` ≤ 60 chars
- Unique meta description 140–160 chars
- Canonical URL set
- OG image generated
- JSON-LD structured data (if applicable type: Person for /about, etc.)
- Sitemap updated

### 6. Accessibility
- Keyboard navigable end-to-end
- Focus rings visible
- Tab order matches visual order
- WCAG AA contrast (AAA for body text)
- `prefers-reduced-motion` respected
- Test with screen reader

### 7. Performance
- LCP < 1.8s on mobile 3G simulation
- CLS < 0.05
- INP < 200ms
- Bundle within per-template budget

## Checklist (from 16_Checklists.md #2)

### Strategic
- [ ] Page serves at least one persona
- [ ] Passes "Lost Traveler" three-question audit
- [ ] Has a clear primary purpose (single CTA)
- [ ] Fits in the IA — no orphan

### Design
- [ ] Uses platform color tokens (no raw hex)
- [ ] Uses platform type scale
- [ ] Uses platform spacing tokens
- [ ] One primary CTA, accent-colored
- [ ] Logo upper-left, links home
- [ ] Navigation consistent with site-wide nav

### Content
- [ ] Voice matches brand
- [ ] Headings hierarchical
- [ ] Body type 18px desktop / 17px mobile
- [ ] Measure ≤ 80ch

### Technical
- [ ] Semantic HTML
- [ ] `<title>` unique, ≤ 60 chars
- [ ] Meta description unique, 140–160 chars
- [ ] Canonical URL set
- [ ] OG image rendered
- [ ] JSON-LD structured data
- [ ] Sitemap updated

### Accessibility
- [ ] Keyboard navigable end-to-end
- [ ] Focus rings visible
- [ ] Tab order matches visual order
- [ ] WCAG AA contrast (AAA for body)
- [ ] Reduced-motion respected
- [ ] Tested with screen reader

### Performance
- [ ] LCP < 1.8s on mobile 3G
- [ ] CLS < 0.05
- [ ] INP < 200ms
- [ ] Bundle within budget

## Output

- An Astro page file at the correct route
- Updated navigation (if a new top-level page)
- OG image
- Updated sitemap
