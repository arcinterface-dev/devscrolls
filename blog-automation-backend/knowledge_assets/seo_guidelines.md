# 08 — SEO Master Guide

> Make the work discoverable without compromising it.

**Related:** [[02_Design_Principles]] · [[06_Content_Strategy]] · [[07_Information_Architecture]] · [[11_Performance_Guide]] · [[10_Accessibility_Standards]]

---

## Purpose

A complete SEO handbook for the platform: technical foundations, on-page rules, content patterns, and the Astro-specific implementation notes that turn SEO from an afterthought into a side-effect of doing the work well.

> SEO is **not** the goal of the platform. Quality content for a real audience is. But discoverability matters, and the techniques below are mostly invisible to readers while making the work findable.

> **The uploaded PDFs do not address SEO directly.** This document is sourced from current widely accepted best practices and clearly marked as complementary guidance. Where principles connect to platform decisions in other docs, cross-references are provided.

---

## Philosophy

1. **SEO is a side effect of good content + clean tech.** Excellent posts with semantic HTML, fast load, and clear structure rank.
2. **Write for humans, optimize for crawlers.** Never invert that order.
3. **Topic authority over keyword stuffing.** Comprehensive treatment of a subject beats sprinkling keywords.
4. **Permanence compounds.** Old posts continue earning links. URLs must not break.
5. **Accessibility and SEO overlap massively.** Doing accessibility right (semantic HTML, alt text, hierarchy) does most of SEO too.

---

## Technical SEO

### Site basics

- **HTTPS everywhere.** No mixed content.
- **Single canonical domain** (with or without `www`, pick one and 301 the other).
- **Crawl-friendly URL structure.** *(See [[07_Information_Architecture]].)*
- **Fast load.** *(See [[11_Performance_Guide]] — Core Web Vitals are a ranking factor.)*
- **Mobile-friendly.** Responsive at every breakpoint.
- **No interstitials** blocking content.
- **No broken internal links.** Verified at build.
- **404 page is helpful** (search + recent posts) with 404 HTTP status (not 200).

### `robots.txt`

```
User-agent: *
Allow: /

Disallow: /drafts/
Disallow: /preview/
Disallow: /_admin/
Disallow: /api/

Sitemap: https://[domain]/sitemap-index.xml
```

### XML sitemap

- Auto-generated at build time.
- Includes all public pages (posts, categories, tags, about, projects).
- Excludes drafts, previews, API endpoints.
- `<lastmod>` per entry.
- Submitted to Google Search Console + Bing Webmaster Tools.

### Canonical URLs

- Every page has `<link rel="canonical" href="...">` pointing to itself.
- Cross-posted articles point canonical to the platform's URL (the platform is canonical).
- When copies live elsewhere (dev.to, hashnode, Medium), set canonical on the **copies** pointing to this platform.

### Pagination

- Use `<link rel="prev">` and `<link rel="next">` on paginated archives (deprecated as signal but still useful).
- Numbered pages, not infinite scroll, for archives.
- Each page has a unique title and meta description.

### Hreflang (when multi-language)

- `<link rel="alternate" hreflang="en" href="...">` for each language.
- Include `hreflang="x-default"`.
- Plan URL structure (`/en/`, `/de/`) before adding.

---

## Semantic HTML

The single biggest SEO lever. Cross-references [[10_Accessibility_Standards]].

### Page structure
- One `<h1>` per page = the page's main topic.
- `<h2>` for major sections; `<h3>` for sub-sections. No skipped levels.
- `<article>` wraps each post.
- `<header>`, `<nav>`, `<main>`, `<footer>` for page regions.
- `<time datetime="2026-06-30">` for dates.
- `<address>` for author contact.

### Inline semantics
- `<strong>` for genuine emphasis, not styling.
- `<em>` for stress emphasis (often italic).
- `<cite>` for cited work titles.
- `<blockquote>` with `cite` attribute for quotations.
- `<abbr title="...">` for acronyms.
- `<code>`, `<pre>` for code.
- `<kbd>` for keyboard input.

---

## Metadata

### `<title>` element

- ≤ 60 characters (longer gets truncated in SERPs).
- Format: `[Post Title] — [Site Name]`
- Each page has a unique title.
- Title element is the **post title**, not "Blog | My Site."

### Meta description

- 140–160 characters.
- Action-oriented summary, not keyword stuffing.
- Each page has a unique description.
- If not set, derive from the lead paragraph.

### Other meta tags

```html
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta charset="UTF-8" />
<meta name="theme-color" content="#1f3d6b" />
<meta name="color-scheme" content="light dark" />
<meta name="author" content="..." />
<meta name="generator" content="Astro" />   <!-- optional -->
```

---

## Open Graph

For social-link previews (Facebook, LinkedIn, Slack, Discord, etc.).

```html
<meta property="og:type" content="article" />
<meta property="og:url" content="https://[domain]/writing/[category]/[slug]" />
<meta property="og:title" content="..." />
<meta property="og:description" content="..." />
<meta property="og:image" content="https://[domain]/og/[slug].png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:alt" content="..." />
<meta property="og:locale" content="en_US" />
<meta property="og:site_name" content="..." />
<meta property="article:published_time" content="2026-06-30T..." />
<meta property="article:modified_time" content="..." />
<meta property="article:author" content="..." />
<meta property="article:section" content="Engineering" />
<meta property="article:tag" content="astro" />
```

### OG image generation
- Build-time generation per post (using Satori or similar).
- Template: brand wordmark + post title + minimal accent. *(See [[12_Branding_Guide]].)*
- 1200×630 PNG or JPG.
- Stored at `/og/[slug].png` (or similar).
- Always tested in real link unfurlers (Slack debug link, OpenGraph.xyz).

---

## Twitter / X Cards

```html
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:site" content="@handle" />
<meta name="twitter:creator" content="@handle" />
<meta name="twitter:title" content="..." />
<meta name="twitter:description" content="..." />
<meta name="twitter:image" content="https://[domain]/og/[slug].png" />
<meta name="twitter:image:alt" content="..." />
```

---

## Structured Data (JSON-LD)

Embed JSON-LD in `<script type="application/ld+json">`. Use schema.org types.

### Article schema (for posts)

```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "...",
  "description": "...",
  "image": "https://[domain]/hero/[slug].jpg",
  "datePublished": "2026-06-30T00:00:00Z",
  "dateModified": "2026-07-15T00:00:00Z",
  "author": {
    "@type": "Person",
    "name": "...",
    "url": "https://[domain]/about"
  },
  "publisher": {
    "@type": "Person",
    "name": "...",
    "url": "https://[domain]"
  },
  "mainEntityOfPage": "https://[domain]/writing/[category]/[slug]",
  "articleSection": "Engineering",
  "keywords": "..."
}
```

### Person schema (for /about)

```json
{
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "...",
  "url": "https://[domain]",
  "image": "https://[domain]/author.jpg",
  "sameAs": ["https://github.com/...", "https://bsky.app/..."],
  "jobTitle": "...",
  "description": "..."
}
```

### BreadcrumbList (on deep pages)
### TechArticle / HowTo (for tutorials)
### FAQ (for FAQ sections, when present)

---

## Internal Linking

Internal links pass authority and help readers/crawlers traverse the site.

### Rules
- **Descriptive anchor text.** "Astro content collections" not "click here."
- **Link from new posts to related older posts.** Maintains topic clusters.
- **Link from older posts to newer "successor" posts** when applicable. Re-publish + update.
- **In-article TOC** with anchor links to headings.
- **Related posts** at article end (algorithmically based on tags/category).
- **Footer with sitemap or top-section links** for global navigation discovery.

### Topic clusters
- Pillar posts (comprehensive on a topic) at top level.
- Sub-topic posts link **up** to the pillar.
- Pillar links **down** to sub-topic posts.
- Tag pages function as cluster hubs.

---

## Content Clusters

Group related content into clusters around pillar topics.

### Example cluster structure

**Pillar:** "Building a static blog with Astro" (comprehensive, regularly updated).

**Sub-posts:**
- "Astro content collections: a deep dive"
- "MDX patterns I keep reusing"
- "From Markdown to Open Graph: the build pipeline"
- "How I structure shared components in Astro"

**All sub-posts:**
- Link to the pillar.
- Tagged with the same tag (`astro`).
- Listed on the pillar's "Related Posts" section.

Result: topic authority for "Astro" accrues across the cluster.

---

## Topic Authority and E-E-A-T

Google's E-E-A-T = **Experience, Expertise, Authoritativeness, Trustworthiness.**

### How the platform earns it
- **Experience:** First-person accounts. "I migrated 200K rows." Real numbers, real screenshots.
- **Expertise:** Depth over breadth. One subject covered thoroughly.
- **Authoritativeness:** Citations from credible sources. Linked-to by peers in the space.
- **Trustworthiness:** Author bio with real name + verifiable credentials. Transparent about sponsorships/disclosures. Honest publish + update dates.

### Signals in practice
- About page with bio, photo, contact, professional links.
- Author byline on every post.
- "Last updated" date visible on posts.
- Source citations in posts.
- No anonymous content.
- No AI-generated content without disclosure.

---

## Core Web Vitals

*(See [[11_Performance_Guide]] for full budget; SEO-relevant summary here.)*

| Metric | Good | Needs Improvement | Poor |
|--------|------|---------------------|------|
| LCP | < 2.5s | 2.5–4.0s | > 4.0s |
| CLS | < 0.1 | 0.1–0.25 | > 0.25 |
| INP | < 200ms | 200–500ms | > 500ms |

CWV are confirmed ranking signals. The platform targets **upper edge of "Good"** across all templates.

---

## Image SEO

### Filenames
- Descriptive, kebab-case: `astro-content-collections-architecture.png` not `image1.png`.

### Alt text
- Required, descriptive. *(See [[10_Accessibility_Standards]].)*
- Describes content/function, not "image of."

### Image sitemap (optional)
- Submit images via main sitemap or a dedicated image sitemap.
- Include `<image:image>` entries for each significant image.

### Optimization
- *(See [[11_Performance_Guide]] for image optimization rules.)*

---

## Markdown SEO

### Heading discipline
- One `<h1>` (rendered from frontmatter title).
- `<h2>` for major sections.
- Descriptive headings — "Setting up Astro for content collections" beats "Setup."

### Anchor links
- Auto-generated heading IDs.
- Linked "copy anchor" icon on heading hover.

### Body
- Lead paragraph contains the post's keyword + a one-sentence summary.
- First 100 words orient the reader and crawler.
- Body covers the topic comprehensively.

---

## Astro SEO Best Practices

(Reflects current ecosystem norms.)

### Use built-ins
- `@astrojs/sitemap` for sitemap generation.
- `@astrojs/rss` for RSS.
- Content Collections for typed frontmatter.

### Component patterns
- A reusable `<SEO>` component accepting `{ title, description, image, type, publishDate }`.
- `<canonical>`, `<og:*>`, `<twitter:*>` rendered from a single source.
- JSON-LD via a `<StructuredData>` component.

### Build-time generation
- OG images via Satori or similar.
- Pre-render every page.
- Validate frontmatter via Zod schemas in Content Collections.

### Astro-specific gotchas
- Don't ship JS frameworks (React, Vue, Svelte) to the client unless interactive — Astro hydrates on demand.
- Use `client:visible` or `client:idle` for non-critical components.
- Inline critical CSS automatically — don't fight it.

---

## Rich Snippets

Eligible types for this platform:

- **Article rich snippet** — title, image, date.
- **Breadcrumbs** — hierarchy in SERP.
- **FAQ rich snippet** — if FAQ blocks added to posts.
- **HowTo rich snippet** — for tutorials.
- **Software Application** (optional) — for tools section.

Test all structured data with Google's Rich Results Test.

---

## Decision Framework

When making an SEO-relevant decision:

1. **Does it serve readers first?** If no, don't ship it.
2. **Does it preserve canonical URLs?** Renaming breaks SEO.
3. **Does it maintain semantic HTML?** Headings, lists, structure.
4. **Does it add useful structured data?**
5. **Does it pass Core Web Vitals?**
6. **Does it preserve internal linking?**
7. **Does it earn E-E-A-T signals?**
8. **Is it indexed (no `noindex` unless intentional)?**

---

## Rules

1. **HTTPS everywhere.**
2. **One canonical URL per page.**
3. **Permanent URLs.**
4. **Unique `<title>` and meta description per page.**
5. **One `<h1>` per page.**
6. **Hierarchical headings, no skips.**
7. **Alt text on every image.**
8. **Open Graph + Twitter Card per post.**
9. **JSON-LD structured data per content type.**
10. **XML sitemap auto-generated, submitted.**
11. **RSS feed with full content.**
12. **Core Web Vitals "Good" across templates.**
13. **Internal linking from new to related older posts.**
14. **No keyword stuffing.**
15. **AI-generated content disclosed.**

---

## Examples

### Good — article meta tags

```html
<title>Astro Content Collections: A Deep Dive — Site Name</title>
<meta name="description" content="A practical tour of Astro Content Collections — schema validation, querying, and the patterns I use to keep a 200-post blog organized." />
<link rel="canonical" href="https://[domain]/writing/engineering/astro-content-collections" />
<meta property="og:title" content="Astro Content Collections: A Deep Dive" />
<meta property="og:description" content="A practical tour..." />
<meta property="og:type" content="article" />
<meta property="og:image" content="https://[domain]/og/astro-content-collections.png" />
<meta property="article:published_time" content="2026-06-30T00:00:00Z" />
```

### Bad — generic, keyword-stuffed

```html
<title>Astro Tutorial Blog Content Collections Best Static Site Generator 2026</title>
<meta name="description" content="Learn Astro tutorial best static site generator 2026 with content collections tips tricks." />
```

*Reads as keyword soup. SERP will likely truncate or rewrite. Trust signal: 0.*

---

## Common Mistakes

- **Renaming URLs without redirects.**
- **Same `<title>` and meta description across pages.**
- **Missing alt text** (hurts both a11y and image search).
- **Skipping heading levels.**
- **Auto-generated OG images that don't match the brand.**
- **Stuffing keywords** into titles, headings, alt text.
- **AI content without disclosure** (Google's policies penalize manipulative AI).
- **Infinite scroll** without paginated fallback.
- **Hiding text with CSS** to game crawlers.
- **No `lang` attribute on `<html>`.**
- **Slow LCP** from un-optimized hero images.
- **Mobile usability failures.**
- **Broken internal links accumulating over time.**

---

## Checklist

For every post before publish:

- [ ] Unique `<title>` ≤ 60 chars
- [ ] Unique meta description 140–160 chars
- [ ] Canonical URL set
- [ ] OG image generated and tested
- [ ] Twitter Card tested
- [ ] JSON-LD Article schema present
- [ ] One `<h1>`; hierarchical headings
- [ ] All images have alt text
- [ ] Internal links to ≥ 2 related posts
- [ ] External links use descriptive anchor text
- [ ] Slug is descriptive and permanent
- [ ] Reading time computed
- [ ] Date set; `<time datetime="...">` used
- [ ] No broken links (build check)
- [ ] Sitemap regenerated
- [ ] Core Web Vitals "Good"
- [ ] Indexable (no accidental `noindex`)

For every quarterly audit:

- [ ] Search Console: any indexing errors?
- [ ] Core Web Vitals: any regressions?
- [ ] Broken links: any 404s in logs?
- [ ] Internal linking: any orphan posts?
- [ ] Sitemap: complete and current?

---

## References

PDF sources do not address SEO directly. This document is built primarily from current widely accepted best practices, with cross-references to PDF-grounded principles where they overlap:

- *White Space in Web UI Design.* UXPin, 2015 — content-first approach informs E-E-A-T philosophy.
- *3 Common UX Mistakes.* UXPin, 2015 — content-first ordering aligns with SEO-by-quality.
- *Web UI Trends: The Elegance of Minimalism.* UXPin, 2015 — performance benefits feed CWV.

Complementary modern guidance (primary):
- Google Search Central documentation (developers.google.com/search).
- Schema.org type reference.
- web.dev Core Web Vitals documentation.
- Astro SEO docs (docs.astro.build).
- *The Art of SEO* (Enge, Spencer, Stricchiola).
- Search Engine Land for ongoing policy changes.
- Open Graph Protocol (ogp.me).
- Twitter Card documentation.
