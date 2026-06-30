# Knowledge Base — Index

> The foundational documentation for the platform. Read this first.

This `knowledge-base/` directory is the permanent brain of the project. It contains 16 documentation files plus per-PDF extraction notes — together they encode the design philosophy, technical direction, content strategy, and architectural commitments of the platform.

**Anyone (or any AI) starting work on this platform should read this index, then [[01_Project_Vision]] and [[14_AI_Context]], before making changes.**

---

## How This Knowledge Base Was Built

These documents were synthesized from **11 source PDFs** on UI / UX design, color theory, typography, accessibility, content strategy, and design systems. Every principle is **cited back to a specific PDF + page reference** where applicable. Where the PDFs don't address a topic (Astro, SEO, AdSense, modern WCAG), the document supplements with current widely accepted best practices and clearly marks them as complementary guidance.

### Source PDFs (all UXPin Inc., 2015)
1. *Color Theory in Web UI Design* — color psychology, schemes, 60/30/10, style guides.
2. *White Space in Web UI Design* — active space, perception of luxury, Gestalt grouping.
3. *Consistency in UI Design* — external/internal consistency, six-axis checklist.
4. *Web UI Design for the Human Eye* — scanning patterns, hierarchy, typography rules.
5. *10 Pro Tips to a Smarter UX Design Process* — process map, hypothesis format.
6. *3 Common UX Mistakes Killing Good Design* — ego, UX≠UI, friction.
7. *Clever Interactive Techniques for Web Storytelling* — narrative arc, restraint.
8. *Getting Started with UX Design Process & Documentation* — process, personas, maintenance-first.
9. *The Visual Storyteller's Guide to Web UI Design* — picture superiority, image types, custom > stock.
10. *Web UI Trends: Card-Based Design Patterns* — one card = one thought, card components.
11. *Web UI Trends: The Elegance of Minimalism* — sculpture through subtraction, content-first philosophy.

Per-PDF extraction notes (full principle inventory with page citations) live in `_notes/`.

---

## The 16 Documentation Files

Read in this order for a complete understanding. Each links to the others where relevant.

### Strategic foundation (the "why")
| # | File | Purpose |
|---|------|---------|
| 01 | [Project Vision](01_Project_Vision.md) | Long-term vision, audience, philosophy, roadmap |
| 14 | [AI Context](14_AI_Context.md) | Handoff doc for any AI assistant — read alongside Vision |
| 15 | [Decision Log Template](15_Decision_Log_Template.md) | Template + rules for logging non-trivial decisions |

### Design system core (the "look and feel")
| # | File | Purpose |
|---|------|---------|
| 02 | [Design Principles](02_Design_Principles.md) | The constitution — 12 foundational principles |
| 03 | [Color System](03_Color_System.md) | Palette philosophy, tokens, dark mode, code colors |
| 04 | [Typography System](04_Typography_System.md) | Pairing, scale, hierarchy, code typography |
| 12 | [Branding Guide](12_Branding_Guide.md) | Voice, visual identity, persona, trust signals |

### Experience & content (the "what readers feel")
| # | File | Purpose |
|---|------|---------|
| 05 | [UX Guidelines](05_UX_Guidelines.md) | Navigation, search, friction, feedback, errors |
| 06 | [Content Strategy](06_Content_Strategy.md) | Categories, lifecycle, voice, markdown standards |
| 07 | [Information Architecture](07_Information_Architecture.md) | Site structure, URLs, taxonomy, scalability |

### Technical commitments (the "non-negotiables")
| # | File | Purpose |
|---|------|---------|
| 08 | [SEO Master Guide](08_SEO_Master_Guide.md) | Technical SEO, metadata, structured data, CWV |
| 09 | [Google AdSense Guide](09_Google_AdSense_Guide.md) | Ad policy + placement (if ever introduced) |
| 10 | [Accessibility Standards](10_Accessibility_Standards.md) | WCAG 2.2 AA baseline, AAA targets, testing |
| 11 | [Performance Guide](11_Performance_Guide.md) | Budgets, optimization, Core Web Vitals |
| 13 | [Future Scalability](13_Future_Scalability.md) | Architectural principles for 5–10 year horizons |

### Operations (the "how we ship")
| # | File | Purpose |
|---|------|---------|
| 16 | [Checklists](16_Checklists.md) | Master checklists for articles, pages, features, reviews |

---

## How to Use This Knowledge Base

### If you are the platform owner
- **Read the Vision** at the start of each year. Re-audit personas annually.
- **Update decision logs** within a week of any non-trivial decision.
- **Run checklists** at the cadence in [[16_Checklists]].
- **Treat this as a living document** — update files when reality changes, don't leave them stale.

### If you are an AI assistant (any model, any workspace)
- **Read [[14_AI_Context]] first.** It tells you what you can and cannot change without permission.
- **Then read [[01_Project_Vision]] and [[02_Design_Principles]].** They are the constitution.
- **When making code or content changes, cross-check against the relevant doc.**
- **Use [[15_Decision_Log_Template]] for significant changes.**
- **When in doubt, ask the owner.** Reversible > optimal.

### If you are a future human collaborator
- **Read the same starter set:** Vision, AI Context, Design Principles.
- **Find the doc that owns your area** — every principle lives in exactly one doc.
- **The `_notes/` folder** has full PDF extractions if you need primary sources.
- **Don't rewrite a doc — supersede it via the decision log if needed.**

---

## Conventions Used Across This Knowledge Base

### Citations
PDF sources are cited inline like *(Color Theory PDF p. 14)* or *(Human Eye p. 67)*. Page references map to the original UXPin publications.

### Cross-references
Files link to each other via `[[NN_File_Name]]` syntax. These can be replaced with relative paths if the knowledge base is moved (e.g., to a wiki).

### Complementary vs PDF-grounded
Each doc distinguishes:
- **Principles derived from the uploaded PDFs** — cited with page numbers.
- **Modern best practices** — explicitly marked as complementary guidance.

### Status markers
- **Rules:** non-negotiable constraints.
- **Decision Framework:** ordered questions to walk through when making choices.
- **Common Mistakes:** patterns to actively avoid.
- **Future Considerations:** placeholders for things to revisit.

---

## What This Knowledge Base Does NOT Contain

By explicit design:
- **No code.** This is architectural and strategic documentation; implementation lives in the codebase.
- **No folder structures.** The knowledge base describes principles; the project repo describes structure.
- **No API specs.** When APIs are introduced, they get their own docs alongside this knowledge base.
- **No personal information beyond what serves brand transparency.**

---

## How This Knowledge Base Will Evolve

### Things that should change
- **Decision log entries** grow with every decision.
- **Roadmap** in [[01_Project_Vision]] reflects current horizon.
- **Voice examples** in [[12_Branding_Guide]] update as the voice matures.
- **Performance budgets** tighten as the platform improves.

### Things that should NOT change
- **Core principles** in [[02_Design_Principles]] — these are the constitution.
- **URL durability commitment.**
- **Brand voice fundamentals.**
- **Static-first commitment.**
- **Accessibility floor.**

Any change to a non-changing thing requires:
- A decision log entry.
- Explicit acknowledgment that an invariant is being revised.
- A migration plan if existing content is affected.

---

## Portability

This knowledge base is **portable across workspaces, IDEs, and AI tools**.

To use it elsewhere:
1. Copy the entire `knowledge-base/` directory (including `_notes/`).
2. Make sure markdown links resolve (relative paths or wiki-style links).
3. Drop into the new workspace's root or `docs/` folder.
4. Point the AI at this `INDEX.md` first.

The knowledge base does **not** depend on:
- Specific frameworks (Astro, Next.js, etc.).
- Specific AI tools (Claude, GPT, Copilot, Cursor).
- Specific IDEs (VS Code, JetBrains, etc.).
- Specific markdown renderers (any CommonMark-compatible viewer works).

---

## A Note on Voice

This knowledge base is written in the same voice as the platform itself: **calm, curious, honest, approachable, crafted.**

When you edit it, preserve that voice. When you read it, you should feel that the author **cared** about each rule's reason for existing.

---

## Quick-Start: First 30 Minutes

If you have 30 minutes to come up to speed:

1. **10 min** — Read [[01_Project_Vision]] (the why).
2. **10 min** — Skim [[02_Design_Principles]] (the constitution).
3. **5 min** — Read [[14_AI_Context]] (the dos and don'ts).
4. **5 min** — Skim this INDEX again to know which doc owns what.

After that, dive into whichever document owns the area you're working on.

---

## Final Note

> "If your documentation isn't usable, there's no reason to create it." *(10 Pro Tips p. 16.)*

This knowledge base only earns its keep if it gets used. Use it. Update it. Reference it in PRs and decision logs. Let it grow with the platform — and let it constrain the platform when constraint serves the reader.
