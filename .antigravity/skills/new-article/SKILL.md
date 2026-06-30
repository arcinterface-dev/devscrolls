---
name: new-article
description: >
  Invoke when creating a new blog article for the platform. Covers the full
  lifecycle from frontmatter scaffolding through content drafting, SEO metadata,
  image selection, and pre-publish verification.
inputs:
  - topic: The subject of the article
  - category: One of the controlled category list (engineering, design-systems, ai, career, tools, process, notes)
  - tags: Up to 5 tags from the allowlist
  - draft: Whether to create as draft (default: true)
---

# New Article Skill

## Knowledge Base Files to Consult

1. `knowledge-base/06_Content_Strategy.md` — article structure, voice, frontmatter schema, lifecycle
2. `knowledge-base/04_Typography_System.md` — heading hierarchy, code typography rules
3. `knowledge-base/08_SEO_Master_Guide.md` — meta tags, OG, JSON-LD, internal linking
4. `knowledge-base/12_Branding_Guide.md` — brand voice ("thoughtful builder")
5. `knowledge-base/03_Color_System.md` — callout state colors, code block colors
6. `knowledge-base/16_Checklists.md` — Checklist #1 (New Article)

## Steps

### 1. Scaffold frontmatter
Create the markdown file with all required frontmatter fields:

```yaml
---
title: ""              # ≤70 chars, ≤7 words preferred
description: ""        # 140–160 chars, action-oriented
publishDate: YYYY-MM-DD
updatedDate:           # set only on republish
category: ""           # one from controlled list
tags: []               # ≤5 from allowlist
heroImage: ""          # path to hero image
heroImageAlt: ""       # non-empty, descriptive
draft: true
canonical:             # URL if cross-posted
series:                # slug, optional
seriesOrder:           # number, optional
---
```

### 2. Write the article body
Follow the article anatomy (06_Content_Strategy):
1. **Lead paragraph** — 1–3 sentences, premise + stakes, `lead` type size
2. **Optional TL;DR** — bulleted summary for scanners
3. **Body** — h2/h3 sections with descriptive headings (never "Introduction"/"Conclusion")
4. **Resolution** — "Where this leaves us," not "In conclusion"
5. **Single CTA** — subscribe OR related OR contact (pick one)
6. **Footnotes + references** — real links, archived if critical

### 3. Voice check
- First person, present tense for ongoing learning
- No exclamation marks in body
- No "obviously" / "simply" / "just"
- Specific > clever for headlines
- Cite sources; show failure as well as success

### 4. Code blocks
- Always specify language
- Filename comment on first line when context matters
- Comment to explain *why*, not what
- Diff blocks use `+`/`-` prefix (not color alone)

### 5. SEO metadata
- `<title>` ≤ 60 chars: `[Post Title] — [Site Name]`
- Meta description: 140–160 chars, unique
- Canonical URL set
- OG image generated (1200×630)
- Twitter Card meta
- JSON-LD Article schema
- Internal links to ≥ 2 related posts

### 6. Image selection
Run the image selection checklist from 06_Content_Strategy:
- Matches persona? Custom > stock? Brand-palette aligned?
- Alt text fully describes the image
- Hero image distinct from other hero images on the index

### 7. Pre-publish verification
Run the **full New Article Checklist** from 16_Checklists.md (Checklist #1).

## Checklist (from 16_Checklists.md #1)

### Frontmatter
- [ ] `title` ≤ 70 chars (≤ 7 words preferred)
- [ ] `description` 140–160 chars, action-oriented
- [ ] `publishDate` set (ISO format)
- [ ] `category` from controlled list (one)
- [ ] `tags` ≤ 5 from allowlist
- [ ] `heroImage` path valid
- [ ] `heroImageAlt` non-empty, descriptive
- [ ] `draft: false` only when ready

### Content
- [ ] Lead paragraph orients the reader
- [ ] Headings hierarchical (no skipped levels)
- [ ] Code samples tested
- [ ] Every code block has language specified
- [ ] External links verified
- [ ] Internal links to ≥ 2 related posts
- [ ] All images have descriptive alt text
- [ ] One CTA at article end
- [ ] Voice matches "thoughtful builder"
- [ ] No exclamation marks in body
- [ ] Sources cited
- [ ] AI-generated content disclosed (if any)

### SEO
- [ ] Unique `<title>` ≤ 60 chars
- [ ] Unique meta description 140–160 chars
- [ ] Canonical URL set
- [ ] OG image generated and tested
- [ ] JSON-LD Article schema present
- [ ] One `<h1>` only

### Performance
- [ ] Hero image optimized (AVIF/WebP)
- [ ] `width` and `height` on every image
- [ ] Below-fold images `loading="lazy"`
- [ ] Total page weight within budget

### Accessibility
- [ ] Headings semantic + hierarchical
- [ ] Alt text on all images
- [ ] Code blocks accessible
- [ ] Color contrast verified

## Output

- A markdown file at the appropriate content path
- Generated OG image
- Updated sitemap and RSS (via build)
