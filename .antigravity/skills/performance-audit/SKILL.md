---
name: performance-audit
description: >
  Invoke when auditing the platform's performance against the defined budgets.
  Run quarterly, after infrastructure changes, or when performance regressions
  are suspected.
inputs:
  - scope: What to audit (full-site | template:[name] | page:[url])
  - network: Simulation profile (3g-mobile | 4g-mobile | broadband)
---

# Performance Audit Skill

## Knowledge Base Files to Consult

1. `knowledge-base/11_Performance_Guide.md` — budgets, image/font/CSS/JS optimization, build checks
2. `knowledge-base/08_SEO_Master_Guide.md` — Core Web Vitals as ranking signal
3. `knowledge-base/04_Typography_System.md` — font loading strategy
4. `knowledge-base/16_Checklists.md` — Checklist #6 (Performance Review)

## Steps

### 1. Gather Core Web Vitals
Run Lighthouse in mobile 3G simulation for each template:

| Template | LCP target | CLS target | TBT target | Total bytes (gzip) | JS bytes (gzip) |
|----------|-----------|-----------|-----------|---------------------|------------------|
| Home | < 1.5s | < 0.05 | < 100ms | < 200 KB | < 50 KB |
| Article | < 1.8s | < 0.05 | < 150ms | < 250 KB | < 40 KB |
| Index/Archive | < 1.5s | < 0.05 | < 100ms | < 180 KB | < 30 KB |
| About/Contact | < 1.2s | < 0.05 | < 50ms | < 150 KB | < 20 KB |
| 404 | < 1.0s | < 0.05 | < 50ms | < 100 KB | < 10 KB |

### 2. Image audit
- [ ] All images optimized (AVIF primary, WebP fallback, JPEG universal)
- [ ] No images > 200KB in production
- [ ] All images have `width` and `height` attributes
- [ ] Below-fold images have `loading="lazy"`
- [ ] Hero images have `loading="eager"`
- [ ] Responsive `srcset` and `sizes` used

### 3. Font audit
- [ ] Fonts self-hosted (no Google Fonts CDN)
- [ ] WOFF2 format only
- [ ] Variable fonts where available
- [ ] Latin subset (unless other languages needed)
- [ ] `font-display: swap` applied
- [ ] Critical fonts preloaded

### 4. CSS audit
- [ ] Total CSS < 30 KB gzip per page
- [ ] Critical CSS < 10 KB inlined
- [ ] No unused CSS in production
- [ ] No `@import` chains
- [ ] No CSS-in-JS for static templates

### 5. JavaScript audit
- [ ] Reading works with JS disabled
- [ ] Component-level hydration (Astro islands)
- [ ] No client-side router (unless justified)
- [ ] All non-critical JS deferred
- [ ] No tracking scripts
- [ ] JS within per-template budget

### 6. Build & deploy audit
- [ ] Build time tracked and reasonable
- [ ] Bundle size diff monitored in PRs
- [ ] CI runs Lighthouse on every PR
- [ ] Cache headers correct (long max-age for hashed assets)
- [ ] CDN distributing globally
- [ ] Brotli or gzip compression active

### 7. Third-party audit
- [ ] No tracking scripts
- [ ] No Google Fonts CDN
- [ ] Any third-party justified in decision log

## Checklist (from 16_Checklists.md #6)

### Real-user metrics (if collecting)
- [ ] p75 LCP < 2.5s
- [ ] p75 CLS < 0.1
- [ ] p75 INP < 200ms
- [ ] p75 TTFB < 800ms

### Per-template (Lighthouse mobile 3G)
- [ ] Home: LCP < 1.5s, CLS < 0.05, JS < 50 KB gzip
- [ ] Article: LCP < 1.8s, CLS < 0.05, JS < 40 KB gzip
- [ ] Index/Archive: LCP < 1.5s, CLS < 0.05
- [ ] About/Contact: LCP < 1.2s

### Assets
- [ ] Images optimized (AVIF/WebP fallback)
- [ ] No images > 200KB
- [ ] Fonts self-hosted, WOFF2, variable
- [ ] CSS < 30 KB gzip per page
- [ ] Critical CSS inlined

### Build & deploy
- [ ] Build time tracked
- [ ] Bundle size diff in PRs
- [ ] CI runs Lighthouse
- [ ] Cache headers correct
- [ ] CDN distributing

### Third-party
- [ ] No tracking scripts
- [ ] No Google Fonts CDN
- [ ] Any third-party justified in decision log

## Output

- Performance report (markdown) with metrics per template
- List of budget violations with specific assets
- Recommended optimizations prioritized by impact
