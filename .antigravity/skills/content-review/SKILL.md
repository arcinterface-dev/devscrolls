---
name: content-review
description: >
  Invoke for the quarterly content review — auditing older posts for link rot,
  stale code samples, voice consistency, taxonomy health, and hero image quality.
  Also useful before annual planning.
inputs:
  - scope: full-site | category:[name] | sample-size:[N]
  - quarter: The quarter being reviewed (e.g., 2026-Q3)
---

# Content Review Skill

## Knowledge Base Files to Consult

1. `knowledge-base/06_Content_Strategy.md` — content lifecycle, maintenance step, evergreen targets
2. `knowledge-base/12_Branding_Guide.md` — voice rules ("thoughtful builder")
3. `knowledge-base/07_Information_Architecture.md` — taxonomy governance, tag audit rules
4. `knowledge-base/16_Checklists.md` — Checklist #9 (Content Review)

## Rationale

Content compounds only if it stays correct. The docs mandate quarterly audits, but
without a skill, the agent may skip steps or apply inconsistent criteria. This skill
codifies the exact audit process.

## Steps

### 1. Editorial calendar review
- [ ] At least one post per active category this quarter
- [ ] Content cluster gaps identified
- [ ] Pillar posts updated where relevant
- [ ] Evergreen ratio tracked (target: 60% evergreen, 30% timely, 10% experimental)

### 2. Sample older posts (pick 10)
For each sampled post, check:
- [ ] All links still working (no 404s)
- [ ] Code samples still work with current library versions
- [ ] Dates honest (`publishDate` untouched; `updatedDate` set if revised)
- [ ] Voice still matches current brand
- [ ] Cross-links still relevant
- [ ] Hero image still loads + matches brand

### 3. Taxonomy audit
- [ ] Tags allowlist audited (merge low-traffic, retire dead)
- [ ] Categories still match content reality
- [ ] No orphan tags (tags with zero posts)
- [ ] No synonym tags (pick one canonical name)

### 4. Voice consistency check
- [ ] Recent posts use "thoughtful builder" voice
- [ ] No clickbait headlines
- [ ] No exclamation marks in body
- [ ] Sources cited
- [ ] Failure/uncertainty acknowledged where applicable

### 5. Performance per post
- [ ] Hero images optimized
- [ ] Code blocks render fast
- [ ] No external embeds slowing load

### 6. Retirement review
For posts that are outdated:
- Never delete (URLs are permanent)
- Add banner: "This post is from [date]. See [successor]."
- Or 410 only if content is actively harmful (rare)

## Checklist (from 16_Checklists.md #9)

### Editorial calendar
- [ ] At least one post per active category this quarter
- [ ] Content cluster gaps identified
- [ ] Pillar posts updated

### Older posts (sample 10)
- [ ] All links working
- [ ] Code samples current
- [ ] Dates honest
- [ ] Voice matches brand
- [ ] Cross-links relevant
- [ ] Hero images load + match brand

### Taxonomy
- [ ] Tags audited
- [ ] Categories match reality
- [ ] No orphan tags

### Voice
- [ ] "Thoughtful builder" voice
- [ ] No clickbait
- [ ] No exclamation marks
- [ ] Sources cited

### Performance
- [ ] Hero images optimized
- [ ] Code blocks fast
- [ ] No slow embeds

## Output

- Content review report (markdown)
- List of posts needing updates (with specific issues)
- Taxonomy change recommendations
- Updated `tags.json` allowlist (if changes made)
