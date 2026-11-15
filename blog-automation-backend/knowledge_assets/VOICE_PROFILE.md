# Santhanakrishnan — Writing Voice Profile

> Compiled from 7 writing samples on 2026-07-01.  
> This file is the single source of truth for voice-matching when generating new articles.

---

## 1. Tone & Personality

| Attribute | Observation |
|-----------|-------------|
| **Formality** | 3/5 — Semi-casual. Professional enough for a tech blog but reads like a friendly senior dev talking to a junior. Never stiff or academic. |
| **Warmth** | High. Frequently addresses the reader directly ("If you are new…", "this article is for you"). Makes the reader feel included. |
| **Humor** | Light and organic. Uses occasional emojis (especially in newer articles like the Ollama one). Drops conversational asides like "Interesting right?", "Ahaa! that's what am taking about…", "Trust me!" |
| **Confidence** | Confident but never condescending. Shares personal experience openly ("I've been using Ollama…", "It's me from the experience 😉"). Doesn't use "obviously" or "simply". |
| **Teaching style** | Patient, step-by-step. Assumes the reader is learning. Explains *why* before *how*. |

---

## 2. Opening Patterns

Santhanakrishnan almost always opens with one of two patterns:

### Pattern A: "If you are X, this article is for you" (most common)
> "If you are new to web design/development or you are an intermediate level who wants to become a master in CSS then this article is for you."  
> "Whether you are new to frontend development or simply beginning your career on the frontend then this article is for you."

### Pattern B: Context + personal hook
> "Running AI models locally has never been easier, thanks to tools like Ollama. I've been using Ollama to work on my Python and Java projects…"  
> "Today In this article is all about how to Create HTML Elements Dynamically…"

**Key trait**: Never uses generic AI openings like "In this article, we will explore…". The opening always establishes *who this is for* or *what personal experience sparked the article*.

---

## 3. Closing Patterns

- Uses "Conclusion" as a heading (not "Where this leaves us" — note: this contradicts the knowledge-base brand voice, but we match the *author's actual style*)
- Final paragraphs summarize key takeaways in 1-2 sentences
- Sometimes ends with a call to action or an encouraging nudge:
  > "Install Ollama today and unlock the potential of local AI!"
  > "Here you can find how to contribute open source projects."
- Newer articles use emojis in closings

---

## 4. Sentence Structure

| Attribute | Pattern |
|-----------|---------|
| **Average length** | Medium (15-25 words). Mixes short declarative sentences with longer explanatory ones. |
| **Fragments** | Occasional for emphasis: "Interesting right?", "Trust me!" |
| **Paragraph length** | Short to medium. Typically 1-3 sentences per paragraph. Rarely writes 4+ sentence paragraphs. |
| **Lists** | Heavily uses numbered and bulleted lists for structured content. Prefers numbered lists for sequential/ranked items. |

---

## 5. Vocabulary & Grammar Fingerprint

### Contractions
- Mixed usage. Uses "don't", "can't", "it's", "you're", "doesn't" naturally
- Sometimes avoids contractions in more formal sentences: "It is one of the best ideas…"

### Pronoun usage
- Heavy second-person ("you", "your") — speaks directly to the reader
- First-person ("I") used for personal experiences and recommendations: "I recommend…", "I've been using…"
- Sometimes uses "we" to include the reader: "we have to…", "we don't want…"

### Characteristic phrases (high frequency)
- **"If you are [X] then this article is for you"** — signature opening
- **"which is nothing but"** — used to demystify jargon (e.g. "the listener handleClick which is nothing but a function name")
- **"In other words"** — used to restate complex ideas simply
- **"For example:"** — always followed by a colon, then a new line with a code block or example
- **"Let's see"** — used to introduce examples ("Let's see this below example:", "Let's see How to…")
- **"In some cases"** / **"In that case"** — used to set up scenarios
- **"you can able to"** — characteristic grammatical pattern (uses "can able to" instead of "can")
- **"it will help you"** / **"it helps you to"** — frequently frames benefits
- **"which could save"** / **"which helps"** — uses relative clauses to explain benefits inline
- **"Things you can learn by…"** — used in list introductions
- **"Here are some / Here few"** — introduces recommendation lists
- **"Once you are good at"** — marks progression to next level

### Grammar quirks (PRESERVE these — they are part of the voice)
- Occasional comma splices: "The layout is the heart of a website, It helps us to place things where we wanted."
- "you can able to" instead of "you can" or "you are able to"
- Capitalizes after commas occasionally: "If you the Header & Footer height and it will always be static"
- Slight article drops in informal contexts: "Here few project ideas…"
- Uses "which" more loosely than strict grammar would allow
- "eg:" format for examples (not "e.g.,")

### Words/phrases to AVOID (never found in samples)
- "Furthermore", "Moreover", "Additionally", "Hence"
- "It's worth noting", "As we can see"
- "Let's dive in" (only found once, in the clone websites article: "Let's dive into some larger web applications")
- "Obviously", "Simply", "Just", "Easily"
- "In conclusion" with elaborate summaries (keeps conclusions tight)

---

## 6. Heading Style

- **H1**: Full descriptive title, often "How to…" format
- **H2**: Short, direct. Often numbered ("1. Layouts", "2. Positioning Elements", "3. Media Queries")
- **H3**: Used sparingly, for sub-sections within H2s
- **Heading format**: Statement or label style, NOT question style. Examples:
  - ✅ "Creating HTML Element with JavaScript"
  - ✅ "The recommended way to create an HTML element"
  - ✅ "Benefits of Event Delegation"
  - ❌ "What Are the Benefits of Event Delegation?"
- Often includes an "Overview" or "Outline" section after the intro listing all H2 headings

---

## 7. Code Block Patterns

- Introduces code with a sentence ending in colon: "For example:"
- After a code block, explains what the code does in plain English
- Uses `//` comments inside code to explain key lines
- Code samples are minimal — just enough to illustrate the concept, never over-engineered
- Prefers vanilla JavaScript (no framework-specific code in tutorials)
- References CodePen embeds for live examples: "See the Codepen example here for your better understanding with some styling."

---

## 8. Structure Preferences

### Typical article anatomy
1. **Title** (H1) — "How to…" or descriptive statement
2. **Opening hook** — 1-2 sentences establishing who this is for
3. **Overview/Outline** — bulleted or numbered list of what the article covers
4. **Numbered sections** (H2) — each covering one concept
5. **Within each section**: Explanation → Code example → Explanation of code
6. **Conclusion** — 1-2 paragraph summary + encouragement or CTA

### Content type preferences
- Prefers tutorial/how-to format over opinion pieces
- Uses numbered lists extensively (especially for "N things" articles)
- Includes difficulty levels for projects ("Difficulty Level: Easy/Medium/Hard")
- Links to external resources generously (CSS Tricks, MDN, CodePen)
- Recommends free learning resources

---

## 9. Emoji Usage

- **Headings & Outlines**: Zero emojis. Emojis in H1, H2, H3 headings or outline lists scream AI-generated content and destroy technical credibility.
- **Body & Closings**: Emojis may be used very sparingly (1 in conclusion/CTA or social media posts).
- **Rule**: Keep technical headings text-only, clean, and professional.

---

## 10. Analogies & Metaphors

Uses analogies to make abstract concepts concrete. These are simple and relatable:
- "The layout is the heart of a website"
- "HTML, CSS & Javascript are like an Ocean and Frameworks are like Ships that help you sail easily"
- "Scrolling this page makes you feel like a journey from start to end"

**Pattern**: Analogies appear 1-2 times per article, usually to make a philosophical or strategic point (not inside code explanations).

---

## 11. Article Type Distribution

| Type | Count | Notes |
|------|-------|-------|
| Tutorial / How-to | 4 | Step-by-step with code. Core strength. |
| Listicle / Guide | 2 | "5 websites to clone", "Best way to learn CSS" |
| Quick tip | 1 | "Make div fill empty space" — short, solution-focused |

The author's strongest format is the **tutorial with numbered steps and code samples**. This should be the default format for generated articles unless specified otherwise.

---

## 12. Summary: Voice in One Paragraph

Santhanakrishnan writes like a **friendly senior developer mentoring a junior teammate over coffee**. The tone is warm, encouraging, and patient. Articles are structured as numbered step-by-step guides with clear headings, minimal but effective code samples, and CodePen references for hands-on practice. He speaks directly to the reader ("If you are new to X, this article is for you"), demystifies jargon with plain-English explanations ("which is nothing but…"), and shares personal experience to build credibility ("I've been using…", "It's me from the experience"). Grammar is naturally imperfect — comma splices, occasional article drops, "you can able to" — and this is part of the authentic voice that should be preserved, not corrected. The writing prioritizes clarity and accessibility over sophistication.

---

## 13. LinkedIn & Short-Form Post Profile: The Staccato Problem-Reframe

> Added 2026-09-26 from author's benchmark post on resume turnaround.  
> Governed by workspace rule `.agents/rules/post-tone-and-voice.md`.

### Benchmark Post Reference:
```text
I wasn’t getting shortlisted.
No replies.
No interviews.
Just silence.

At first, I thought it was my skills.
But the real problem?
My resume.

I started researching, testing, and tweaking it. 
Here are the 7 changes that made the biggest difference:

Used the CAR method — Challenge → Action → Result
Added numbers & measurable impact
Focused on outcomes, not responsibilities
Clearly explained project impact
Kept contact details clean & ATS-friendly
Added Hackathons & Open Source
Kept it one page & easy to scan

Your skills might not be the problem.
Your resume might just be hiding them.

Save this before your next application.
```

### Key Mechanical Takeaways:
1. **The Staccato Hook**: 1 opening statement + 3 ultra-short fragments ("No replies. / No interviews. / Just silence.") build immediate emotional resonance and tension.
2. **The Misattribution Pivot**: Relieves impostor syndrome by moving blame from intrinsic capability ("skills") to extrinsic packaging ("resume").
3. **The Empirical Lab Setup**: "Started researching, testing, and tweaking it" — establishes practical testing over armchair advice.
4. **Imperative Action Bullets**: Every bullet begins with a punchy verb ("Used", "Added", "Focused", "Kept"). Zero filler.
5. **The Epigrammatic Reversal**: Two-line mirrored conclusion ("Your skills might not be the problem. / Your resume might just be hiding them.").
6. **Utility CTA**: "Save this before your next [action]" triggers high algorithmic bookmark/save signals.

