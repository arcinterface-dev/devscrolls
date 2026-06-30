# 07 — Information Architecture

> The structural skeleton of the platform: how content is organized, named, and discoverable.

**Related:** [[01_Project_Vision]] · [[05_UX_Guidelines]] · [[06_Content_Strategy]] · [[08_SEO_Master_Guide]] · [[13_Future_Scalability]]

---

## Purpose

Information Architecture (IA) is the *structure* of information and how it flows; Content Strategy (see [[06_Content_Strategy]]) is the *user-facing considerations* on top of that structure. *(UX Process p. 17.)*

This document defines the platform's navigation philosophy, content hierarchy, URL strategy, taxonomy, and scalability principles — without any implementation detail.

---

## Philosophy

Three commitments shape the IA:

1. **One navigation paradigm site-wide.** *(Consistency p. 33; Xfinity counter-example p. 34–35.)* The reader learns the navigation once and applies it everywhere.
2. **Forest and tree.** Sitemaps depict all pages and how they interconnect (forest view); individual pages have their own internal hierarchy (tree view). Both altitudes must be maintainable. *(UX Process p. 18.)*
3. **Categories follow mental models, not internal logic.** Validate with card-sorting. *(Card-Based p. 13.)*

---

## Navigation Philosophy

### Primary navigation (≤5 items)

Cap at five. *(Minimalism p. 24.)*

```
Home  |  Writing  |  Projects  |  About  |  Contact
```

Each item is durable. Adding or removing requires:
- An entry in [[15_Decision_Log_Template]].
- Audit of all pages linking to the old structure.
- Redirect rules for moved/removed pages.

### Secondary navigation

- **In-article TOC** (right rail desktop, top mobile).
- **Tag/category footer** on each post.
- **Series navigation** for multi-part posts (prev / next / series index).
- **Breadcrumbs** on deep pages.

### Footer navigation (minimal)

- Copyright + year (auto-current).
- 3–4 links: RSS, Newsletter, Sitemap, Privacy.
- No social-icon clusters.
- No "recent posts" widget. *(Minimalism p. 24.)*

---

## Content Organization

### Top-level structure (the "forest")

```
/
├── /            (Home — featured + latest)
├── /writing     (All posts, paginated)
│   ├── /writing/[category]      (Category archive)
│   ├── /writing/tag/[tag]       (Tag archive)
│   ├── /writing/[year]          (Year archive)
│   ├── /writing/[slug]          (Individual post)
│   └── /writing/series/[slug]   (Series page)
├── /projects    (Portfolio index)
│   └── /projects/[slug]         (Individual case study)
├── /notes       (TIL stream)
│   └── /notes/[slug]            (Individual note)
├── /about       (Long-form about page)
├── /now         (What's current — updated monthly)
├── /contact     (Contact + form + alternatives)
├── /tools       (Future: standalone web tools)
│   └── /tools/[slug]
├── /talks       (Future: talks/appearances index)
├── /rss.xml
├── /sitemap.xml
├── /robots.txt
└── /404
```

### Page-level structure (the "tree")

Each template has a defined internal hierarchy. See [[06_Content_Strategy]] for article anatomy.

---

## Categories

Top-level **content types** (mutually exclusive — every piece belongs to exactly one):

- Writing (long-form articles)
- Projects (case studies)
- Notes (TIL stream)
- Tools (future)
- Talks (future)

**Categories within Writing** (controlled vocabulary, ≤7):
See [[06_Content_Strategy]] for the list.

### Why categories matter
- Mental-model alignment for navigation.
- URL stability (`/writing/engineering/...`).
- RSS sub-feeds per category.
- Sitemap structure.

---

## Tags

Tags are **cross-cutting labels** within a category. *(See [[06_Content_Strategy]] for tag rules.)*

### IA implications
- Each tag has a dedicated archive page (`/writing/tag/astro`).
- Tag archive lists all posts with that tag, regardless of category.
- Tag pages have own metadata (title, description, OG image).
- Tag count visible (e.g., "12 posts").

---

## Collections

Curated groupings beyond category/tag. *(Future feature.)*

Examples:
- "Beginner's path through this site" — recommended reading order.
- "All my AI agent experiments" — themed collection across categories.
- "Annual best-of" — annual review collection.

Collections live at `/collections/[slug]` and behave like a curated reading list.

---

## Archives

Time-based browsing.

- **By year**: `/writing/2026` — all posts published in 2026.
- **By month**: only if volume warrants; aggregate at year level otherwise.
- **All-time archive**: `/writing/archive` — full chronological list, lightweight (no images).

Archives must be **complete** — no hidden posts. URLs are permanent. *(Vision rule.)*

---

## Search Strategy

Search complements browsing. Some readers know what they want; others browse.

### What's indexed
- Post title
- Post description
- Post body (plain text)
- Headings (weighted higher)
- Tags
- Code blocks (filterable)
- Author name (if multi-author)

### What's NOT indexed
- Draft posts.
- Hidden notes (if any).
- Cross-posted canonicals on external sites.

### Search UX
See [[05_UX_Guidelines]] — instant results, keyboard-first, command palette via `Cmd+K`.

### Implementation
- Year 0–1: client-side index (e.g., Pagefind, FlexSearch, Fuse.js). Static, no backend.
- Year 2+: optionally upgrade to hosted (Algolia, Meilisearch) if volume demands.

---

## URL Philosophy

URLs are content. They should be:

1. **Permanent.** Once published, never changed. *(Vision rule.)*
2. **Readable.** Slugs are kebab-case English, not random IDs.
3. **Hierarchical.** Reflects mental model: `/writing/engineering/astro-content-collections`.
4. **Lowercase.** Always.
5. **No trailing slash redundancy.** Pick one (`/writing/` vs `/writing`) and 301 the other.
6. **No query parameters for content.** `?id=42` is bad; `/writing/post-slug` is good.
7. **Localized later if needed.** Reserve `/en/`, `/de/` prefixes; default has no prefix.

### URL patterns

| Pattern | Example |
|---------|---------|
| Home | `/` |
| Article | `/writing/[category]/[slug]` |
| Category archive | `/writing/[category]` |
| Tag archive | `/writing/tag/[tag]` |
| Year archive | `/writing/[year]` |
| Project | `/projects/[slug]` |
| Note | `/notes/[slug]` |
| Author (future multi-author) | `/authors/[slug]` |
| RSS | `/rss.xml`, `/writing/[category]/rss.xml` |
| Sitemap | `/sitemap.xml`, `/sitemap-index.xml` |

### URL anti-patterns

- `/blog/2026/01/15/my-post` — date in URL ages the content artificially.
- `/p/123` — opaque IDs.
- `/category/sub-category/sub-sub/...` — too deep; cap at 3 levels.
- Renaming `/blog` → `/writing` without redirects.

---

## Taxonomy Governance

Taxonomy = the controlled vocabularies. *(UX Process p. 18 — "usable, valid, controlled.")*

### Governance rules
- New tag requires editor justification (even for solo).
- Tag retirement requires a redirect to the most relevant existing tag.
- Annual audit: merge low-traffic tags, archive dead ones, surface emerging themes.
- Categories change only with a documented decision in [[15_Decision_Log_Template]].

### Taxonomy file
Maintain a single source of truth (e.g., `src/taxonomy.ts` or `content/_taxonomy.yml`):

```yaml
categories:
  - slug: engineering
    name: Engineering
    description: ...
  - slug: design-systems
    ...

tags:
  - slug: astro
    name: Astro
    aliases: []
  - slug: design-tokens
    name: Design Tokens
    aliases: ['tokens']
  ...
```

---

## Scalability Principles

The IA must scale from ~10 posts (Year 0) to 500+ posts (Year 5+) without restructuring. *(See [[13_Future_Scalability]] for full discussion.)*

### Anti-fragility tactics

1. **Don't put dates in URLs.** *(Already covered.)* Allows perennial content to age gracefully.
2. **Don't put author in URL** unless multi-author. Removing later breaks links.
3. **Pagination is opt-in, not infinite scroll.** Readers and search bots prefer enumerable pages.
4. **Category pages paginate at 20 posts.** Beyond that, archive view.
5. **Tag pages limited to 50 posts visible; older posts in archive.**
6. **Search becomes the primary discovery tool past ~100 posts.**

### Content type expansion

Future content types (Tools, Talks, Collections) get their own top-level paths. Don't shoehorn into existing categories.

### Multi-language preparation

Even if not multi-language at Year 0:
- Plan URL structure to allow `/en/`, `/de/` prefixes.
- Use language-tagged content collections.
- Hreflang ready (see [[08_SEO_Master_Guide]]).

---

## Sitemaps

### XML sitemap
- Auto-generated at build.
- One sitemap-index.xml + sub-sitemaps per content type if total > 1000 URLs.
- Includes `lastmod` for each URL.
- Submitted to search consoles.

### HTML sitemap
- `/sitemap` — human-readable, organized by section.
- Useful for "lost traveler" navigation and SEO.

---

## RSS Feeds

The RSS feed is a first-class output, not an afterthought.

### What's published
- Main feed: `/rss.xml` — all posts, latest 20.
- Per-category feeds: `/writing/[category]/rss.xml`.
- Per-tag feeds (future).

### What's included per item
- Full post content (HTML, not just summary).
- Author name.
- Categories + tags.
- Publication date.
- Permalink to canonical URL on this site.

### Why
RSS readers serve the most committed readers. Honor them with complete content.

---

## Robots

`robots.txt` rules:

```
User-agent: *
Allow: /

Disallow: /drafts/
Disallow: /preview/
Disallow: /_admin/

Sitemap: https://[domain]/sitemap-index.xml
```

Block AI crawlers? Optional decision logged separately. Default: allow (writing is for being read).

---

## Decision Framework

When designing a new IA element (category, page type, navigation change):

1. **Does it match a real reader mental model?** If not, sharpen or skip.
2. **Does it preserve the one-navigation-paradigm rule?** *(Consistency p. 33.)*
3. **Does it require URL changes?** If yes, redirect plan required.
4. **Does it scale to 10x content volume?**
5. **Does it survive 5-year framework changes?**
6. **Is the controlled vocabulary defensible?** No synonyms, no orphans.
7. **Is it logged?** New top-level page or taxonomy = [[15_Decision_Log_Template]] entry.

---

## Rules

1. **One navigation paradigm site-wide.**
2. **≤5 primary nav items.**
3. **URLs are permanent.**
4. **Slugs are kebab-case English, lowercase.**
5. **Every page belongs to a top-level category.**
6. **Each post belongs to exactly one category.**
7. **≤5 tags per post; tags from allowlist.**
8. **3-level URL maximum** (excluding domain).
9. **Sitemap auto-generated, submitted to search consoles.**
10. **RSS includes full content.**
11. **Annual taxonomy audit required.**

---

## Examples

### Good — adding a "Tools" section

> A new top-level path `/tools/` with index + per-tool pages. → New navigation item (now 6 — re-evaluate whether About should collapse). Sitemap updated. RSS sub-feed added. Logged decision. **Approved with About moved into a dropdown if nav exceeds 5.**

### Bad — using dates in URLs

> `/blog/2026/01/the-thing`. → Ages the content visually even if it's still relevant. Forces date-based mental model. **Reject** — use `/writing/[category]/the-thing` and put date in metadata.

### Bad — restructuring without redirects

> "Let's move all `/blog/` posts to `/writing/`." → Breaks every external link and existing RSS feed. **Reject** unless redirects are committed: `/blog/(.*)` → `/writing/$1` permanent (301).

---

## Future Considerations

- **Multi-author**: Reserve `/authors/[slug]`. Update URL plans before introducing.
- **Internationalization**: Reserve `/[lang]/` prefix. Don't bake English assumption into routes.
- **API endpoints**: If tools need APIs, `/api/[tool]/` — never collide with content.
- **Documentation site**: If an OSS project gets its own docs, consider subdomain (`docs.[domain]`) rather than `/docs/` to avoid IA coupling.
- **Newsletter archive**: `/newsletter/[issue]` or `/writing/newsletter/[issue]` — decide before launch.
- **Comments**: If added, decide whether they live on the post page or `/comments/[slug]` — affects URL stability if migrated later.

---

## Common Mistakes

- **Dates in URLs.** Decays perceived freshness.
- **Multiple nav paradigms (tabs + dropdowns + sidebars).** *(Consistency p. 34–35, Xfinity.)*
- **Free-form tagging.** Becomes a wasteland.
- **Renaming top-level paths.** Breaks every external link.
- **Hiding old posts.** Breaks the "URLs are permanent" rule.
- **Forgetting RSS.** Loses the most loyal readers.
- **Skipping sitemap.** Loses search ranking.
- **Confusing IA with content strategy.** *(UX Process p. 17.)*

---

## Checklist

For any IA change:

- [ ] Documented in [[15_Decision_Log_Template]]?
- [ ] Card-sorting tested with ≥3 readers? *(Card-Based p. 13.)*
- [ ] One navigation paradigm preserved?
- [ ] URL changes have 301 redirects?
- [ ] Sitemap regenerated and submitted?
- [ ] RSS sub-feeds updated if applicable?
- [ ] Internal cross-links audited and updated?
- [ ] Search index includes new content type?
- [ ] Taxonomy file updated?
- [ ] Breadcrumbs and meta updated?
- [ ] Doesn't break the 5-year scalability commitment?

---

## References

- *Getting Started With UX Design Process & Documentation.* UXPin, 2015 — sitemaps, taxonomies, journey maps, IA vs content strategy.
- *Consistency in UI Design.* UXPin, 2015 — one nav paradigm site-wide.
- *Web UI Trends: Card-Based Design Patterns.* UXPin, 2015 — card-sorting research, magazine prioritization.
- *Web UI Trends: The Elegance of Minimalism.* UXPin, 2015 — ≤5 nav items.

Complementary modern guidance:
- *Information Architecture* (Rosenfeld, Morville, Arango).
- *Don't Make Me Think* (Steve Krug) on navigation conventions.
- Cool URIs don't change (Tim Berners-Lee).
- IndieWeb principles on URL durability and feed-first publishing.
