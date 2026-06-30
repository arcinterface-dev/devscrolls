# Card-Based Design Patterns — Extraction Notes

## PDF Metadata
- **Title:** Web UI Trends Present & Future: Card-Based Design Patterns
- **Authors:** Jerry Cao & Carrie Cousins, UXPin Inc., 2015
- **Page count:** 31 pages

## Core Theses
1. Cards = "singular thought" — one primary action/content per card.
2. Cards manifest broader container-style design (one chunk per block).
3. Cards bridge desktop and mobile — aspect ratio mirrors mobile screen.
4. Mastering cards = flawlessly executing design fundamentals in small unforgiving space.
5. Cards are a tool, not magic — can fail through overload, sameness, weak interaction.
6. Future of cards: interactive, dynamic, auto-updating.

## Seven Components of Card Design (p. 22-23) — CORE CHECKLIST
1. **Plenty of space** (internal + between)
2. **One piece of info per card**
3. **Clear crisp image** (cropped/scaled for container)
4. **Simple typography** (sans-serif, medium weight headlines)
5. **One unexpected detail** (sparingly — "potent spice")
6. **Open consistent grid**
7. **Prioritize usability** (Fitts's Law, generous targets)

## Principles

### 1. One Card = One Thought (p. 7, 22)
One idea + one primary action. Avoid stacking secondary actions at equal weight.

### 2. Container-Style Grouping (p. 8-9)
The Guardian model: containers of cards stacked in descending priority.

### 3. Fixed Width, Variable Depth (p. 16)
Predictable horizontal rhythm + flexible content length.

### 4. Image 50-75% of Card (p. 22)
Crisp, cropped. Visual teaser dominates.

### 5. Generous Whitespace (p. 22)
Combats overload (top failure mode). 16-24px internal padding, gutter ≥ padding.

### 6. Simple Card Typography (p. 22)
Small format breaks fancy type. Reserve display/serif for reading view.

### 7. One Unexpected Detail (Sparingly) (p. 22)
"Treat like a potent spice: add just a dash." Avoids Pinterest-clone sameness.

### 8. Open Consistent Grid (p. 22)
Token-driven spacing, 12-col grid collapses to 8/4/1.

### 9. Fitts's Law Usability (p. 23)
Whole-card click target. Secondary controls ≥44px tap.

### 10. Adapt by Reflow, Not Restructure (p. 14-15)
Cards expand/contract per breakpoint without disrupting layout. One layout serves all devices.

### 11. Aspect Ratio Mirrors Mobile (p. 14, 16)
Touch-first by default.

### 12. Equal Hierarchy → Use Mixed Sizes for Emphasis (p. 19, 27)
Default = equal cards. "Featured" promotes to 2x or full-bleed within same grid.

### 13. Masonry vs Strict Grid (p. 11)
Strict = scanability. Masonry = image-heavy/portfolio variety.

### 14. Magazine-Style Prioritization (p. 12, 20)
Prioritize by **relevance, not just recency.** Solves "infinite reverse-chron feed" problem.

### 15. Magazine Demands Visual Balance (p. 12)
2-3 size variants, locked ratios. No ad-hoc sizing.

### 16. Card Sorting Drives IA (p. 13)
Validate with ≥5 users. Cards succeed only when categories reflect mental models.

### 17. Card Sorting Useless Without Categorization (p. 13)
Infinite scroll w/o exposed categories = wasted IA work.

### 18. Hover-to-Reveal Secondary Actions (p. 19)
Calm at rest, reveal on intent.

### 19. Excels at Aggregated Content (p. 19)
Unify posts + Substack + guest posts + talks as typed cards.

### 20. Pinterest-Clone Failure (p. 19, 9-10)
Vary card heights, use typography-led cards, mix media types.

### 21. Visual Inconsistency Between Card and Destination (p. 10)
Card visual language continues into article page.

### 22. Visual Overload Risk (p. 20)
Cap cards-per-row, whitespace dividers, consider pagination.

### 23. Cards Require Dev Investment (p. 19)
First-class component with states (default/hover/focus/loading/empty), telemetry, a11y.

### 24. Cards Lose to Lists When Poorly Done (p. 20)
Provide list/compact toggle for archive views.

### 25. Cards as Notifications/Micro-Interactions (p. 10, 14)
AirDrop's accept/decline card. Universal information container.

### 26. Material Design: Card = Entry Point (p. 25)
"Piece of paper with unique related data that serves as entry point."

### 27. Oversized Hero Cards (p. 26-27)
Bright color + bold type for emphasis. Editorial differentiation.

### 28. Cards as Live Information Surfaces (p. 25-26)
Auto-updating dynamic data. "Now" card, GitHub activity, latest talk.

## Key Quotes
1. "The best approach to understanding cards is to think of each as a singular thought." (p. 7)
2. "One block (or card) contains one chunk of user interaction." (p. 8)
3. "When we rewire how we access the web, we rewire how we use it." — Taylor Davidson (p. 16)
4. "Mastery of card design is all about flawlessly executing the fundamentals of design theory 101." (p. 23)
5. "Treat these effects like a potent spice: add just a dash." (p. 22)

## Influences Documentation
- **02_Design_Principles.md** — One card = one thought; 7 components; consistency card→destination; unexpected detail as spice
- **05_UX_Guidelines.md** — Fitts's Law; hover-reveal pattern; cards-as-notifications; interaction states; when lists beat cards
- **07_Information_Architecture.md** — Card-sorting research; container stacking; magazine prioritization by relevance; categories must be exposed
- **06_Content_Strategy.md** — One headline + one excerpt + one tag; image policy 50-75%; mixed sizes for emphasis; aggregated feed; vary against Pinterest sameness
- **11_Performance_Guide.md** — Dev chops required; reflow not restructure; fixed-width/variable-depth image budgets; live cards with skeleton loaders; masonry layout thrashing
