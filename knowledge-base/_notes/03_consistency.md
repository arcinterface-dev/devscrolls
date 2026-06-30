# Consistency in UI Design — Extraction Notes

## PDF Metadata
- **Title:** Consistency in UI Design: Creativity Without Confusion
- **Publisher:** UXPin Inc., Copyright 2015
- **Page count:** 38 pages

## Core Theses
1. Consistency reduces cognitive load and creates familiarity.
2. Consistency ≠ uniformity. Understand WHY patterns work, then build creatively on top.
3. Two kinds: external (with the outside world) + internal (within product).
4. Principle of Least Astonishment governs core functions.
5. Inconsistency is a "potent spice" — sparingly + purposefully.
6. Usability trumps consistency, BUT consistency in navigation is essential.
7. "Be consistent about when to be inconsistent" — deviations need defensible purpose.

## Principles

### 1. Consistency Reduces Cognitive Load (p. 6, 8)
Inconsistency forces relearning per page. Lock down search, navigation, TOC position.

### 2. Familiarity > Novelty for Core Functions (p. 6, 10)
Users carry expectations from other products. Honor them = free usability.

### 3. Principle of Least Astonishment (p. 10)
> "Delightful surprises are fine, but your core functions should not stray far from the norm. Don't make buttons for primary actions appear only on hover."

### 4. External Consistency (p. 12-14)
Match other products, platform conventions, non-digital interactions. Taps into user's "current knowledge" (Jared Spool). Floppy disk = save, envelope = email, magnifier = search, blue links.

### 5. Internal Consistency (p. 18)
Requirement, not bonus. Failure actively harms UX. "Thankless feature — only its absence is noticed."

### 6. UI Patterns Are Inherited Solutions (p. 13)
Carousels, envelope icon, logo-to-home, blue links — reuse, don't reinvent.

### 7. Match Mental Models (p. 14)
Volume = slider because people perceive volume relatively, not numerically (David Cole).

### 8. Stand Out Where It Doesn't Damage Usability (p. 14-15)
Distinguish brand voice/illustration/color — NOT menu location or Save button meaning.

### 9. Avis Asterisk Case Study (p. 15-17)
- Old: asterisks for OPTIONAL fields = users had to relearn forms
- New: bright red asterisks for required on every field = visual overload
- Better: black asterisks, OR label "(Optional)" with absence implying required
- Lesson: "Never underestimate the laziness of users"

### 10. Reddit Case Study (p. 18-19)
All outbound links blue/large. Internal links underline on hover. Self-teaching interaction grammar.

### 11. Six-Axis Consistency Checklist (p. 19-20)
1. **Color** — same color = same function (green=accept, red=reject)
2. **Typography** — distinct repeatable styles for headlines/body/secondary
3. **Language** — no flipping Yes/No vs Accept/Reject
4. **General visuals** — icon sets, buttons, links consistent everywhere
5. **Layout and location** — consistent grids; deviate to differentiate content type
6. **Interactions** — form behaviors, dialogs, animations uniform

### 12. Use Style Guide to Enforce Internal Consistency (p. 21-22)
Living design system with tokens, components, dos/don'ts, voice guidelines.

### 13. Inconsistency to Draw Attention (p. 25-26)
"Man in black with white tie" — eye goes to tie. One CTA stands out per page.

### 14. Inconsistency for Usability (p. 27)
US Airways dropped logo on mobile because it looked like hamburger.

### 15. Jawbone Case Study (p. 28-30)
Header/footer/nav/CTA consistent. Individual product pages diverge in hero treatment. Form follows function.

### 16. Miranda July Case Study (p. 30-31)
Externally inconsistent (no standard nav), internally highly consistent. Content chunked for snappy reading.

### 17. Dolce & Gabbana (Fitts's Law violation) (p. 32)
"Back to Shopping" far left, "Proceed with Order" far right — separate destructive from confirm. Same row, opposite ends.

### 18. Amazon Strip-Navigation in Checkout (p. 33)
Removes distractions during focused flow. Replace nav with progress bar.

### 19. Two UX Principles in Tension (p. 33)
1. Usability trumps consistency
2. Consistency in navigation is essential for orientation
→ Site-wide nav is most consistent layer; deviation only inside focused linear flows.

### 20. Xfinity Bad Inconsistency (p. 34-35)
Main pages: dropdown nav. TV pages: tabs. Looks similar to dropdown = confusion. Rule: drastically different OR identical — never in between.

### 21. Adobe Icon Bad Inconsistency (p. 36-37)
Grey icons = suites, colored = products. Then breaks own rule with grey for standalone Acrobat/Echosign.

### 22. Chunk Content (p. 31)
Short paragraphs, headed subsections, pull quotes, progressive disclosure reduce cognitive strain.

### 23. Versioning Consistency (p. 11)
Preserve URL structure, RSS shape, primary terminology, core nav meaning across redesigns.

### 24. Inconsistency Is a Spice (p. 26, 37)
"A pinch is enough; too much spoils the design." Isolate what should stand out MOST, then deviate only there.

## Key Quotes
1. "Consistency creates familiarity, and familiar interfaces are naturally more usable." (p. 6)
2. "Too much consistency creates boredom. Not enough leads to chaos. Balance is the key." (p. 9)
3. "Internal consistency is a thankless feature. Only its absence is noticed." (p. 19, 22)
4. "One bad interaction can ruin all the prior delightful ones." (p. 20)
5. "Be consistent with when to be inconsistent." (p. 25)
6. "Inconsistency is a potent spice. Just a pinch is enough." (p. 26)
7. "Usability trumps consistency. Consistency in navigation is essential for orientation." (p. 33)
8. "Either use drastically different navigation for different content types, or keep the navigation identical. Anywhere in between will only result in confusion." (p. 35)

## Influences Documentation
- **02_Design_Principles.md** — six-axis checklist, Least Astonishment, spice metaphor
- **05_UX_Guidelines.md** — optional labeling, destructive vs confirm placement, focused-mode nav, hover-only is banned
- **07_Information_Architecture.md** — single nav paradigm, IA-level consistency, logo-to-home, terminology preservation
- **12_Branding_Guide.md** — what's expressive vs conformant, one primary highlight color per page (Jawbone)
- **14_AI_Context.md** — rules: never invent nav, reuse components, preserve terminology, justify any deviation
