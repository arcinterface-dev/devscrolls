# 06 — Content Strategy

> The rules and rhythms of what the platform publishes and how it stays alive.

**Related:** [[01_Project_Vision]] · [[02_Design_Principles]] · [[04_Typography_System]] · [[07_Information_Architecture]] · [[12_Branding_Guide]]

---

## Purpose

Define the editorial system: what kinds of content the platform publishes, how each kind is structured, how it's metadata-tagged, and how content stays healthy over years.

> "Content forms the foundation of all design, and it's what users actually care about." *(3 UX Mistakes p. 12.)*

---

## Philosophy

The platform's content philosophy rests on three pillars:

1. **Write because writing is thinking.** Every post serves the writer's understanding first, the reader's second. Posts that don't pass the "did I learn something writing this?" test rarely serve readers either.
2. **Compound, don't churn.** Evergreen long-form > daily ephemera. One excellent post per month beats 10 mediocre ones.
3. **Maintenance is editorial.** Old posts get re-read, updated, or retired. Content rot is a content problem. *(UX Process p. 16–17 — "maintenance comes first.")*

---

## Blog Categories

Controlled vocabulary, ≤7 categories. *(UX Process p. 18 — taxonomies as controlled vocabularies.)*

| Category | What lives here | Target frequency |
|----------|-----------------|------------------|
| **Engineering** | Code patterns, frameworks, debugging deep-dives, architecture | 1–2/month |
| **Design Systems** | Components, tokens, design tools, type/color theory applied | 1/month |
| **AI** | LLM patterns, agents, prompts, integrations, experiments | 1–2/month |
| **Career** | Job-search lessons, interview retrospectives, growth notes | 1/quarter |
| **Tools** | Editor configs, workflows, productivity setup | 1/quarter |
| **Process** | Writing, learning, project rituals | as relevant |
| **Notes** | Short-form TILs (Today I Learned), bookmark commentary | weekly to biweekly |

Each post belongs to **exactly one** category. Categories are durable — adding a category is a decision logged in [[15_Decision_Log_Template]].

---

## Tags

Tags are flexible labels within a category. *(UX Process p. 18; UX Guidelines for tag display.)*

- **5 tags maximum per post.** More dilutes signal.
- Tags are author-suggested + editor-approved. Maintain a `tags.json` allowlist; new tags require justification.
- Tag names: lowercase, hyphenated (`design-systems`, `astro`, `ai-agents`).
- Avoid synonyms — pick one (`react` not also `reactjs`).
- Annual tag audit: merge low-traffic tags, retire dead ones.

---

## Article Structure

The structural skeleton of every long-form post. *(Reflects Human Eye F-pattern, narrative arc from Web Storytelling p. 24–25, density curve from Minimalism p. 22.)*

```
1. Frontmatter (YAML)
   - title (≤70 chars, ≤7 words for hero rendering)
   - description (140–160 chars for SEO + social)
   - publishDate (ISO format)
   - updatedDate (ISO format; set when re-published)
   - category (one of the controlled list)
   - tags (≤5)
   - heroImage (path)
   - heroImageAlt (required, non-empty)
   - draft (boolean; defaults false)
   - canonical (URL, if cross-posted)
   - series (slug, optional)
   - seriesOrder (number, optional)

2. Hook (lead paragraph)
   - 1–3 sentences setting the question/stake.
   - Lead type size — larger than body.

3. Optional TL;DR
   - Bulleted summary for scanners.
   - Marks key takeaways for return readers.

4. Body
   - h2 / h3 sections with descriptive headings (not "Introduction," "Conclusion").
   - Code blocks with language and optional file path.
   - Diagrams or images at scene changes.
   - Callouts (Note, Tip, Warning) for non-linear info.
   - Pull-quotes for scanner-bait emphasis.

5. Resolution
   - "Where this leaves us," not "In conclusion."
   - One sentence summarizing the new state of understanding.

6. CTA (one only)
   - Subscribe / Related posts / Contact — pick one based on post type.

7. Footnotes + references
   - Real links, archived if critical.
   - Inline references with back-links.
```

---

## Writing Standards

### Voice

> The "thoughtful builder." *(See [[12_Branding_Guide]] for full voice spec.)*

- First-person, plain, present tense for ongoing learning.
- "I" not "we" unless genuinely collaborative.
- No exclamation marks in body text. Reserve for genuine surprise in dialog/quotes.
- No "obviously," "simply," "just" — minimizing words alienate readers struggling with the topic.
- Claim → evidence → context. Don't claim without showing.

### Headlines

- **5–7 words preferred** for hero rendering. *(Web Storytelling p. 16; Visual Storytellers p. 59.)*
- Specific > clever. "Migrating 200K rows without downtime" beats "A Story of Migration."
- Numbers in headlines are honest, not clickbait. "5 things" only if there are genuinely 5 distinct things.
- Title case for h1; sentence case for h2/h3.

### Paragraphs

- 2–5 sentences. Long monoliths hide structure; one-liners feel choppy. *(Typography System.)*
- One idea per paragraph. If you find yourself writing "and another thing," it's a new paragraph.

### Code

- Always specify language for syntax highlighting.
- Include filename when context matters.
- Comment to explain *why*, not what.
- Long code blocks: prefer linking to a Gist/repo with an excerpt.
- Diff blocks for before/after, with `+`/`-` prefixes (not color-only).

### Links

- Descriptive anchor text. Never "click here." *(Accessibility — see [[10_Accessibility_Standards]].)*
- External links open in same tab (let the user choose; `target="_blank"` only for explicit "open in new tab" CTAs).
- Internal links use the platform's brand-blue token; external links a slightly distinct treatment.

---

## Content Lifecycle

Every post follows a lifecycle. *(UX Process p. 19 — content governance plan.)*

### 1. Idea
- Captured in `/_drafts/ideas.md` or a notes app.
- One-line description + hypothesis ("If I write about X, readers will Y because Z" — Wambach format, *10 Pro Tips p. 12*).

### 2. Outline
- 3–7 sub-headings.
- Reader question per heading: "what does the reader walk away knowing?"

### 3. Draft
- `draft: true` in frontmatter.
- Stored in `/_drafts/` (not built).
- Iterate freely.

### 4. Review
- Self-review with the article checklist (see [[16_Checklists]]).
- Optional: ask 2–3 readers for feedback (hallway test, *10 Pro Tips p. 17*).
- Verify all links, code samples, references.

### 5. Publish
- Move to `/posts/`.
- Set `draft: false` and `publishDate`.
- Run accessibility, performance, and SEO checks before merge.
- Build + deploy.

### 6. Promote (light)
- One social post (Bluesky / Mastodon / X) linking the article.
- Optional newsletter inclusion if it fits the next issue.

### 7. Maintain
- Quarterly audit: still accurate? Links alive? Code samples still work?
- Re-publish with `updatedDate` if substantive changes.
- Retire with redirect to a successor article if obsolete.

### 8. Retire
- Never delete. *(Vision rule: URLs are permanent.)*
- Add a banner: "This post is from [date]. The platform/library has changed; see [successor]."
- Or 410 only if content is actively harmful (rare).

---

## Evergreen Content

The platform prioritizes content with multi-year shelf life.

### Characteristics of evergreen
- Principles > frameworks-of-the-moment.
- Patterns > library tutorials.
- Concept explanations > "what's new in version X."
- Personal essays > industry news commentary.

### Frequency targets
- Aim for **60% evergreen, 30% timely, 10% experimental** per year.
- Track per-post type in an annual review.

---

## Tutorial Strategy

Tutorials are the most demanding content type — they must work, demonstrably, for the reader.

### Tutorial requirements
- **Versioned**: list every library version explicitly.
- **Tested**: code samples are run by the author in a clean environment.
- **Linked to a repo**: full working example in a GitHub repo, MIT-licensed.
- **Bounded**: one tutorial = one outcome. Don't combine "set up Astro + add SEO + integrate CMS" into one post.
- **Honest about prerequisites**: state what the reader needs to know going in.

### Tutorial structure
1. **Outcome image / demo** at the top — what will you have at the end?
2. **Prerequisites** — assumed knowledge, tools, accounts.
3. **Step 1...N** with verification at each step.
4. **Troubleshooting** section addressing common failures.
5. **Where to go next** — related deeper topics.

---

## AI Articles

A specific category needing extra care. AI moves fast; AI content rots fast.

### Rules for AI posts
- **Date everything.** Models, libraries, behaviors change weekly.
- **Show the prompt.** Reproducibility matters.
- **Show the failure.** What didn't work is as valuable as what did.
- **No hype.** "This will replace developers!" is a discredited claim. Stay measured.
- **Cite the model + version** explicitly (e.g., "Claude Opus 4.7 as of 2026-06").
- **Acknowledge fragility.** "This worked at time of writing; the model may behave differently now."

---

## Learning Journal (Notes)

Short-form, low-stakes, frequent. The platform's TIL (Today I Learned) stream.

### Notes format
- 100–500 words.
- Single concept.
- Always cite a source (book, article, conversation).
- No editing for polish; rough but accurate beats polished but wrong.
- Published in `/notes/` with date-based slug.

### Why notes matter
- Builds writing habit without book-length pressure.
- Captures fleeting insights before they're forgotten.
- Reveals the *process* of learning — supports the learner-not-knower voice. *(UX Process p. 31.)*

---

## Series Management

Multi-part posts with progression.

### Series rules
- Slug in frontmatter: `series: "astro-deep-dive"`.
- Order in frontmatter: `seriesOrder: 1`.
- Each post in a series links to the series overview page.
- Series page lists all parts in order with completion indicators.
- Series posts can be read out of order; each is self-contained where possible.

### Series structure
- Posts 1–3 minimum to commit to a series.
- Plan all parts before publishing post 1 (avoid abandoned series).
- One series active at a time to avoid scattering attention.

---

## Draft Workflow

> Drafts in public are okay; broken pages are not. *(Vision rule.)*

### Local-draft (default)
- `draft: true` in frontmatter → not built into production.
- Iterate in `/_drafts/` until ready.

### Public-draft (optional)
- Banner: "**Draft in progress** — feedback welcome via [contact link]."
- Useful for technical pieces where reader comments improve accuracy.
- Always dated; always clearly marked.

### Cross-posting
- If publishing elsewhere (e.g., dev.to, hashnode), use the platform as canonical.
- Set `canonical` in frontmatter on copies pointing back here.
- Wait 1+ week before cross-posting to let the canonical index.

---

## Markdown Conventions

Markdown is the platform's authoring format. Strict conventions ensure consistent rendering.

### Headings
- One `h1` per post (auto-rendered from frontmatter title).
- `h2` for major sections; `h3` for subsections; rarely `h4`.
- Never skip levels (`h1 → h3`).
- Anchor IDs auto-generated as slugs of heading text.

### Lists
- Hyphen `-` for bullets (not `*`).
- Sentence case items.
- One sentence per bullet ideally.

### Code
- Triple backticks with language: `` ```ts ``.
- Filename comment on first line: `// path/to/file.ts`.
- Inline code in backticks.

### Tables
- Markdown tables with header row.
- Avoid wide tables; if needed, scroll on narrow viewports.

### Images
- Always alt text. Empty alt only for purely decorative.
- Captions below in italic.
- Width hints via attribute syntax when needed.

### Callouts
- Custom MDX components: `<Note>`, `<Tip>`, `<Warning>`, `<Danger>`.
- Use sparingly — too many callouts dilute attention.

---

## Metadata Standards

Frontmatter is the contract between content and code. Required fields fail the build if missing.

| Field | Required | Type | Notes |
|-------|----------|------|-------|
| `title` | yes | string | ≤70 chars |
| `description` | yes | string | 140–160 chars for SEO |
| `publishDate` | yes | ISO date | Immutable after publish |
| `updatedDate` | no | ISO date | Set on republish |
| `category` | yes | enum | Controlled list |
| `tags` | yes | array | ≤5; from allowlist |
| `heroImage` | yes | path | Optimized at build |
| `heroImageAlt` | yes | string | Non-empty for a11y |
| `draft` | no | boolean | Defaults false |
| `canonical` | no | URL | For cross-posted |
| `series` | no | slug | Optional |
| `seriesOrder` | no | number | Required if series |

---

## Image Selection Checklist

Per *Visual Storytellers p. 46–49* + *Card-Based p. 22*.

For every hero image and inline figure:

- [ ] Does it match persona? *(Visual Storytellers p. 47.)*
- [ ] Do its colors echo the brand palette? Apply duotone overlay if needed. *(Visual Storytellers p. 49.)*
- [ ] Does its style match (sophisticated for sophisticated content)?
- [ ] Is it custom or stock? **Custom strongly preferred.** *(Visual Storytellers p. 49.)*
- [ ] Is it iconic (UI), symbolic (brand), or indexical (mood)? — Match to role.
- [ ] Does it carry meaning, or is it decoration? Decoration fails.
- [ ] Is it distinct from other hero images on the index? *(Visual Storytellers p. 11–12.)*
- [ ] Does the alt text fully describe the image?

---

## Decision Framework

When deciding whether to publish:

1. **Did I learn something writing this?** If no, archive and revisit.
2. **Does it serve a persona?** If not clearly, sharpen the framing.
3. **Does it pass the article checklist?** *(See [[16_Checklists]].)*
4. **Does it match the brand voice?**
5. **Is the code/claims verified?**
6. **Is the hero image meaningful and custom?**
7. **Does the post resolve to one CTA?**
8. **Does the canonical URL match the title slug?**

---

## Rules

1. **One post per category-month minimum** for the active categories (Engineering, Design Systems, AI).
2. **Permanent URLs.** No renames.
3. **Date everything.** Especially AI and framework posts.
4. **No clickbait headlines.** Specific > clever.
5. **Code samples must work** as of publish date.
6. **One canonical URL** for cross-posts.
7. **Alt text required** on all images.
8. **No paywalls, no popups, no interstitials.**
9. **Annual tag audit.** Quarterly post audit.
10. **Always cite sources.**

---

## Common Mistakes

- **"Just shipping" mediocre posts.** Better to publish less and matter more.
- **Tag sprawl.** Free-form tags become a graveyard of one-use labels.
- **Stale tutorials.** A two-year-old tutorial referencing an old API harms readers and the platform's credibility.
- **Hero image stock photos.** "Hands typing on laptop" tells the reader nothing.
- **Mass-deletion of old posts.** URLs are permanent.
- **Skipping the maintenance step.** Content compounds only if it stays correct.

---

## Checklist

Before publishing any post — short form. Full version in [[16_Checklists]].

- [ ] Frontmatter complete and valid
- [ ] Title ≤ 7 words for hero
- [ ] Description 140–160 chars
- [ ] One category, ≤5 tags from allowlist
- [ ] Hero image custom, alt-texted, brand-aligned
- [ ] Headings hierarchical, no skips
- [ ] All code samples tested
- [ ] All links verified
- [ ] One CTA, not three
- [ ] Voice matches brand
- [ ] Reading time computed and shown
- [ ] OG image generated for social sharing
- [ ] Canonical URL set (if cross-posted)

---

## References

- *Getting Started With UX Design Process & Documentation.* UXPin, 2015 — content governance plan, personas, taxonomies.
- *The Visual Storyteller's Guide.* UXPin, 2015 — image selection, custom-vs-stock, 5–7 word headlines.
- *Clever Interactive Techniques for Web Storytelling.* UXPin, 2015 — story length vs need, narrative arc per post.
- *3 Common UX Mistakes Killing Good Design.* UXPin, 2015 — content-first ordering.
- *10 Pro Tips to a Smarter UX Design Process.* UXPin, 2015 — "How Might We" framing, hypothesis format, personas-as-cast.
- *Web UI Trends: The Elegance of Minimalism.* UXPin, 2015 — density curve, one-CTA-per-page.

Complementary modern guidance: *Everybody Writes* (Ann Handley); *The Sense of Style* (Steven Pinker); *Content Strategy for the Web* (Kristina Halvorson).
