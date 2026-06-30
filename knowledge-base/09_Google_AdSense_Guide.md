# 09 — Google AdSense Guide

> Ads, if added at all, must serve revenue **without compromising** the reader experience.

**Related:** [[01_Project_Vision]] · [[02_Design_Principles]] · [[05_UX_Guidelines]] · [[11_Performance_Guide]] · [[12_Branding_Guide]]

---

## Purpose

Define the platform's stance on advertising, the rules under which ads may be introduced (if ever), placement principles that preserve UX, and the compliance/policy considerations.

> **The default position is: no ads.** This document exists so that *if* ads are ever introduced, they follow the platform's principles rather than overriding them.

> The uploaded PDFs do not cover ad strategy. This document is built from current widely accepted best practices and Google's published policies. Cross-references to PDF-grounded principles indicate where ad decisions must defer to existing values.

---

## Philosophy

1. **The platform is reader-first, not advertiser-first.** *(See [[01_Project_Vision]] — what the brand is NOT: paywalls, popups, interstitials.)*
2. **Ads, if introduced, must clear three tests:** they don't degrade UX, they don't degrade trust, and they don't degrade performance.
3. **Quality content is the prerequisite.** Google's "Helpful Content" updates make this clear: thin or AI-generated content will fail policy reviews.
4. **Better revenue alternatives exist:** newsletter sponsorships, freelance work, open-source sponsorship, paid tutorials. Display ads are usually the lowest-quality option.

---

## When (If Ever) to Add Ads

Three conditions must all be true:

1. **Traffic is high enough** that ad revenue meaningfully covers hosting/tooling costs.
2. **Content depth is sufficient** that occasional ads don't dominate the reading experience.
3. **No better monetization option** exists for the platform's audience and content.

If any condition fails, **don't run ads.** Reconsider quarterly.

### Decision logged
Adding ads is a major decision. Log in [[15_Decision_Log_Template]] with:
- The hypothesis (Wambach format).
- The expected revenue range.
- The UX/performance tradeoff acknowledged.
- A 90-day evaluation date set.

---

## Google's Helpful Content & Policies (Summary)

To be eligible at all, the platform must satisfy:

### Content quality (AdSense Program Policies)
- Original, useful, substantive content.
- Not auto-generated content lacking added value.
- Not scraped or "thin" content.
- Not violating intellectual property (copyrighted material without permission).
- Not deceptive (clickbait headlines without payoff).
- Not in restricted categories (adult, violence, dangerous products, etc.).

### Technical
- Site is the publisher's, not third-party hosting.
- Custom domain with HTTPS.
- Site is navigable, contact info present.
- Privacy policy, terms, cookie policy published.
- Crawlable by Googlebot.

### User experience (alignment with platform values)
- No deceptive layouts that hide ads as content.
- No misleading nav.
- Site is mobile-friendly.

---

## Ad Placement Philosophy

*If* ads are added, placement must respect the F-pattern and Z-pattern rules. *(Human Eye p. 23 — end-of-row CTAs are pause points; this applies to ads too, but advertising is a CTA the reader didn't ask for.)*

### Acceptable placements (in priority order, least invasive first)

1. **Between-content placement** at well-defined breakpoints (between two posts in a list, between major sections in a long article). One ad max.
2. **Right-rail sidebar** on desktop ≥ 1024px, below the TOC. Sticky-not-following.
3. **End-of-article**, after the resolution + author bio, before related posts.

### Unacceptable placements

- **Above the fold** — pushes content below.
- **Between hero and lead** — breaks the article flow.
- **Inside the article body** — disrupts reading.
- **As interstitials** — directly violates platform values. *(Vision rule: no popups.)*
- **As pop-overs or floating bars.**
- **In navigation areas.**
- **Mimicking content** ("native ads" styled as posts).

### Density rules
- **One ad per article maximum** initially.
- **No ad on the home page** (it's the brand's primary surface).
- **No ad on the about page** (it's a trust signal).
- **No ad on the contact page.**

---

## User Experience Rules

If ads are present, they must:

1. **Be clearly labeled** as advertising ("Ad," "Sponsored," "Advertisement").
2. **Use a distinct visual treatment** so the reader can immediately distinguish from content.
3. **Not autoplay video or audio.**
4. **Not animate** more than a subtle fade-in.
5. **Be lazy-loaded** to preserve LCP.
6. **Reserve space** to prevent CLS (Cumulative Layout Shift).
7. **Be dismissible** when possible (some networks offer this).
8. **Respect `prefers-reduced-motion`** for any animation.
9. **Never use anchor placements that obscure navigation or content.**

---

## Readability Protection

The reader's experience is the priority. *(See [[02_Design_Principles]] Principle 1.)*

### Rules
- **Reading flow is uninterrupted** by ads in the body.
- **Code blocks are sacred** — never an ad inside or adjacent in a way that creates visual confusion.
- **Diagrams and figures** are not interrupted.
- **The single CTA at article end** remains the primary call. Ads cannot replace or visually overpower the platform's own CTA.

---

## Trust Signals

Ads can erode trust. To preserve it:

- **Disclosure page** explaining how the platform is monetized.
- **No sponsored posts disguised as editorial.** If a post is sponsored, it's marked clearly + the relationship disclosed.
- **No affiliate links without disclosure.** FTC guidelines + reader trust.
- **No editorial influence from advertisers.** If a sponsor's product is reviewed, disclose the sponsorship and write honestly.
- **Annual disclosure post** summarizing revenue sources (optional but signals integrity).

---

## Performance Considerations

Ads are typically heavy: third-party scripts, third-party images, third-party iframes. They threaten:

- **LCP** — ad scripts block render.
- **CLS** — ads loading after content shifts layout.
- **INP** — ad scripts run on every interaction.
- **Total page weight** — easily doubles a lean page.
- **Privacy** — ad networks track readers.

### Mitigation rules
- **Lazy load all ad slots** — defer until in viewport.
- **Reserve aspect-ratio'd space** to prevent CLS.
- **Use async/defer** on ad scripts.
- **Limit to one ad network** — don't stack.
- **Audit Core Web Vitals monthly** when ads are present.
- **Set a performance budget** that includes ad weight; remove ads if budget breaks.

If ads push Core Web Vitals into "Needs Improvement," the ads come out. *(Performance budget non-negotiable.)*

---

## Privacy Considerations

Google AdSense uses cookies and may use behavioral targeting.

### Compliance
- **GDPR / UK GDPR** if EU readers: cookie consent required for non-essential cookies.
- **CCPA / CPRA** if California readers: opt-out option.
- **Cookie consent banner** if ads present (none if not).
- **Privacy policy** updated to disclose ad networks, what they collect, opt-out instructions.
- **Honor "Do Not Track"** signals where applicable.

### Alternatives to behavioral ads
- **Contextual ads** (based on page content, not user profile). Lower revenue but better aligned with reader trust.
- **First-party direct sponsorships** — sell ad slots directly to relevant companies.
- **No targeted ads under 16/13** if any chance of minor readers.

---

## Revenue Optimization Without Harming UX

If ads are introduced, optimize within UX constraints, not by stretching them.

### What's acceptable
- A/B testing ad placement positions (within acceptable zones).
- Choosing higher-paying ad formats (e.g., responsive over fixed) **if** they don't degrade UX.
- Negotiating direct sponsorships (often better revenue + trust).
- Limiting ads to specific high-traffic categories.

### What's NOT acceptable
- Adding more ad slots to boost revenue.
- Moving ads into content body.
- Reducing white space around ads (cramming).
- Adding interstitials.
- A/B testing dark patterns ("Close" buttons that are actually ad-clicks).
- Auto-refreshing ads to inflate impressions.

---

## Alternatives to AdSense

Before deploying ads, consider:

1. **Newsletter sponsorships** — sell sponsorships in a curated newsletter. Better CPM, smaller audience needed, trust-preserving.
2. **Open-source sponsorship** — GitHub Sponsors, Open Collective. Aligns with the platform's open-source positioning.
3. **Premium content** — paid in-depth guides or video walkthroughs.
4. **Freelance / consulting** — the platform demonstrates expertise; clients find the author.
5. **Tip jars / "Buy me a coffee"** — low friction, no ads.
6. **Affiliate links** (with disclosure) — for products genuinely used and recommended.
7. **Direct sponsorships** of posts or sections — sell to relevant companies, full editorial control.

> **For this platform, options 1, 2, 3, and 4 are aligned with the brand. Display ads should be a last resort.**

---

## Decision Framework

Before adding ads:

1. **Have we tried alternatives?** (Newsletter sponsorships, OSS funding, etc.)
2. **Is traffic high enough** for meaningful revenue?
3. **Is content depth sufficient** to absorb ads without degrading UX?
4. **Will ads pass Core Web Vitals "Good"?**
5. **Are privacy requirements met** (consent, policy)?
6. **Is there a kill switch** (90-day evaluation, performance threshold)?

If any answer is "no," don't add ads.

---

## Rules

1. **Default: no ads.**
2. **One ad per article maximum.**
3. **No ads on home, about, contact, project case studies, or 404.**
4. **No ads above the fold.**
5. **No interstitials, popovers, or floating bars.**
6. **No autoplay sound or video in ads.**
7. **Clearly labeled "Ad" / "Sponsored."**
8. **Lazy-loaded, space-reserved.**
9. **Privacy policy + consent UI required.**
10. **Sponsored content disclosed prominently.**
11. **Performance budget includes ads; ads removed if budget breaks.**
12. **Annual review of whether ads still serve the platform's goals.**

---

## Examples

### Good — end-of-article ad placement

```
[article body]
[conclusion + single CTA]
[author bio]
[--- Ad clearly labeled, reserved-space block ---]
[related posts]
[footer]
```

### Bad — body-injection ad

```
[article body paragraph 1]
[--- AD ---]
[article body paragraph 2]
[--- AD ---]
[article body paragraph 3]
```

*Disrupts reading. Forces ad scroll. Reader leaves.*

### Bad — sticky-bottom ad bar

A persistent ad strip at the bottom of every page. → Violates "no floating bars," consumes valuable mobile screen real estate, never dismisses. **Reject.**

---

## Common Mistakes

- **Approving AdSense before content depth is sufficient** — application gets rejected, or the site looks like an ad farm.
- **Stacking multiple ad networks** — performance disaster.
- **Treating affiliate links as content** — disclosure required by FTC; trust required by readers.
- **Not honoring Do Not Track / consent signals** — legal + reputational risk.
- **Ignoring CLS impact** of ad slots — readers click wrong things, hate the site.
- **Letting ads dictate content** — writing "for the algorithm" is the death of the platform's voice.
- **Skipping the privacy policy update** when adding ads.
- **Not measuring** the actual UX impact (bounce rate, time-on-page).

---

## Checklist

If introducing ads:

- [ ] Decision logged in [[15_Decision_Log_Template]] with hypothesis + 90-day eval date
- [ ] Privacy policy updated with ad network disclosure
- [ ] Consent banner implemented (if EU/UK/California readers)
- [ ] Ad slots are space-reserved (no CLS)
- [ ] Ads lazy-loaded
- [ ] Async/defer on ad scripts
- [ ] Labeled clearly ("Ad" / "Sponsored")
- [ ] Distinct visual treatment from content
- [ ] No ads above the fold
- [ ] No ads on home / about / contact / 404
- [ ] Core Web Vitals re-tested with ads on
- [ ] Performance budget still met
- [ ] Mobile experience verified
- [ ] Reduced-motion respected
- [ ] No autoplay sound
- [ ] One ad network only
- [ ] Sponsored content (separate from network ads) clearly disclosed

For each 90-day review:

- [ ] Revenue meaningful relative to platform goals?
- [ ] UX metrics holding? (Bounce, time-on-page)
- [ ] Core Web Vitals still "Good"?
- [ ] Reader feedback?
- [ ] Alternatives (sponsorships, etc.) revisited?

---

## References

The uploaded PDFs do not address advertising. This document is built primarily from:

- **Google AdSense Program Policies** (support.google.com/adsense/answer/48182).
- **Google Helpful Content System** documentation.
- **AdSense / Better Ads Coalition** standards for acceptable formats.
- **GDPR / CCPA / CPRA** regulations for cookie consent.
- **FTC Endorsement Guides** for affiliate/sponsorship disclosure.
- **web.dev** documentation on ads and Core Web Vitals.

Cross-references to PDF-grounded values that constrain ad strategy:
- *White Space in Web UI Design.* UXPin, 2015 — luxury via white space (heavy ads = perception of cheap).
- *Web UI Trends: The Elegance of Minimalism.* UXPin, 2015 — content-first philosophy.
- *3 Common UX Mistakes.* UXPin, 2015 — UX trumps revenue when in conflict (p. 18).
- *Consistency in UI Design.* UXPin, 2015 — Principle of Least Astonishment (no surprise ads).
