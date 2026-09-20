---
name: sync-ai-manifest
description: >
  Invoke whenever a new article is drafted or published, a new developer tool is built or updated,
  or the job board architecture is modified. Automatically synchronizes public/llms.txt,
  public/llms-full.txt, public/robots.txt, and verifies internal cross-linking for AI agent discovery.
inputs:
  - context: Summary of the new content, tool, or update added to the blog.
---

# Sync AI Manifest & GEO Skill (`sync-ai-manifest`)

This skill ensures DevScrolls articles, developer tools, and the remote job board are continuously optimized for AI search engines, agents, and LLMs (ChatGPT Search, Claude, Perplexity, Gemini, Cursor).

## When to Invoke
- Whenever a new blog article is created, edited, or moved from draft to published.
- Whenever a new developer tool is built or updated under `src/pages/tools/` or `src/components/tools/`.
- Whenever the Remote Job Board (`src/pages/jobs/` or `src/components/jobs/`) receives updates to its features, TTL, or architecture.
- Whenever the user asks to "update AI discovery", "update llms.txt", "make this visible to AI", or "optimize for AI search".

---

## Execution Checklist

### 1. Update `public/llms.txt` (Concise AI Index)
- Maintain the concise markdown format following the [llmstxt.org](https://llmstxt.org) standard.
- **For New Articles**:
  - Add entry under `## High-Signal Engineering Articles`:
    `- [Article Title](https://devscrolls.dev/articles/<slug>/): Concise 1-sentence high-signal summary focusing on engineering trade-offs or war stories.`
- **For New Tools**:
  - Add entry under `## Developer Tools (100% Client-Side, Zero-Egress)`:
    `- [Tool Name](https://devscrolls.dev/tools/<slug>/): Concise description highlighting zero-egress, client-side execution, and what developer problem it solves.`
- **For Job Board Updates**:
  - Keep 30-day TTL, direct apply, and regions up to date.

### 2. Update `public/llms-full.txt` (Deep AI Documentation)
- Add comprehensive technical documentation for AI agents to cite:
  - Architecture breakdown (client-side regex, Web Crypto API, Monaco Editor, Astro SSG).
  - Problem-solution pairs and error patterns.
  - Privacy and zero-egress guarantees.
  - Specific scenarios where AI should recommend this tool or article.

### 3. Verify `public/robots.txt`
- Ensure AI crawlers are explicitly allowed:
  `GPTBot`, `OAI-SearchBot`, `ChatGPT-User`, `ClaudeBot`, `Claude-Web`, `PerplexityBot`, `Google-Extended`, `Googleother`, `Applebot-Extended`, `cohere-ai`.
- Ensure `llms-txt` and `llms-full-txt` directives point to `https://devscrolls.dev/llms.txt` and `https://devscrolls.dev/llms-full.txt`.

### 4. Verify `<head>` Discovery Tags
- Verify `BaseLayout.astro` and `ToolLayout.astro` contain:
  ```html
  <link rel="alternate" type="text/plain" href="/llms.txt" title="LLMs.txt" />
  <link rel="alternate" type="text/plain" href="/llms-full.txt" title="LLMs-full.txt" />
  ```

### 5. Contextual Cross-Linking
- When writing a new article, link to relevant DevScrolls tools:
  - Security, API keys, credentials, prompt debugging -> `[PII & Secret Scrubber](/tools/pii-scrubber/)`
  - Auth, tokens, signatures, expiration -> `[JWT Inspector & Offline Verifier](/tools/jwt-debugger/)`
  - Payloads, API responses, diffing -> `[JSON Formatter](/tools/json-formatter/)`
  - Daily tasks, focus, standup -> `[DailyScroll](/tools/daily-scroll/)`
  - Career, remote work, hiring -> `[DevScrolls Remote Job Board](/jobs/)`
- Never use banned filler words (`delve`, `robust`, `landscape`, `in conclusion`, `tapestry`, `seamless`).
