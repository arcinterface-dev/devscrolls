# 11 — Performance Guide

> Fast pages are a form of respect for the reader.

**Related:** [[02_Design_Principles]] · [[03_Color_System]] · [[04_Typography_System]] · [[08_SEO_Master_Guide]] · [[10_Accessibility_Standards]]

---

## Purpose

Define the performance philosophy, budgets, optimization strategies, and rules for keeping the platform fast as it grows from a few posts to many hundreds.

---

## Philosophy

1. **Static generation by default.** *(See [[13_Future_Scalability]].)*
2. **Performance is a feature** — readers feel it before they describe it.
3. **Budgets, not aspirations.** Hard numbers per template enforced in CI.
4. **Mobile-first.** Optimize for the worst-realistic network, not the fastest. *(3 UX Mistakes p. 17.)*
5. **Less code, fewer requests, smaller payloads.** Minimalism applies to bytes too. *(Minimalism p. 28.)*

---

## Static Generation Philosophy

The platform is rendered at build time. Pages are HTML files served via CDN.

### Why static
- Fast TTFB (CDN edge).
- No server warmup latency.
- No runtime errors taking down content.
- Works without JS (progressive enhancement).
- Cheap to host.
- Survives traffic spikes.

### When static breaks down
- Personalized content per visitor → handled with client-side hydration of small components.
- Live data (currently-playing, latest commit) → either incremental static regeneration, scheduled rebuilds, or small client-side fetch.
- User accounts → reconsidered against [[01_Project_Vision]] (Year 1+ feature only if justified).

---

## Performance Budgets

Per-template budgets, enforced in CI:

| Template | LCP target | CLS target | TBT target | Total bytes (gzip) | JS bytes (gzip) |
|----------|-----------|-----------|-----------|---------------------|------------------|
| Home | < 1.5s | < 0.05 | < 100ms | < 200 KB | < 50 KB |
| Article | < 1.8s | < 0.05 | < 150ms | < 250 KB | < 40 KB |
| Index/Archive | < 1.5s | < 0.05 | < 100ms | < 180 KB | < 30 KB |
| About / Contact | < 1.2s | < 0.05 | < 50ms | < 150 KB | < 20 KB |
| 404 | < 1.0s | < 0.05 | < 50ms | < 100 KB | < 10 KB |

### Core Web Vitals targets (Good)
- **LCP** (Largest Contentful Paint): < 2.5s
- **CLS** (Cumulative Layout Shift): < 0.1
- **INP** (Interaction to Next Paint): < 200ms
- **FCP** (First Contentful Paint): < 1.8s
- **TTFB** (Time to First Byte): < 800ms

The platform targets the **upper edge** of "Good" — these are floors, not goals.

---

## Image Optimization

Images are typically the heaviest assets. The Visual Storytellers PDF reminds us they are also the most impactful for engagement *(p. 11, 16)*, so optimize, don't omit.

### Format strategy
- **AVIF** as primary modern format (smaller than WebP at equivalent quality).
- **WebP** as fallback for older browsers.
- **JPEG** as universal fallback.
- **SVG** for icons, logos, diagrams.
- **No GIFs.** Use MP4/WebM video or animated WebP for motion.

### Sizing
- Generate **multiple sizes** per image: 320, 640, 960, 1280, 1920px wide.
- Use `<picture>` with `srcset` and `sizes` for responsive selection.
- Hero images: 1280px wide at 80% quality typically lands ~80–120KB.
- Inline images: 640px wide at 80% quality typically lands ~30–60KB.

### Lazy loading
- `loading="lazy"` on all images below the fold.
- `loading="eager"` only on the hero image of the current view.
- Native lazy loading is sufficient; no JS library needed.
- `decoding="async"` for non-critical images.

### Aspect ratios
- **Always specify `width` and `height`** on image elements to prevent layout shift. *(WCAG, CWV.)*
- Use CSS `aspect-ratio` for responsive containers.

### Image pipeline
- Build-step optimization (Astro Image, Sharp, or similar).
- Source images committed in `/src/assets/` (or `/public/` for static URLs).
- Generated variants cached or served from a CDN/image service.
- Treat hero images as content, not assets — version them with the article.

---

## Video Usage Rules

*(Visual Storytellers p. 44–45.)*

- **10–30 second loops** for background video.
- **Sound off by default.** Never autoplay with sound. *(WCAG 1.4.2.)*
- **Lazy loaded.**
- **Static poster image** as fallback for incompatible browsers or low bandwidth.
- **Honest HD source** — don't upscale.
- **Respects `prefers-reduced-motion`** — show poster instead of video.

For tutorial videos:
- Embed via lazyload pattern (poster + click-to-load).
- Use `<video controls>` not autoplay.
- Provide transcript (accessibility + SEO).
- Self-host or use privacy-respecting embed (e.g., Cloudflare Stream, Bunny). Avoid YouTube/Vimeo iframes for performance reasons unless necessary.

---

## Font Optimization

Fonts are the second-heaviest typical payload after images.

### Rules
- **Self-host fonts.** No Google Fonts CDN — privacy + performance + reliability. *(See [[04_Typography_System]].)*
- **Variable fonts where available** — one file covers all weights. (Inter Variable, JetBrains Mono Variable.)
- **Subset to Latin** if no other language characters needed.
- **WOFF2 only** — universal modern support, smallest size.
- **`font-display: swap`** — show fallback immediately, swap in custom when ready.
- **Preload critical fonts** — `<link rel="preload" as="font" type="font/woff2" crossorigin>` for body + display fonts.

### Maximum fonts
- 1 sans (body + UI).
- 1 mono (code).
- 1 serif (optional, headings).
- Per-family: 1 variable file OR 2–3 weights at most.

### Font fallback stack
Choose fallback fonts that visually match the custom font to minimize CLS:
```css
font-family: 'Inter', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
```

---

## CSS Optimization

### Strategy
- **Critical CSS inlined** in `<head>` for above-the-fold styling.
- **Component-scoped styles** where possible (Astro scoped styles, CSS modules).
- **Design tokens as CSS variables** for theming without preprocessor builds.
- **PurgeCSS / unused-CSS elimination** in production.

### Budget
- < 30 KB gzip total CSS per page.
- < 10 KB critical CSS inlined.

### Practices
- No utility-class bloat unless aggressively purged.
- Avoid `@import` chains (block render).
- Avoid CSS-in-JS for static templates (runtime cost).
- Avoid `*` selectors with expensive properties.

---

## JavaScript Budgeting

### Philosophy
JS is the most expensive asset per byte — it parses, compiles, executes, and re-runs on interaction. **Ship the least JS possible.**

### Rules
- **HTML-first article rendering.** Reading works without JS.
- **Component-level hydration** (Astro islands pattern) — hydrate only interactive components.
- **No client-side router** unless single-page transitions are essential.
- **No state management library** (Redux, MobX) unless complexity demands.
- **Defer non-critical JS** — `defer` or `async` attribute.
- **Lazy load below-fold interactive components.**

### Forbidden by default
- Tracking scripts.
- Analytics that require third-party JS (Plausible/Umami are server-side or first-party only).
- A/B testing client-side libraries.
- Carousel libraries when CSS will do.
- Smooth-scroll polyfills (modern browsers have CSS `scroll-behavior`).

### Budget
- < 40 KB gzip JS per template (Article).
- < 50 KB gzip JS for home (with search index).
- < 10 KB gzip JS for static pages (About, 404).

---

## Markdown Rendering Performance

Articles are Markdown → HTML at build time.

### Optimizations
- **Syntax highlighting at build time**, not runtime. (Shiki, Prism, rehype-pretty-code.)
- **Pre-rendered code highlight** stored as static HTML.
- **No client-side highlighter** — adds 50+ KB JS.
- **Pre-compute reading time** at build.
- **Pre-generate anchor IDs** for headings.
- **Pre-resolve internal links** for build-time validation.

### Build-time validation
- Broken internal links fail the build.
- Missing alt text fails the build.
- Missing frontmatter fields fail the build.
- Schema validation on frontmatter.

---

## Asset Optimization

### General rules
- **Compress everything.** Brotli (preferred) or gzip.
- **Cache aggressively** with content-hash filenames.
- **Cache headers**: long max-age (1 year) for hashed assets; short max-age for HTML.
- **HTTP/2 or HTTP/3** for multiplexing.
- **No render-blocking third-party resources.**

### Third-party scripts
Default: **none.**

If unavoidable (e.g., one analytics service):
- Load `defer` or `async`.
- Self-host or first-party proxy if possible.
- Audit annually.
- Document the trade-off in [[15_Decision_Log_Template]].

---

## Animation Performance

*(Web Storytelling p. 18 — "Effects compound; restraint amplifies them.")*

### Rules
- Animate only `transform` and `opacity` (GPU-accelerated).
- Avoid animating `width`, `height`, `top`, `left` (layout-triggering).
- Use `will-change` sparingly and remove after animation.
- 60fps target. If frame drops, simplify.
- `prefers-reduced-motion` falls back to no animation.
- Heavy animations (parallax) only on flagship/hero — not standard articles. *(Web Storytelling p. 10, 16.)*

### Parallax budget
- Reserved for flagship case studies and homepage hero.
- Disabled when `prefers-reduced-motion` is set.
- Disabled on mobile by default (perf concerns).

---

## Build Optimization

### Build-time checks
- Lighthouse CI (mobile profile, 3G throttle).
- Bundle size analysis (per-page).
- Image optimization verification.
- Broken link check.
- Accessibility audit (pa11y).
- HTML validation.

### Deployment
- Atomic deployments (no partial states).
- Preview deployments per PR.
- Rollback within seconds.
- Edge CDN distribution.

---

## Decision Framework

When evaluating a performance-affecting change:

1. **Does it add JS to the critical path?**
2. **Does it block render?**
3. **Does it require new fonts or font weights?**
4. **Does it add third-party requests?**
5. **Does it affect LCP, CLS, or INP?**
6. **Can it be done at build time instead of runtime?**
7. **Can it be lazy-loaded?**
8. **Does it meet the per-template budget?**

Reject anything that pushes a template past budget without explicit justification logged in [[15_Decision_Log_Template]].

---

## Rules

1. **Static generation by default.**
2. **Reading works without JS.**
3. **Self-host fonts.** No Google Fonts CDN.
4. **Modern image formats** (AVIF / WebP / JPEG fallback).
5. **Width and height** on every image.
6. **Lazy load below the fold.**
7. **Defer all non-critical JS.**
8. **`font-display: swap`.**
9. **No third-party tracking.**
10. **`prefers-reduced-motion` respected.**
11. **Per-template budgets enforced in CI.**
12. **Core Web Vitals targets met across all templates.**

---

## Examples

### Good — hero image markup

```html
<picture>
  <source srcset="hero-320.avif 320w, hero-640.avif 640w, hero-1280.avif 1280w" type="image/avif" />
  <source srcset="hero-320.webp 320w, hero-640.webp 640w, hero-1280.webp 1280w" type="image/webp" />
  <img
    src="hero-640.jpg"
    srcset="hero-320.jpg 320w, hero-640.jpg 640w, hero-1280.jpg 1280w"
    sizes="(max-width: 640px) 100vw, 1280px"
    width="1280"
    height="720"
    alt="Detailed description of the hero image content"
    loading="eager"
    decoding="async"
  />
</picture>
```

### Bad — heavy hero

```html
<img src="hero-original.jpg" />
```

*4 MB original, no dimensions (CLS guaranteed), no responsive variants, lazy not set, no alt.*

---

## Common Mistakes

- **Google Fonts CDN.** Privacy + performance hit.
- **Carousel libraries** when CSS scroll-snap suffices.
- **Client-side syntax highlighting.**
- **No image dimensions** (CLS killer).
- **Inline base64 images** beyond ~1 KB.
- **Loading 6+ font weights** when 2 would do.
- **Third-party social embeds** (Twitter, YouTube) without lazy-loading.
- **Heavy hero animations on mobile.**
- **Forgetting to gzip/brotli.**
- **Setting cache-control to "no-cache" by default.**
- **Treating Lighthouse score as gospel** — measure RUM (real-user metrics) too.

---

## Checklist

For every new page or feature:

- [ ] LCP < 1.8s on mobile 3G simulation
- [ ] CLS < 0.05
- [ ] INP < 200ms
- [ ] Total bytes within template budget
- [ ] JS bytes within template budget
- [ ] All images have width + height
- [ ] All images have appropriate `loading` attribute
- [ ] Modern image formats served
- [ ] No render-blocking third-party scripts
- [ ] Fonts self-hosted, `font-display: swap`
- [ ] No tracking scripts
- [ ] Critical CSS inlined
- [ ] Reading works with JS disabled
- [ ] `prefers-reduced-motion` honored
- [ ] Lighthouse CI passes
- [ ] Bundle size diff < 10% in PR

---

## References

PDF sources:
- *Web UI Trends: The Elegance of Minimalism.* UXPin, 2015 — performance as minimalism (p. 28).
- *Visual Storyteller's Guide.* UXPin, 2015 — video rules (p. 44–45), usability > wow.
- *Clever Interactive Techniques for Web Storytelling.* UXPin, 2015 — restraint over flashiness, prefers-reduced-motion implied.
- *Web UI Trends: Card-Based Design Patterns.* UXPin, 2015 — cards require dev investment, reflow not restructure.
- *3 Common UX Mistakes Killing Good Design.* UXPin, 2015 — mobile-friendly, time-boxed animations.

Complementary modern guidance:
- web.dev Core Web Vitals documentation.
- *High Performance Browser Networking* (Ilya Grigorik).
- "Faster" by Maciej Cegłowski (essay on performance as respect).
- Astro / Next.js / Eleventy performance best practices.
- WebPageTest, Lighthouse, Calibre, SpeedCurve for measurement.
