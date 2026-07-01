# Future Hybrid Editorial Homepage Layout Roadmap

## Context
As DevScrolls scales from a newly launched site to a comprehensive platform with 50+ articles, the current simple vertical list timeline will become less structured for discovering older, high-value tutorials. The user wants a visually rich layout similar to Hostinger's newsroom, featuring article grids and featured highlights.

## Decision
We will maintain the current minimal chronological timeline layout during the initial launch phase (under 10 posts). 

Once the blog reaches **10+ published articles**, we will migrate the homepage to a **Hybrid Editorial Layout**:

1. **Featured Story (Top)**: A 2-column hero block showcasing the latest article. Left column contains a large 16:9 custom hero illustration, and the right column contains title, date, reading time, and descriptive snippet.
2. **Pinned Grid (Middle)**: A 3-column grid row displaying three "pillar" tutorials (e.g. *How to become a frontend developer in 2026*, *Event Delegation*, etc.) which remain static to guide new visitors.
3. **All Stories List (Bottom)**: A text-only vertical archive feed for older articles, omitting thumbnails.

## Status
**Proposed & Accepted** (To be implemented once content size reaches 10+ posts).

## Consequences
- **Zero Content Gaps**: Prevents grid sections from looking empty or repetitive during the initial launch.
- **Reduced Image Generation Overhead**: You only need to generate high-fidelity custom SVG graphics for the Featured Post and the three Pinned posts. Older posts in the text feed do not require graphics, maintaining write-and-publish speed.
- **Improved Performance**: Text-only listings at the bottom of the page keep homepage bundle sizes small, maintaining a 100 Lighthouse score.
