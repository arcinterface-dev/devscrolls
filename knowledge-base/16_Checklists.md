# 16 — Checklists

> The operational gates that turn principles into shipped quality.

**Related:** all other documents — this is the cross-cutting verification layer.

---

## Purpose

Master checklists for every recurring activity on the platform: writing a new article, shipping a new page, adding a feature, reviewing SEO/accessibility/performance/UI/UX/content, and releasing.

Each checklist is **opinionated**: the items reflect rules from the documents that own each topic. The check passes when every box is ticked.

---

## How to Use Checklists

- **Copy** the checklist into a PR description or a draft document.
- **Tick each box** as work is verified — not as work is intended.
- **Never tick speculatively** ("I'll fix that later" without fixing means the box stays empty).
- **Add notes** under any unchecked box explaining why.
- **Run reviews quarterly** even outside of releases.

---

## 1. New Article Checklist

For every post before publish. References [[06_Content_Strategy]] + [[04_Typography_System]] + [[08_SEO_Master_Guide]].

### Frontmatter
- [ ] `title` ≤ 70 chars (≤ 7 words preferred)
- [ ] `description` 140–160 chars, action-oriented
- [ ] `publishDate` set (ISO format)
- [ ] `updatedDate` set if republishing
- [ ] `category` from controlled list (one)
- [ ] `tags` ≤ 5 from allowlist
- [ ] `heroImage` path valid
- [ ] `heroImageAlt` non-empty, descriptive
- [ ] `draft: false` only when ready

### Content
- [ ] Lead paragraph orients the reader (premise + stakes)
- [ ] Headings hierarchical (no skipped levels)
- [ ] Each h2/h3 is descriptive (not "Conclusion")
- [ ] One claim per sentence in technical sections
- [ ] Code samples tested in clean environment
- [ ] Every code block has language specified
- [ ] Filename comment on first line where context matters
- [ ] External links verified (no 404s)
- [ ] Internal links to ≥ 2 related posts
- [ ] All images have descriptive alt text
- [ ] Diagrams custom (not stock)
- [ ] One CTA at article end (not three)
- [ ] Voice matches "thoughtful builder" (see [[12_Branding_Guide]])
- [ ] No exclamation marks in body
- [ ] No "obviously" / "simply" / "just"
- [ ] Sources cited
- [ ] AI-generated content disclosed (if any)

### SEO
- [ ] Unique title (`<title>`) ≤ 60 chars
- [ ] Unique meta description 140–160 chars
- [ ] Canonical URL set
- [ ] Open Graph image generated and tested
- [ ] Twitter Card tested
- [ ] JSON-LD Article schema present
- [ ] One `<h1>` only
- [ ] `<time datetime>` for dates

### Performance
- [ ] Hero image optimized (AVIF/WebP fallback)
- [ ] `width` and `height` on every image
- [ ] Below-fold images `loading="lazy"`
- [ ] No third-party scripts added
- [ ] Total page weight within budget (see [[11_Performance_Guide]])

### Accessibility
- [ ] Headings semantic + hierarchical
- [ ] Alt text on all images
- [ ] Code blocks accessible (keyboard copy button, sufficient contrast)
- [ ] Color contrast verified for any custom-colored elements
- [ ] Diff blocks use `+/-` prefix (not color alone)

### Pre-publish
- [ ] Slug is descriptive, kebab-case, English
- [ ] URL pattern matches structure (`/writing/[category]/[slug]`)
- [ ] Reading time computed and shown
- [ ] Author photo on byline
- [ ] Sitemap regenerated
- [ ] RSS feed updates
- [ ] Build passes (no broken links, no schema errors)
- [ ] Preview deployment tested on mobile + desktop

---

## 2. New Page Checklist

For non-article pages (About, Contact, Project, Tool, etc.).

### Strategic
- [ ] Page serves at least one of the three personas? *(See [[01_Project_Vision]].)*
- [ ] Passes the "Lost Traveler" three-question audit? *(See [[05_UX_Guidelines]].)*
  - Where am I?
  - What is this site?
  - What's next?
- [ ] Has a clear primary purpose (single CTA)?
- [ ] Fits in the IA — no orphan? *(See [[07_Information_Architecture]].)*

### Design
- [ ] Uses platform color tokens (no raw hex)
- [ ] Uses platform type scale
- [ ] Uses platform spacing tokens
- [ ] One primary CTA, accent-colored
- [ ] Hero / opening passes 5-second comprehension test
- [ ] Logo upper-left, links home
- [ ] Navigation consistent with site-wide nav

### Content
- [ ] Voice matches brand
- [ ] Headings hierarchical
- [ ] Body type 18px desktop / 17px mobile
- [ ] Measure ≤ 80ch
- [ ] Calls to action are specific, not "Submit"

### Technical
- [ ] Semantic HTML (header, main, footer, etc.)
- [ ] `<title>` unique, ≤ 60 chars
- [ ] Meta description unique, 140–160 chars
- [ ] Canonical URL set
- [ ] Open Graph image rendered
- [ ] JSON-LD structured data (if applicable type)
- [ ] Sitemap updated

### Accessibility
- [ ] Keyboard navigable end-to-end
- [ ] Focus rings visible
- [ ] Tab order matches visual order
- [ ] WCAG AA contrast (AAA for body)
- [ ] Reduced-motion respected
- [ ] Tested with screen reader

### Performance
- [ ] LCP < 1.8s on mobile 3G simulation
- [ ] CLS < 0.05
- [ ] INP < 200ms
- [ ] Bundle within per-template budget

---

## 3. New Feature Checklist

Any new functionality (search, command palette, theme toggle, etc.). Cross-references [[13_Future_Scalability]] + [[15_Decision_Log_Template]].

### Strategic
- [ ] Decision logged in [[15_Decision_Log_Template]]
- [ ] Serves at least one persona's defined goal
- [ ] Doesn't duplicate existing functionality
- [ ] Reversible (or irreversibility explicitly logged)
- [ ] Compatible with static-first architecture
- [ ] Doesn't lock into a vendor without exit plan

### Design
- [ ] Follows existing UI patterns (or new pattern documented)
- [ ] Uses platform tokens
- [ ] Empty state designed
- [ ] Error state designed
- [ ] Loading state designed
- [ ] Success state designed

### UX
- [ ] Keyboard operable
- [ ] Touch targets ≥ 44px
- [ ] Animation respects reduced-motion
- [ ] Works without JS for non-interactive readers (where applicable)
- [ ] Disclosure pattern clear (hidden vs visible features per criticality)

### Accessibility
- [ ] Focus management correct (especially modals, overlays)
- [ ] Screen-reader-tested
- [ ] Semantic HTML
- [ ] ARIA only where semantic HTML doesn't suffice
- [ ] Color is not the only signal

### Performance
- [ ] JS impact within budget
- [ ] Lazy-loaded if not critical
- [ ] No render-blocking
- [ ] Tested on slow network

### Privacy
- [ ] No third-party tracking introduced
- [ ] User data minimized
- [ ] Privacy policy updated if applicable

### Documentation
- [ ] Feature documented in relevant doc
- [ ] Keyboard shortcuts (if any) added to `?` modal
- [ ] Help text written where needed

---

## 4. SEO Review Checklist

Quarterly or after any significant content/structural change. Owns: [[08_SEO_Master_Guide]].

### Crawlability
- [ ] `robots.txt` valid and correct
- [ ] XML sitemap submitted to Search Console + Bing
- [ ] No accidental `noindex` on indexable pages
- [ ] No broken internal links (build check passes)
- [ ] No orphan posts (every post linked from somewhere)

### On-page
- [ ] All posts have unique titles + descriptions
- [ ] All posts have canonical URLs
- [ ] All posts have OG image + Twitter Card
- [ ] All posts have JSON-LD Article schema
- [ ] About page has Person schema

### Technical
- [ ] HTTPS everywhere
- [ ] One canonical domain
- [ ] Core Web Vitals "Good" across templates
- [ ] Mobile-friendly (Search Console)
- [ ] No "Page experience" issues in Search Console

### Content
- [ ] Topic clusters identified (pillars + sub-posts)
- [ ] Internal linking dense within clusters
- [ ] No keyword stuffing
- [ ] No thin content (every post substantive)
- [ ] AI-generated content disclosed
- [ ] No paywalls or interstitials

### Off-page
- [ ] Backlinks reviewed for spam (disavow if needed)
- [ ] Brand mentioned in social profiles
- [ ] RSS feed working

---

## 5. Accessibility Review Checklist

Quarterly or before major release. Owns: [[10_Accessibility_Standards]].

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
- [ ] No keyboard-only or mouse-only interactions

### Manual — screen reader
- [ ] VoiceOver (macOS) test on home + article + form
- [ ] NVDA (Windows) test on home + article + form
- [ ] Headings announce hierarchy correctly
- [ ] Form labels associated
- [ ] Live regions for dynamic content (search, toasts)
- [ ] ARIA only where needed; no overuse

### Manual — vision
- [ ] 200% zoom test on each template
- [ ] High contrast mode test
- [ ] Forced colors (Windows) test
- [ ] Color blindness simulator (Sim Daltonism / Color Oracle)

### Manual — motion
- [ ] `prefers-reduced-motion` honored globally
- [ ] No autoplay sound
- [ ] Video has controls + poster fallback

### Touch
- [ ] All touch targets ≥ 44px
- [ ] No targets within 8px of each other

---

## 6. Performance Review Checklist

Quarterly. Owns: [[11_Performance_Guide]].

### Real-user metrics (if collecting)
- [ ] p75 LCP < 2.5s
- [ ] p75 CLS < 0.1
- [ ] p75 INP < 200ms
- [ ] p75 TTFB < 800ms

### Per-template (Lighthouse mobile 3G)
- [ ] Home: LCP < 1.5s, CLS < 0.05, JS < 50 KB gzip
- [ ] Article: LCP < 1.8s, CLS < 0.05, JS < 40 KB gzip
- [ ] Index/Archive: LCP < 1.5s, CLS < 0.05
- [ ] About / Contact: LCP < 1.2s

### Assets
- [ ] Images optimized (AVIF/WebP fallback)
- [ ] No images > 200KB in production
- [ ] Fonts self-hosted, WOFF2, variable where possible
- [ ] CSS < 30 KB gzip per page
- [ ] Critical CSS inlined

### Build & deploy
- [ ] Build time tracked
- [ ] Bundle size diff in PRs
- [ ] CI runs Lighthouse on every PR
- [ ] Cache headers correct
- [ ] CDN distributing globally

### Third-party
- [ ] No tracking scripts
- [ ] No Google Fonts CDN
- [ ] Any third-party justified in [[15_Decision_Log_Template]]

---

## 7. UI Review Checklist

Before any visual release. Cross-references [[02_Design_Principles]] + [[03_Color_System]] + [[04_Typography_System]] + [[12_Branding_Guide]].

### Visual hierarchy
- [ ] One clear focal point per view
- [ ] At least 3 typographic levels
- [ ] Biggest/brightest element is the most important

### Color
- [ ] All colors from semantic tokens (no raw hex)
- [ ] 60/30/10 dominance preserved
- [ ] One warm accent for action affordances
- [ ] Dark mode tested
- [ ] Code block colors brand-aligned

### Typography
- [ ] Body 18px desktop / 17px mobile
- [ ] Line height 1.5–1.6 body
- [ ] Measure ≤ 80ch
- [ ] Three font families max (sans, mono, optional serif)
- [ ] No all-caps in body
- [ ] Hierarchy preserved across templates

### Layout
- [ ] Grid consistent
- [ ] Spacing from scale
- [ ] Generous white space
- [ ] No misalignment
- [ ] Mobile + desktop both work

### Components
- [ ] Cards: one thought, image 50–75%, simple type
- [ ] Buttons: states (default/hover/focus/active/disabled) all designed
- [ ] Forms: labels visible, errors helpful
- [ ] Navigation: ≤5 items, logo upper-left

### Consistency
- [ ] External (envelope = email, blue underline = link)
- [ ] Internal (six-axis: color, type, language, visuals, layout, interactions)
- [ ] Any deviation has logged justification

---

## 8. UX Review Checklist

Before release or quarterly. Owns: [[05_UX_Guidelines]].

### "Lost Traveler" audit (every template)
- [ ] Where am I? (Breadcrumb / page title / section indicator)
- [ ] What is this site? (Logo + tagline within reach)
- [ ] What's next? (One clear next action)

### Navigation
- [ ] Site-wide nav consistent
- [ ] ≤5 primary items
- [ ] Hamburger only on narrow viewports
- [ ] Icons + labels
- [ ] Active state unmistakable

### Interaction feedback
- [ ] Every action has a response (button states, toasts, transitions)
- [ ] Loading states visible
- [ ] Errors specific + actionable
- [ ] Empty states designed
- [ ] Success states designed

### Friction
- [ ] Forms minimal — every field justified
- [ ] One CTA per view
- [ ] No popups, interstitials, paywalls
- [ ] No autoplay sound/video
- [ ] Page works without JS for reading

### Progressive disclosure
- [ ] Critical actions always visible
- [ ] Secondary actions exposed on hover/intent
- [ ] Power-user shortcuts documented

### Mobile
- [ ] Hamburger nav functional
- [ ] Touch targets ≥ 44px
- [ ] No horizontal scroll
- [ ] Bottom-bar shortcuts (if any) don't obscure content

---

## 9. Content Review Checklist

Quarterly. Owns: [[06_Content_Strategy]] + [[12_Branding_Guide]].

### Editorial calendar
- [ ] At least one post per active category this quarter
- [ ] Content cluster gaps identified
- [ ] Pillar posts updated where relevant

### Older posts (sample 10)
- [ ] All links still working?
- [ ] Code samples still work with current library versions?
- [ ] Dates honest (publishDate untouched; updatedDate set if revised)?
- [ ] Voice still matches current brand?
- [ ] Cross-links still relevant?
- [ ] Hero image still loads + matches brand?

### Taxonomy
- [ ] Tags allowlist audited (merge low-traffic, retire dead)
- [ ] Categories still match content reality
- [ ] No orphan tags

### Voice consistency
- [ ] Recent posts in voice ("thoughtful builder")
- [ ] No clickbait headlines
- [ ] No exclamation marks in body
- [ ] Sources cited
- [ ] Failure / uncertainty acknowledged where applicable

### Performance per post
- [ ] Hero images optimized
- [ ] Code blocks render fast
- [ ] No external embeds slowing load

---

## 10. Release Review Checklist

Before any major release (template overhaul, new surface, year transition).

### Pre-release
- [ ] All 9 reviews above completed in last 30 days
- [ ] Decision log entries up to date
- [ ] No invariants violated (see [[14_AI_Context]])
- [ ] Performance budgets met across templates
- [ ] Accessibility verified
- [ ] SEO verified
- [ ] Brand consistency verified

### Release
- [ ] Preview deployment tested by ≥ 2 readers (hallway test — *10 Pro Tips p. 17*)
- [ ] Cross-browser tested (Safari, Chrome, Firefox; iOS, Android)
- [ ] Old URL redirects in place if anything moved (301s)
- [ ] Sitemap regenerated
- [ ] Search Console + Bing notified
- [ ] RSS feed verified (no breaking changes)

### Post-release
- [ ] Monitor RUM metrics for 7 days
- [ ] Monitor search rankings for 30 days
- [ ] Monitor reader feedback channels
- [ ] Document outcomes in relevant decision log entries
- [ ] Schedule next review

---

## How Often to Run Each Checklist

| Checklist | Frequency |
|-----------|-----------|
| New Article | Every post |
| New Page | Every new page |
| New Feature | Every new feature |
| SEO Review | Quarterly + after major content events |
| Accessibility Review | Quarterly + before any major release |
| Performance Review | Quarterly + after any infra change |
| UI Review | Every visual release |
| UX Review | Quarterly + before major release |
| Content Review | Quarterly |
| Release Review | Every major release |

---

## Common Mistakes

- **Ticking boxes speculatively.** Verify, don't intend.
- **Skipping reviews because "nothing changed."** Drift happens silently.
- **Treating checklists as suggestions.** They are gates.
- **Adding boxes ad-hoc.** Update the owning document, then the checklist.
- **Not running cross-cutting reviews** (a11y, perf, SEO) because they feel "boring."
- **Running only automated tests.** Manual testing catches 70% of issues automated tests miss. *(See [[10_Accessibility_Standards]].)*

---

## References

PDF sources informing the checklists:
- *Getting Started With UX Design Process & Documentation.* UXPin, 2015 — one-page test plan (p. 25), maintenance audits (p. 17), persona-match (p. 25), fidelity-stage reviews.
- *10 Pro Tips to a Smarter UX Design Process.* UXPin, 2015 — hallway usability test with 3–5 people (p. 17), Process Map's Test and Refine phase (p. 22).
- *3 Common UX Mistakes Killing Good Design.* UXPin, 2015 — "Lost Traveler" mentality (p. 17), mobile-friendly verification (p. 7), tap target padding (p. 17), every form field rationale (p. 13–15), animations time-boxed.
- *Consistency in UI Design.* UXPin, 2015 — six-axis internal consistency check (p. 19–20).
- *Web UI Design for the Human Eye.* UXPin, 2015 — Five-Word Test (p. 52), measure check (p. 59), hierarchy check (p. 62).
- *Web UI Trends: Card-Based Design Patterns.* UXPin, 2015 — seven card components as acceptance criteria (p. 22–23).
- *Web UI Trends: The Elegance of Minimalism.* UXPin, 2015 — "irreplaceable functionality" deletion check (p. 33).

The remaining 4 PDFs reinforce all checklists through their respective owning documents.
