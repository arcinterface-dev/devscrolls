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
- **Social Media Promotion Asset Generation**: Whenever a new article is drafted or finalized, automatically generate local promotion assets under `.dev/social/<article-slug>/`. This folder must contain `linkedin-post.md` (engaging, scannable post text including the article URL) and an `instagram/` sub-folder containing `caption.md`. For the Instagram carousel images, you MUST use the `generate_image` tool to create 3-4 typography-driven slides. The image prompts MUST explicitly demand: 1) A scroll icon/logo preceding the brand name "DevScrolls" in the design, 2) Brief, highly readable text summarizing the article's core points across the slides, 3) Engaging text hooks to drive link clicks, and 4) A bright, engaging aesthetic (Off-white/Light gray background, Dark Slate text) with STRICT usage of the brand color `#d97706` (Amber/Orange) for prominent graphical elements, icons, or text highlights. The images MUST NOT be purely black and white. Do not generate generic or abstract placeholders.
- **Draft Pre-Analysis Gatekeeper**: ALL draft articles must be passed through the `evaluate-draft` skill BEFORE the `new-article` pipeline is triggered. The AI must aggressively reject any generic or over-saturated content (e.g. "What is React?") and mandate that the user pivots to a nuanced, senior-level angle with trade-offs or war stories. Do not write or publish an article until the draft earns a "PASS" verdict.
- **Hero Image Mandate**: ALWAYS generate and add a proper, meaningful, and appropriate hero image for every article. Do not use generic placeholders. The image must visually represent the core engineering concept or architecture discussed in the article.
