# Color Theory in Web UI Design — Extraction Notes

## PDF Metadata
- **Title:** Color Theory in Web UI Design: A Practical Approach to the Principles
- **Publisher:** UXPin Inc., Copyright 2015
- **Authors:** Jerry Cao (lead); Kamil Zieba, Krzysztof Stryjewski, Matt Ellis
- **Page count:** 35 pages

## Core Theses
1. Colors have scientifically proven psychological and physiological effects.
2. Each color carries distinct emotional signals across warm/cool/neutral groupings.
3. Colors gain meaning relationally — contrast and complement govern juxtaposition perception.
4. Color schemes are systems, not random picks (6 canonical structures).
5. One dominant color anchors multi-color schemes (60/30/10 rule).
6. Style guides with exact CMYK/Pantone/RGB/HEX are mandatory.
7. No color is inherently better; choice depends on project and audience.

## Per-Color Psychology

| Color | Emotion | Use For | Avoid |
|-------|---------|---------|-------|
| **Red** (p. 8-9) | Stimulating, alarm, power, youth | Destructive actions, errors, alerts | Relaxed/reading sites |
| **Orange** (p. 9) | Cheerful, playful, calmer than red | Friendly CTAs, accents | Formal contexts |
| **Yellow** (p. 10) | Vibrancy-dependent. Bright = stimulating; gold = timeless | Featured badges, accents | Long-form text |
| **Green** (p. 10) | Energy + relaxation, growth, money | Success, published states | High-tech serious |
| **Light Blue** (p. 11) | Friendly, safe, inviting (Facebook, Twitter) | Social, onboarding, links | Premium luxury |
| **Dark Blue** (p. 11) | Somber, reliable, professional | Tech blog primary brand color | Casual/fun |
| **Purple** (p. 12) | Royalty, luxury, mystery | Premium tiers, deep-dive content | High-volume sites |
| **Black** (p. 12) | Power, sophistication. Default text. | Body type, hero | Whole-screen for joy |
| **White** (p. 13) | Cleanliness, purity, supporting role | Article surfaces, breathing | Dark moods |
| **Gray** (p. 13) | Neutrality — tunable | Borders, secondary text, ramps | When emphasis needed |

## Schemes (p. 20-30)

### Monochromatic (p. 20-21)
One color + shades. Emphasizes content. Best for content-focused/portfolio sites.

### Analogous (p. 21-23)
Adjacent wheel colors. Calming, harmonious. Good for long-form reading.

### Complementary (p. 23-24)
Opposite colors. Dynamic, distinct. Avoid desaturated. Too intense for relaxed atmosphere.

### Triadic (p. 25-26)
3 equilaterally-spaced. Safest/crowd-pleaser. Weak for single CTA.

### Split-Complementary (p. 27-28)
Complementary attention + grounding third color. **Highly applicable to dev blog** — neutral foundation + brand accent.

### Rectangular Tetradic (p. 29-30)
Two complementary pairs. Strong colors used less often. For category color-coding.

## Color Combining Principles

### Contrast (3 steps apart)
Clash for attention. Perfect for CTAs. (p. 16)

### Complementary (opposites)
Draws out each color's natural appeal. Less attention-grabbing than 3-step. (p. 17-18)

### Complements Push to Extremes
Juxtaposed complements amplify each other. (p. 18)

### Same-Color Shades Complement
Light + dark green = safe complementary pattern. (p. 18)

## Hierarchy & Tokens

### Dominant/Secondary/Accent (60/30/10)
ONE dominant (emotional tone), ONE secondary (differentiation), one accent (sparingly). (p. 22)

### Mozilla Sandstone Examples (p. 31-32)
`$darkblue`, `$navblue`, `$lpblue`, `$linkblue`, `$darkgray` ... `$subduedgray`

### Lonely Planet Palette (p. 32)
- Primary: `#142b44`, `#1d108d`, `#297cbb`, `#2096d6`, `#0fded0`, `#16c98d`, `#feaf6d`, `#ffc83f`, `#fa5a5b`, `#bf538d`
- Grays: `#2c3643`, `#3b444f`, `#67747c`, `#99a1b1`, `#dbe6ec`

### Searchable Token Docs (p. 32)
Style guides should be filterable by name/HEX.

## Special Patterns

### Scroll-Driven Mood Shifts (03 July, p. 14-15)
Background changes by section: orange-red for "Easy to USE" (playful) → dark blue for "Reliable" → purple for "Care for DESIGN" (luxurious).

### Stronger Colors Used Less Often (p. 30)
Red, black should appear LESS than weaker hues in rich palettes.

## Tools (p. 33)
- Stylify Me (reverse-engineer sites)
- Adobe Color CC
- Flat UI Color Picker
- Paletton (beginner)
- Material Palette
- Coolors
- Color Combos

## Accessibility Gaps
PDF does NOT cover WCAG ratios, color blindness, or screen-reader concerns. Closest implicit:
- Shade variation for differentiation (p. 21)
- "Avoid desaturated colors" (p. 24)
- Black for body text (p. 12)

`10_Accessibility_Standards.md` must supplement with WCAG AA/AAA contrast and color-blind safety.

## Key Quotes
1. "The impact of colors extends far beyond our sense of sight — they create scientifically proven connections with our emotional state." (p. 6)
2. "Warm colors are more stimulating, while cool ones feel more calming." (p. 8)
3. "Black is the strongest of all colors, which is why it's almost always used for the font color of text." (p. 12)
4. "No one color is inherently better than others in all situations." (p. 14)
5. "When two complementary colors are juxtaposed, they push each other farther into their extremes." (p. 18)
6. "Monochromatic color schemes... naturally emphasize the content and make even the simplest of typefaces appear bold and dramatic." (p. 20)
7. "A consolidated reference guide will improve visual consistency." (p. 31)

## Cited Examples
Garden Estúdio, No Way NSA, Fanta, Flash Media, Ameritrade, Facebook, Van Vliet & Trap, Cadbury, WWF Earth Hour, Rogue Society, Squarespace, 03 July, Glyde, TV Safety, Wake, Do a Backflip, Ondo, DocReady, Shopify, Formlets, Mozilla Sandstone, Lonely Planet.

## Influences Documentation
- **03_Color_System.md** (PRIMARY) — 60/30/10, semantic tokens, gray ramp, scheme choice, HEX/RGB for every token
- **02_Design_Principles.md** — color serves content, context shifts meaning, dominance ratios
- **10_Accessibility_Standards.md** — supplements with WCAG (PDF is light)
- **12_Branding_Guide.md** — justify color choices via psychology, document style-guide best practices
