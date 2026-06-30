# 01 — Project Vision

> The "why" that all other documentation interprets. Read this before changing anything else.

**Related:** [[02_Design_Principles]] · [[06_Content_Strategy]] · [[12_Branding_Guide]] · [[13_Future_Scalability]] · [[14_AI_Context]]

---

## Purpose

Document the long-term vision, audience, philosophy, and roadmap of the platform so that any future contributor — human or AI — can pick up cold and continue without drifting from intent.

> "Preliminary research is the most easily neglected UX stage, even though it is one of the most important." *(UX Process p. 10.)*

---

## Long-Term Vision

The platform is a **personal technical reading and exhibition platform** that grows with its owner over 5–10 years.

It begins as a static blog. Over time, it accumulates:
- A blog of technical writing
- A portfolio of engineering and design work
- A learning journal of in-progress study
- Web tools and AI experiments
- Open-source documentation
- Case studies and talks
- Notes and references
- A playground for experimentation

The platform is **not a product**. It is a *practice* — the digital equivalent of a craftsperson's workshop. Visitors see the work, the process, the unfinished pieces, and the polished outputs all in one place.

---

## Why This Platform Exists

Three reasons, in order of priority:

### 1. To compound knowledge over years

> "Think of yourself as a learner, not a knower." *(UX Process p. 31.)*

The platform is a long-running externalization of learning. Articles, notes, projects, and experiments accumulate. Future-self benefits from past-self's writing. Visitors benefit from public learning.

The platform's value compounds when content is searchable, well-tagged, well-structured, and persistent. **URLs do not break.** **Posts do not disappear.** **The archive is a feature.**

### 2. To establish technical credibility

> "Visual design must signal what the platform is for." *(Color Theory p. 11 — dark blue for professionalism and reliability.)*

The platform's audience is partly professional: prospective employers, collaborators, peers, and clients. The visual identity, writing voice, and project depth all signal "rigorous, considered engineer who ships." Polish matters because it is read as a competence proxy.

### 3. To serve as a personal experimentation lab

The platform itself is a project. Building it, evolving it, and writing about it is part of the value. New ideas (Astro patterns, AI integrations, web tools) often debut here before they are written up.

---

## Core Principles

The platform's design and content reflect these in everything:

1. **Content-first.** The reader's experience of articles, projects, and notes is paramount. Chrome serves content. *(See [[02_Design_Principles]] Principle 1.)*
2. **Performance-as-respect.** Fast pages, lightweight assets, no tracking. Speed is a form of respect for the reader's time. *(See [[11_Performance_Guide]].)*
3. **Accessibility as default.** Keyboard-navigable, screen-reader-friendly, WCAG AA at minimum. *(See [[10_Accessibility_Standards]].)*
4. **Open by default.** Code is open-source where possible. Drafts in public when valuable. Notes can be linked, even when rough.
5. **Static over dynamic.** Minimal backend. Static site generation. The site survives without servers running. *(See [[13_Future_Scalability]].)*
6. **Long-term thinking.** Decisions reflect 5–10 year horizons. URLs are permanent. Architecture is portable. *(See [[15_Decision_Log_Template]].)*
7. **Learner mindset.** Posts say "I learned this" or "I am learning this," not "I have mastered this." *(UX Process p. 31.)*
8. **Honest scope.** Don't build for users who don't exist. Don't optimize for traffic that doesn't matter. *(10 Pro Tips p. 8.)*

---

## Product Philosophy

The platform is **not** a:
- SaaS product seeking conversions
- Newsletter-first publication with paywalls
- Social network with engagement metrics
- A/B-tested funnel optimized for clicks

The platform **is** a:
- Library of writing
- Portfolio of work
- Workshop in public
- Personal brand surface

This philosophical positioning informs every design tradeoff: when in doubt, choose the option that better serves a reader who is here to **read and learn**, not the option that better serves a marketer who is here to **convert and retain.**

---

## Target Audience

Three personas inform every decision. *(UX Process p. 13 — personas as foundation.)*

### Persona 1: The Engineer-Reader

> "Sam, 28, Senior Frontend Engineer. Reads on a 14" laptop at night or on phone during commute. Skims first, then deep-reads if it's worth it. Wants code that compiles, diagrams that explain, links that work."

- Behaviors: skims with the F-pattern; pastes code into editor; tabs back and forth with terminal.
- Goals: solve a specific problem; learn a new pattern; bookmark for later.
- Frustrations: paywalls, popups, "subscribe to keep reading," generic stock imagery, autoplay video.

### Persona 2: The Recruiter / Hiring Manager

> "Priya, 35, Engineering Manager. Visits from LinkedIn or a referral. Has 3 minutes to evaluate whether to read further. Wants to see real work, real writing, real depth."

- Behaviors: scans portfolio thumbnails; reads About; opens 1-2 case studies in new tabs.
- Goals: assess seriousness, technical depth, communication ability.
- Frustrations: vague claims, no case studies, broken project links, missing context.

### Persona 3: The Search Arrival

> "Alex, 24, Junior Developer. Googled a specific error or pattern. Lands on a deep article. Will leave in 10 seconds or stay 10 minutes."

- Behaviors: arrives mid-article; needs orientation; needs a clear next step.
- Goals: solve their immediate problem; subscribe if the writing impresses; share if it helps.
- Frustrations: missing TOC, no breadcrumbs, "this site requires JavaScript," 8MB hero image.

Every page must serve all three. The "Lost Traveler" UX rule — every page is potentially a landing page — exists because of Persona 3. *(3 UX Mistakes p. 17; see [[05_UX_Guidelines]].)*

---

## Long-Term Roadmap

Not a commitment — a horizon. *(See [[13_Future_Scalability]] for architectural implications.)*

### Year 0 — Foundation
- Static Astro + Markdown blog
- Core templates: home, writing index, article, about, contact
- Color, typography, component primitives shipped
- Self-hosted fonts, static images
- Deployed on Vercel or Netlify with custom domain
- RSS feed + sitemap + structured data

### Year 1 — Authority
- Portfolio with case studies
- Series support (multi-part posts with progression)
- Tag and category pages
- Newsletter integration (email-only signup; no account)
- Search (client-side index, e.g., Pagefind or FlexSearch)
- Reading-progress + estimated reading time
- Dark mode polished and tested

### Year 2 — Experimentation
- Web tools (small standalone utilities, each its own page)
- AI experiments (prompts shared, outputs documented)
- Notes section (TIL-style short-form)
- Talks / appearances page
- Open-source projects gallery (auto-pulled from GitHub)

### Year 3 — Depth
- Long-form documentation site (e.g., for an OSS library)
- Interactive playgrounds embedded in posts
- Personalization (reader stack preference, recommended posts)
- Community: comments via lightweight identity (no backend dependency)

### Year 4+ — Scale
- API endpoints for tools (only if there's a real reason)
- Live data cards (now playing / now building / now writing)
- Multiple authors (if collaboration emerges)
- Mobile-app PWA shell

> **The Year 0 commitment is to make every later year possible without rebuilding from scratch.** That is the architectural promise. *(See [[13_Future_Scalability]].)*

---

## Personal Branding Direction

The brand voice is **"the thoughtful builder."**

| Trait | Expression |
|-------|-----------|
| Rigorous | Sources cited, claims tested, code shown |
| Calm | No clickbait headlines, no exclamation marks |
| Curious | Always learning, always linking outward |
| Honest | "I don't know yet" appears regularly |
| Approachable | First person, plain language, no jargon shows-off |
| Crafted | Type, spacing, color reflect care |

### What the brand is NOT
- Hype-driven ("This will change everything!")
- Authority-claiming ("As an expert...")
- Engagement-farming ("Like and share!")
- Sales-oriented ("Buy my course!")
- Trend-chasing (rewriting after every framework hype cycle)

See [[12_Branding_Guide]] for voice, visual identity, illustration, and persona details.

---

## Future Evolution

The vision must survive its own predictions. These are *guides*, not contracts:

- **Content forms may change.** Long essays might become videos. Notes might become threads. Tools might supersede posts. The platform adapts to what the work needs.
- **Audience may shift.** Today's "junior dev who searched an error" may be different in 5 years. Re-audit personas annually.
- **Technology may change.** Astro might be superseded. Markdown might evolve. The platform's *content* is more durable than its *implementation*. Keep them separable. *(See [[13_Future_Scalability]].)*
- **The platform may inspire spinoffs.** A successful section (e.g., AI experiments) might justify its own site. The mother platform stays open and welcoming.

What does **not** change:
- The reader-first commitment.
- The performance-as-respect commitment.
- The accessibility floor.
- The static-first architecture.
- The learner voice.

---

## Decision Framework

When choosing whether to add a feature or change direction, ask in order:

1. **Does it serve at least one of the three personas?** *(UX Process p. 13.)*
2. **Does it serve them better than the current alternative?** *(3 UX Mistakes p. 8 — usability testing required.)*
3. **Does it preserve the core principles?** Performance, accessibility, static-first, content-first.
4. **Does it lock the platform into a vendor or stack?** If yes, what's the exit cost? *(Future Scalability.)*
5. **Does it generate compounding value over years, or one-time engagement?**
6. **Could the decision be reversed easily?** *(See [[15_Decision_Log_Template]] — favor reversible decisions when uncertain.)*

---

## Rules

1. **URLs are permanent.** Once published, a URL never changes. Redirect or 410 only with logged justification.
2. **Drafts in public are okay; broken pages are not.** Mark drafts with a banner; never ship broken.
3. **No tracking by default.** No Google Analytics, no Facebook Pixel, no engagement heat-maps. Privacy-respecting metrics (Plausible, Umami) only if needed.
4. **No paywalls. No popups. No interstitials.**
5. **Performance budget is part of the vision** — see [[11_Performance_Guide]] for numbers.
6. **Accessibility is non-negotiable** — see [[10_Accessibility_Standards]].
7. **One brand voice across writing, code comments, UI text, and error messages.**
8. **Every major decision logged** in [[15_Decision_Log_Template]].

---

## Examples

### Good — adding a "now" page

> "Now" pages (now.nownownow.com inspiration) summarize what the owner is currently working on. Updates monthly. → Serves Persona 2 (recruiter wanting to see recent activity), preserves static-first (markdown file), low maintenance. **Approved.**

### Bad — adding a paywall for "premium" articles

> Conflict with Principles 1, 4, and the "what the brand is NOT" list. Violates the reader-first commitment. **Reject** unless the platform pivots entirely, which would require revising this document.

### Bad — chasing engagement metrics

> Adding social-share counters, view counts, "trending" widgets. → Pulls focus from content, requires backend, locks into vendor analytics. **Reject** unless the data genuinely informs the owner's editorial decisions (in which case, server-side only, never displayed to readers).

---

## Common Mistakes

- **Designing for "everybody."** *(10 Pro Tips p. 8.)* Pick the three personas, optimize for them.
- **Optimizing for metrics that don't matter.** Page views, time on site, bounce rate — none of these tell you whether a reader learned something.
- **Building features before content.** A tag system with no posts is dead weight. *(3 UX Mistakes p. 10–12.)*
- **Copying another platform's vision.** Substack, Medium, Hugo, Ghost are different products with different commitments. Borrow ideas, not visions.
- **Treating the platform as static (in design intent, not just tech).** It will evolve. Build for evolution. *(See [[13_Future_Scalability]].)*

---

## Checklist (Quarterly Vision Audit)

Run this once a quarter:

- [ ] Do the three personas still match real visitors? Re-read analytics signals (if any).
- [ ] Has the platform drifted from any core principle? Identify and correct.
- [ ] Is there a feature shipped that no persona uses? Consider sunset.
- [ ] Is there a frequently-requested change that the vision blocks? Log + decide whether to evolve the vision.
- [ ] Are URLs still permanent? Spot-check year-old posts.
- [ ] Is the performance budget still met?
- [ ] Is accessibility still WCAG AA across templates?
- [ ] Has the voice stayed consistent across recent posts?

---

## References

- *Getting Started With UX Design Process & Documentation.* UXPin, 2015 — personas, learner mindset, preliminary research importance.
- *10 Pro Tips to a Smarter UX Design Process.* UXPin, 2015 — define problem before solution, specific users, hypothesis framing.
- *3 Common UX Mistakes Killing Good Design.* UXPin, 2015 — content-first, user requirements steer.
- *Web UI Trends: The Elegance of Minimalism.* UXPin, 2015 — content as philosophy.

Complementary modern guidance:
- Derek Sivers, "Now Page" concept.
- "Designing for the Web" (Mark Boulton) on long-term content strategy.
- Jeremy Keith on URL durability ("Cool URIs don't change," Tim Berners-Lee).
