# Writing Samples (Dev Reference Only)

This directory is **gitignored** and exists only on your local machine.

## Purpose
These are your previously written blog posts that serve as **voice & tone reference material** for the AI writing assistant. The agent reads these samples to learn your unique writing style before generating new content.

## What to put here
- Copy-paste your old blog posts as `.md` files
- Name them descriptively, e.g. `react-hooks-deep-dive.md`, `my-typescript-journey.md`
- No frontmatter needed — just the raw article content
- The more samples you add, the better the voice matching will be

## How to use
When asking the agent to write a new article, reference this directory:

```
@[.dev/writing-samples] Write a new article about [topic] in my voice
```

Or reference a specific sample:

```
@[.dev/writing-samples/react-hooks-deep-dive.md] Write a new article about React Server Components using my writing style from this sample
```

## Draft workflow
1. Create a rough draft in `.dev/drafts/` (e.g. `.dev/drafts/my-rough-idea.md`)
2. Ask the agent:
   ```
   @[.dev/writing-samples] @[.dev/drafts/my-rough-idea.md] Expand this draft into a full article in my voice
   ```
3. The agent will read your voice samples + your draft and produce a polished article in `src/content/writing/`
