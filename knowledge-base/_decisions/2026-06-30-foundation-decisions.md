---
id: 002
title: "Foundation Decisions: Brand, URLs, and Typography"
status: accepted
date: 2026-06-30
author: Santhanakrishnan
deciders: [Santhanakrishnan]
tags: [brand, architecture, typography, seo]
supersedes: []
superseded-by: null
review-date: 2027-06-30
---

## Context

During the initialization of Phase 1, several ambiguities from the knowledge base required resolution before scaffolding could begin. These included the exact color palette, the URL structure for articles, the domain/site name, the author's bio, and the typography approach (serif vs sans-serif for headings).

## Problem

We need concrete values for foundational design tokens (colors, typography) and architectural structures (URLs, domain) to configure the Astro project and design system.

## Hypothesis

**If** we choose a minimalist sans-only typography, a deep slate blue/amber palette, and flat URLs (`/writing/[slug]`), **then** we will maximize future scalability, preserve URL permanence, and maintain the "thoughtful builder" aesthetic **because** fewer dependencies reduce payload, flat URLs never break if categories change, and restrained palettes feel more professional.

## Options Considered

### URL Pattern
- **Option A:** `/writing/[category]/[slug]` (Pros: hierarchical, good for breadcrumbs. Cons: breaks URL permanence if a post is recategorized).
- **Option B:** `/writing/[slug]` (Pros: perfectly permanent regardless of taxonomy changes. Cons: less hierarchical).
- **Option C:** `/[slug]` (extreme - Pros: shortest URL. Cons: clutters root namespace, makes routing complex).

### Typography
- **Option A:** Sans-serif body (Inter) + Serif headings (e.g., Newsreader). (Pros: high contrast, editorial feel. Cons: requires loading a second font family).
- **Option B:** Sans-serif only (Inter for all). (Pros: fast, modern, minimalist. Cons: slightly less editorial).

## Decision

1. **Brand Palette:** Deep Slate Blue (`#0f172a` family) for primary, Amber (`#f59e0b` family) for accent.
2. **URL Pattern:** Flat structure: `/writing/[slug]`.
3. **Domain & Site Name:** "DevScrolls".
4. **Author Identity:** "Santhanakrishnan - Full Stack Developer with 7+ years of experience."
5. **Typography:** Sans-serif only (Inter) to align with minimalism and performance budgets.

## Rationale

- **URLs:** The platform invariant states "URLs are permanent." Option B (`/writing/[slug]`) guarantees that even if taxonomy evolves or categories are renamed, the post URL never needs a redirect.
- **Typography:** The "thoughtful builder" persona and minimalism principles favor a clean, utilitarian look. Loading one font family (sans-only) guarantees a smaller payload, meeting the strict performance budgets (LCP < 1.8s).
- **Palette:** A Slate/Amber combination is widely recognized as professional, highly legible (especially in dark mode), and avoids the harshness of pure black/white or generic primary blue/red.

## Trade-offs

- Flat URLs mean breadcrumbs rely on site navigation rather than URL paths.
- Sans-only typography sacrifices the "magazine" editorial feel for a more "software documentation" or technical blog feel.

## Future Impact

- We can freely restructure categories in the future without implementing 301 redirects for individual posts.
- Font payloads will remain exceptionally small.

## Reversal Cost

- **Moderate:** URLs can be changed but would require 301 redirects. Typography can be changed by updating CSS tokens and adding a font import.

## Review Date

2027-06-30

## Outcome

(to be filled at review)

## Notes
N/A
