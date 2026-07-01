# Decision Log: Editorial Redesign and Images Integration

**Date:** 2026-07-01  
**Status:** Approved  
**Author:** Santhanakrishnan

## Context

The previous design was a mix of a portfolio page and cards. Feedback suggested the layout felt like a generic landing page instead of a focused blog where users can read comfortably. 

Key issues addressed:
1. Hard to read over long periods without eye strain.
2. Lack of imagery on the index feed and individual article pages.
3. Lack of topic-based navigation (since the primary "Writing" and "Projects" links were removed or dead-ended).
4. Outdated header design constraints (like raw bottom borders).

## Decisions & Design Implementation

### 1. Enhanced Readability
- Bumped body and prose line-height to `1.8` (`--leading-loose`) to prevent eye fatigue.
- Tuned letter-spacing to `-0.003em` for body prose, and set font color to `--text-secondary` to lower glare, especially in dark mode.
- Adopted a strictly centered `68ch` max-width container for prose.

### 2. Header and Navigation Restoration
- Renamed the main blog archive link to **"Articles"** (pointing to `/writing`) and added it back to the global header.
- Switched from raw header borders to a **sticky glassmorphic header** (`backdrop-filter: blur(12px)`) with a scroll-triggered drop shadow.
- Replaced the boxy border on the `ThemeToggle` with a clean, modern circular background highlight on hover.

### 3. Responsive Images
- **Article Details**: Restored the `heroImage` block right under the title of `ArticleLayout.astro`.
- **Feed Lists**: Updated `ArticleListItem.astro` to include the post `heroImage` as a thumbnail.
  - *Desktop*: Displays as a `180px` wide thumbnail on the right side of the metadata/text.
  - *Mobile*: Stacks on top of the text to serve as a clean visual header for each list element.
  - Hovering on the article card zooms the image slightly for a premium feel.

### 4. Topic-Based Navigation (Category Filtering)
- Created `<CategoryNav.astro>`, a horizontal scrollable menu of pills listing all taxonomies (Engineering, AI, Design Systems, etc.).
- Implemented static routing for categories under `src/pages/category/[category].astro`. This maps each topic dynamically to a static route, resolving navigation needs.

## Consequences
- The homepage and category pages feel like modern editorial blog sites (e.g., Substack, Medium, Ghost).
- Every page successfully compiles statically, keeping JavaScript output close to zero (except for client-side search and theme toggle state).
