## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)

## Article Writing Framework

When writing new articles or editing draft articles, **always** ensure the following rules and principles are satisfied for maximum engagement and audience growth:

### 1. The Content: What Actually Hooks Senior Readers
- **Engineering War Stories**: Document production failures, obscure bugs, and architectural bottlenecks. Real-world pain is high-value content.
- **Trade-off Analysis**: Break down pros and cons. Never present a "perfect" solution (e.g., "React Server Components vs. Client-side Fetching: Performance Trade-offs").
- **Under-the-Hood Mechanics**: Tear apart abstractions (like Virtual DOM or Island architecture) and explain how the compiler or engine processes the code.
- **Opinionated Best Practices**: Take a strong stance backed by data.

### 2. The Structure: Format for Scannability
- **BLUF (Bottom Line Up Front)**: Put the answer, architecture diagram, or core thesis in the first 200 words. Respect their time immediately.
- **Code as Evidence, Not Filler**: Only show the exact 5-10 lines that highlight the core logic or specific fix. Do not paste 100 lines of boilerplate.
- **Visual Architecture**: Use tools like Mermaid.js, Excalidraw, or Figma to draw diagrams. A good system design diagram forces readers to pause and engage.
- **Clear Hierarchy**: Use H2 and H3 tags religiously. The article structure must be scannable in 5 seconds.

### 3. The Voice: Speak to Your Audience
- **Peer-to-Peer Tone**: Write as if explaining a concept to a smart colleague over coffee or in a Slack thread. Professional but not textbook stiff.
- **Assume Competence**: Target developers by skipping basic definitions (like Git). Getting past basics gets to high-value insights faster.
- **Candid Transparency**: If a tool is frustrating, say so. Authenticity builds trust.

### 4. The Growth Engine: Turning Readers into Subscribers
- **Contextual Lead Magnets**: Offer a downloadable cheat sheet, config file, or architecture PDF in exchange for an email.
- **Inline Teasers**: Create anticipation (e.g., "I'll be diving deeper into this specific Astro performance quirk in next week's newsletter").
- **The "Reply" Ask**: Ask a specific question in your newsletters ("What is your biggest UI challenge right now? Hit reply.") to spark conversations and keep emails out of Spam folders.

### 5. Essential Guardrails
- **The Banned Words List**: Never use the following standard LLM filler words: delve, robust, landscape, in conclusion, tapestry, or seamless.
- **The Code Constraint**: Do not generate boilerplate code. If a code snippet is provided in a draft, use it exactly as provided. Do not explain what basic functions (like map or useEffect) do.
- **The Structure Mandate**: Force the use of BLUF (Bottom Line Up Front). Format outputs with clear `##` headings, short paragraphs, and bulleted lists for scannability.
- **The Persona Guardrail**: Act as an editor for a Senior Frontend Engineer. Retain strong opinions, technical nuance, and a professional but conversational tone.
- **Social Media Promotion Asset Generation**: Whenever a new article is drafted or finalized, automatically generate local promotion assets under `.dev/social/<article-slug>/`. This folder must contain `linkedin-post.md` and an `instagram/` sub-folder containing `caption.md`. The `linkedin-post.md` MUST include the canonical article URL `https://devscrolls.dev/articles/<article-slug>/` — NEVER use `.com`. **LinkedIn Post Strategy (Open-Loop Pattern):** The LinkedIn post must NEVER give away the full article content. Instead, follow this structure: 1) **Hook** — open with a bold, uncomfortable personal statement or story that creates emotional engagement (fits above the "see more" fold on mobile), 2) **Tease** — mention the key insights using vague, curiosity-driven bullets (e.g., "The hidden cost nobody talks about" or "The one change that fixed everything") WITHOUT revealing the actual answers, 3) **Link** — place the article URL after the tease so the reader must click to get the payoff, 4) **No hashtag stuffing** — skip hashtags entirely or use 2-3 max. The goal is to sell the click, not replace the article. Do NOT list all article points with explanations. For the Instagram carousel images, you MUST use the `generate_image` tool to create 3-4 typography-driven slides. The image prompts MUST explicitly demand: 1) A scroll icon/logo preceding the brand name "DevScrolls" in the design, 2) Brief, highly readable text summarizing the article's core points across the slides, 3) Engaging text hooks to drive link clicks, and 4) A bright, engaging aesthetic (Off-white/Light gray background, Dark Slate text) with STRICT usage of the brand color `#d97706` (Amber/Orange) for prominent graphical elements, icons, or text highlights. The images MUST NOT be purely black and white. Do not generate generic or abstract placeholders.
- **Draft Pre-Analysis Gatekeeper**: ALL draft articles must be passed through the `evaluate-draft` skill BEFORE the `new-article` pipeline is triggered. The AI must aggressively reject any generic or over-saturated content (e.g. "What is React?") and mandate that the user pivots to a nuanced, senior-level angle with trade-offs or war stories. Do not write or publish an article until the draft earns a "PASS" verdict.
- **Title Length Limit**: Article `title` frontmatter MUST be strictly 70 characters or less (≤ 60 characters preferred for SEO). Always verify character count before setting title.
- **Hero Image WebP & Compression Mandate**: ALWAYS compress and convert generated hero images to `.webp` format (max width 960px, quality 80) using `sharp` before saving to `/public/` and referencing in frontmatter as `heroImage: "/<slug>-hero.webp"`. Never serve raw, uncompressed PNG files (>200KB).
- **LCP & Image Performance Guardrail**: Never apply `loading="lazy"` to LCP (Largest Contentful Paint) images. The hero image of an article page and the first article card thumbnail in feeds must use `loading="eager"` and `fetchpriority="high"`. Always specify explicit `width` and `height` attributes on `<img>` tags to eliminate Cumulative Layout Shift (CLS).

- **Internal Linking Mandate**: Whenever drafting or editing an article, ALWAYS inspect existing published posts in `src/content/articles/` and insert contextual internal markdown links (`[Post Title](/articles/<slug>/)`) to existing blog posts whenever relevant concepts, technologies, or past articles are mentioned.
- **The Emoji Constraint**: NEVER place emojis in section headings (H1, H2, H3, H4) or outline lists. Emojis in headings make content look AI-generated and lower technical credibility. Keep headings clean, text-only, and professional. Emojis may only be used very sparingly in closing lines or social media captions.
- **Job Board Publishing Protocol (`add-job`)**: Whenever the user pastes a job submission email (from Formspree) or asks to "add this job" / "publish job": 1) Parse the company, title, work email, direct apply URL, region, salary, tech stack, and summary. 2) Run anti-fraud checks: Verify the work email domain matches the hiring company (reject @gmail, @yahoo, etc.), and verify the application link is a direct HTTPS link on the company domain or verified ATS (no shorteners). 3) Prepend the structured job object to `src/data/featured-jobs.json` with `"source": "Featured Employer"`. 4) Run `npm run sync:jobs` and `npm run build` so the role is immediately published to `/jobs/`. 5) Confirm back to the user with the role details and live link.

## Job Board Architecture and Long-Term Scalability Roadmap

### Current Architecture (Edge-Static with Strict TTL)
1. **Zero-Database Runtime Queries**: Job listings are served statically from edge CDN cache rather than hitting database APIs on every page view. This preserves Core Web Vitals (sub-50ms LCP) and avoids database connection exhaustion.
2. **30-Day Rolling TTL Pruning**: `scripts/sync-jobs.js` automatically discards scraped jobs older than 30 days (`MAX_JOB_AGE_DAYS = 30`). This prevents dead or ghost links and caps `src/data/jobs.json` to ~250–300 fresh roles (~250KB max). Featured roles expire after 60 days.
3. **Client-Side Batch Windowing (O(1) DOM Footprint)**: `JobBoard.tsx` renders in 25-card batches with a "Load More" trigger, preventing mobile DOM memory bloat and preserving 60fps scroll performance.
4. **Daily Cron Workflow**: `.github/workflows/sync-jobs.yml` runs daily at 06:00 UTC, runs `npm run sync:jobs`, and commits changes to trigger automated Vercel deployment.

### Future Architecture Scaling Triggers (TODO Roadmap)
- **Trigger**: Job volume expands past 1,000+ listings from 10+ feed sources, causing Git repository commit history churn.
- **Migration Plan**:
  1. Move the `jobs.json` storage to a dedicated Supabase table (`jobs`).
  2. The GitHub Action runs `sync-jobs.js` and upserts directly to Supabase (`ON CONFLICT DO UPDATE` + `DELETE WHERE date_posted < NOW() - INTERVAL '30 days'`) instead of committing JSON files to Git.
  3. Keep Astro's static site generation (SSG) model: fetch the active jobs from Supabase at **build time** during `astro build`. Readers still get static Edge CDN speeds, while Git repository history remains completely clean of automated commits.

## AI Optimization & GEO (Generative Engine Optimization) Protocol

Whenever a new article is drafted or published, a new developer tool is built or updated, or the job board undergoes feature or architectural changes, the AI agent **MUST** automatically perform the following maintenance steps:

1. **Update `public/llms.txt`**:
   - Keep the concise manifest synchronized.
   - For new articles: add the title, canonical link (`https://devscrolls.dev/articles/<slug>/`), and a 1-sentence high-signal description.
   - For new/updated tools: verify the tool name, canonical link (`https://devscrolls.dev/tools/<slug>/`), and zero-egress/privacy guarantees are accurate.
   - For job board: ensure the 30-day TTL, direct apply, and supported regions/stacks are accurately described.

2. **Update `public/llms-full.txt`**:
   - Update the machine-readable deep-context file with the technical specifications, problem-solution pairs, regexes/algorithms, and architectural trade-offs so LLMs (ChatGPT Search, Claude, Perplexity, Cursor, Gemini) can cite DevScrolls accurately.

3. **Verify AI Crawler Directives in `public/robots.txt`**:
   - Ensure all major AI search bots (`GPTBot`, `OAI-SearchBot`, `ChatGPT-User`, `ClaudeBot`, `PerplexityBot`, `Google-Extended`, `Googleother`, `Applebot-Extended`, `cohere-ai`) are explicitly allowed.
   - Ensure directives for `Sitemap`, `llms-txt`, and `llms-full-txt` are present.

4. **Verify Semantic `<head>` Discovery**:
   - Ensure all layout templates include `<link rel="alternate" type="text/plain" href="/llms.txt" title="LLMs.txt" />` and `<link rel="alternate" type="text/plain" href="/llms-full.txt" title="LLMs-full.txt" />`.

5. **Contextual Cross-Linking**:
   - Link new articles to relevant developer tools (`/tools/pii-scrubber/`, `/tools/jwt-debugger/`, `/tools/json-formatter/`, `/tools/daily-scroll/`) and the job board (`/jobs/`) whenever relevant topics (security, tokens, logs, remote work, daily workflow) arise.

## Admin Analytics Portal

- **Production URL**: `https://www.devscrolls.dev/admin/analytics` (or `https://devscrolls.dev/admin/analytics`)
- **Local Dev URL**: `http://localhost:4321/admin/analytics`
- **Authentication**: Protected via Google OAuth with Supabase Auth and restricted by the `PUBLIC_ADMIN_EMAIL` allowlist env var.
- **Reference Doc**: See detailed guide in `.dev/ADMIN.md`.

