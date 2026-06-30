---
name: seo-audit
description: >
  Invoke when auditing the platform's SEO health. Run quarterly, after significant
  content or structural changes, or before major releases.
inputs:
  - scope: What to audit (full-site | post:[slug] | template:[name])
---

# SEO Audit Skill

## Knowledge Base Files to Consult

1. `knowledge-base/08_SEO_Master_Guide.md` — technical SEO, metadata, structured data, CWV, E-E-A-T
2. `knowledge-base/07_Information_Architecture.md` — URL patterns, sitemaps, RSS
3. `knowledge-base/06_Content_Strategy.md` — frontmatter schema, content clusters
4. `knowledge-base/11_Performance_Guide.md` — Core Web Vitals
5. `knowledge-base/16_Checklists.md` — Checklist #4 (SEO Review)

## Steps

### 1. Crawlability check
- [ ] `robots.txt` valid and correct
- [ ] XML sitemap submitted to Search Console + Bing
- [ ] No accidental `noindex` on indexable pages
- [ ] No broken internal links (build check passes)
- [ ] No orphan posts (every post linked from somewhere)

### 2. On-page metadata check
For every post, verify:
- [ ] Unique `<title>` ≤ 60 chars (format: `[Post Title] — [Site Name]`)
- [ ] Unique meta description 140–160 chars
- [ ] Canonical URL set and self-referencing
- [ ] OG image generated (1200×630) and tested in unfurlers
- [ ] Twitter Card working
- [ ] JSON-LD Article schema present and valid
- [ ] One `<h1>` per page, hierarchical headings

### 3. Structured data validation
- [ ] Article schema on every post
- [ ] Person schema on /about
- [ ] BreadcrumbList on deep pages
- [ ] TechArticle/HowTo on tutorials (if applicable)
- [ ] Test all with Google Rich Results Test

### 4. Content quality check
- [ ] Topic clusters identified (pillars + sub-posts)
- [ ] Internal linking dense within clusters
- [ ] No keyword stuffing
- [ ] No thin content
- [ ] AI-generated content disclosed
- [ ] No paywalls or interstitials
- [ ] E-E-A-T signals present (author bio, citations, dates, real experience)

### 5. Technical check
- [ ] HTTPS everywhere
- [ ] One canonical domain (www vs non-www decided)
- [ ] Core Web Vitals "Good" across templates
- [ ] Mobile-friendly (Search Console)
- [ ] `<html lang="en">` set
- [ ] All images have alt text
- [ ] `<time datetime>` for dates

### 6. Feed check
- [ ] RSS feed at `/rss.xml` working
- [ ] RSS includes full content (not just summary)
- [ ] Per-category RSS feeds if applicable

## Checklist (from 16_Checklists.md #4)

### Crawlability
- [ ] `robots.txt` valid
- [ ] XML sitemap submitted
- [ ] No accidental `noindex`
- [ ] No broken internal links
- [ ] No orphan posts

### On-page
- [ ] All posts have unique titles + descriptions
- [ ] All posts have canonical URLs
- [ ] All posts have OG image + Twitter Card
- [ ] All posts have JSON-LD Article schema
- [ ] About page has Person schema

### Technical
- [ ] HTTPS everywhere
- [ ] One canonical domain
- [ ] Core Web Vitals "Good"
- [ ] Mobile-friendly
- [ ] No "Page experience" issues

### Content
- [ ] Topic clusters identified
- [ ] Internal linking dense
- [ ] No keyword stuffing
- [ ] No thin content
- [ ] AI content disclosed

### Off-page
- [ ] Backlinks reviewed
- [ ] Brand mentioned in social profiles
- [ ] RSS feed working

## Output

- SEO audit report (markdown) with findings per category
- List of pages with metadata issues
- Recommended fixes prioritized by SEO impact
