---
name: write-in-my-voice
description: >
  Invoke when the user wants to write a new blog article that matches their
  personal writing style, tone, and grammar patterns. Reads writing samples
  from .dev/writing-samples/ to learn the author's voice before generating
  content. Can work from a rough draft in .dev/drafts/ or from a topic prompt.
inputs:
  - topic: The subject of the article
  - draft_path: (Optional) Path to a rough draft file in .dev/drafts/
  - category: One of the controlled category list (frontend, backend, ai, architecture, tutorials)
  - tags: Up to 5 tags from the allowlist
---

# Write In My Voice — Style-Matched Article Generation

## Purpose

This skill ensures every article the agent writes **sounds like Santhanakrishnan wrote it**, not like AI-generated content. It does this by first analyzing real writing samples, extracting voice patterns, and then applying those patterns to new content.

## Knowledge Base Files to Consult

1. `.dev/writing-samples/VOICE_PROFILE.md` — **MUST READ FIRST**. This is the compiled voice profile with tone, sentence patterns, vocabulary fingerprint, grammar quirks, and anti-patterns. This is the single source of truth.
2. `.dev/writing-samples/` — Read individual `.md` sample articles if you need more context or to refresh the voice during writing.
3. `knowledge-base/06_Content_Strategy.md` — article structure, voice, frontmatter schema
4. `knowledge-base/12_Branding_Guide.md` — brand voice ("thoughtful builder")

## Steps

### 1. Analyze Writing Samples (MANDATORY FIRST STEP)

Before writing anything, read every file in `.dev/writing-samples/`. Extract and internalize:

#### Tone & Personality
- How formal or casual is the writing? (e.g. "Let's dive in" vs "We will explore")
- Does the author use humor? Analogies? Rhetorical questions?
- How does the author start articles? (anecdote, question, bold statement, context?)
- How does the author end articles? (summary, call-to-action, open question?)

#### Sentence Structure
- Average sentence length (short and punchy vs long and flowing)
- Use of fragments or one-liners for emphasis
- Paragraph length patterns
- Transition phrases between sections (e.g. "Here's the thing", "Now", "So")

#### Vocabulary & Grammar
- Contractions used or avoided? (e.g. "don't" vs "do not")
- First person ("I") vs second person ("you") vs third person frequency
- Technical jargon level — does the author explain terms or assume knowledge?
- Specific words or phrases the author repeats often
- British vs American English spelling patterns

#### Structure Preferences
- How are headings written? (question-style, statement-style, imperative)
- Use of lists vs prose for explanations
- Code-to-text ratio
- How code snippets are introduced and explained
- Use of bold/italic for emphasis patterns

### 2. Build a Voice Profile

After reading the samples, mentally compile a **Voice Profile** with these attributes:
- **Formality level**: 1 (very casual) to 5 (very formal)
- **Sentence cadence**: short-punchy / mixed / long-flowing
- **Favorite transitions**: list the top 5 transition phrases found
- **Opening style**: how articles typically begin
- **Closing style**: how articles typically end
- **Explanation approach**: top-down (concept first, details later) or bottom-up (examples first, then generalize)
- **Code introduction pattern**: how code blocks are set up
- **Unique quirks**: any distinctive style elements

### 3. Check for a Draft

If the user provided a draft file path (in `.dev/drafts/`):
- Read the draft thoroughly
- Identify the core ideas, structure, and any specific points the author wants to make
- Preserve any specific phrasing, examples, or code that the author included
- Expand and polish while maintaining the author's original intent

If no draft is provided:
- Work from the topic prompt
- Generate the article from scratch using the voice profile

### 4. Write the Article

Generate the full article following these rules:

1. **Match the voice profile exactly** — this is the #1 priority
2. Follow the `new-article` skill for frontmatter schema and structure
3. Use the author's actual sentence rhythms, not generic AI patterns
4. Mirror the author's heading style from the samples
5. Use the same level of technical depth as the samples
6. Match paragraph length patterns from the samples
7. Use the author's transition phrases, not generic ones
8. If the author uses analogies in samples, use analogies. If not, don't.

#### Anti-Patterns to Avoid
- ❌ Do NOT use generic AI phrases: "In this article, we will explore..."
- ❌ Do NOT use "Let's dive in" unless the author actually uses it
- ❌ Do NOT add exclamation marks in body text
- ❌ Do NOT use "obviously", "simply", "just", "easily"
- ❌ Do NOT use a different level of formality than the samples show
- ❌ Do NOT use filler transitions like "Furthermore", "Moreover", "Additionally" unless the author does
- ❌ Do NOT start every paragraph the same way
- ❌ Do NOT use placeholder phrases like "as we can see" or "it's worth noting"

### 5. Self-Review Against Samples

After generating, re-read 2-3 of the writing samples and compare:
- Does the generated article **feel** like the same person wrote it?
- Are the sentence lengths similar?
- Are the transitions natural to the author's style?
- Is the technical depth consistent?
- Would a reader familiar with the author's blog notice a difference?

If any of these fail, revise before outputting.

### 6. Run Standard Checks

After voice-matching is confirmed, run the standard checks from the `new-article` skill:
- Frontmatter validation
- SEO metadata
- Code block formatting
- Image selection
- Pre-publish checklist

## Usage Examples

### Write from a topic
```
@[.dev/writing-samples] Write a new article about React Server Components
```

### Write from a draft
```
@[.dev/writing-samples] @[.dev/drafts/rsc-thoughts.md] Expand this draft into a full article in my voice
```

### Write with specific category
```
@[.dev/writing-samples] Write a tutorial about TypeScript generics for the "tutorials" category
```

## Output

- A polished markdown file in `src/content/writing/` with complete frontmatter
- Voice-matched to the author's writing samples
- Ready for review before setting `draft: false`
