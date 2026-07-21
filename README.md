# DevScrolls — Personal Engineering Journal

**DevScrolls** is a static-first, lightweight, and highly performant personal engineering journal and technical blogging platform. It is custom-built with **Astro**, **Markdown**, and **Vanilla CSS** to deliver instant loading speeds, complete privacy compliance, and modular developer ergonomics.

---

## 🚀 Key Features

- **Static-First & Zero JS by Default**: Built on Astro's modern Islands architecture. Javascript is only hydrated for interactive features (like global search and theme selection).
- **Dynamic Open Graph Generation**: Features an automated Satori-based PNG generator (`src/pages/og/`) that dynamically builds beautiful, branded social cards showing article titles, categories, and author metadata on social shares.
- **PWA & Favicon Assets Pipeline**: A custom script (`scripts/generate-favicons.js`) compiled with `@resvg/resvg-js` to automatically compile a full set of icons, manifest profiles, and Apple touch icons from a single `/public/favicon.svg` source.
- **AdSense Ready**: Custom manual ad-slot components (`src/components/AdSlot.astro`) placed out-of-the-fold with built-in layout space preservation to prevent Cumulative Layout Shift (CLS).
- **Cookieless Analytics**: Integrated with **Umami Analytics**, loading a tiny 2KB script that does not place cookies, ensuring 100% GDPR compliance without needing privacy-invasive consent banners.
- **Semantic SEO & JSON-LD**: Embedded schema generation (WebSite on home, Person on about, Article on writing templates) for indexability.
- **Unified Typographic Scale**:Restrained, editorial-focused typography system using system-ui fonts and self-hosted layouts for zero font-loading latency.

---

## 📂 Project Structure

```text
/
├── .antigravity/        # Custom agent instructions and runnable skills
├── .github/workflows/   # CI/CD pipeline (legacy/alternative GitHub Pages deployments)
├── knowledge-base/      # Core design principles, UX invariants, and guides
├── public/              # Static assets, manifests, icons, and custom SVGs
├── scripts/             # Developer utilities (e.g. icon generators)
└── src/
    ├── components/      # Reusable UI widgets (Search, AdSlot, CategoryNav)
    ├── content/         # Markdown content collections
    │   └── articles/    # Your published blog posts
    ├── layouts/         # Layout wraps (BaseLayout, ArticleLayout)
    ├── pages/           # Static routes (index, about, contact, privacy)
    ├── styles/          # Design token definitions and global resets
    └── config.ts        # Global configuration properties & toggles
```

---

##  Genie Commands

All commands are run from the root of the project:

| Command | Action |
| :--- | :--- |
| `npm install` | Installs dependencies |
| `npm run dev` | Starts local dev server at `localhost:4321` |
| `npm run build` | Builds your production static bundle to `./dist/` |
| `npm run preview` | Previews the build bundle locally |
| `node scripts/generate-favicons.js` | Re-compiles PWA PNG icon sets from `favicon.svg` |

---

## 🛠️ Configuration & Customization

All primary configurations reside in **`src/config.ts`**. You can toggle features on/off easily:

### 1. Enabling AdSense
Once your Google AdSense account is approved, update `src/config.ts`:
```typescript
adsense: {
  enabled: true,
  publisherId: 'ca-pub-YOUR-PUBLISHER-ID',
  articleBottomSlotId: 'YOUR-SLOT-ID'
}
```

### 2. Customizing Analytics
Umami is active by default. If you need to update your tracking configuration:
```typescript
analytics: {
  enabled: true,
  provider: 'umami',
  websiteId: 'YOUR-UMAMI-WEBSITE-ID'
}
```

---

## ✍️ Content Creation

To create a new article, create a markdown file inside `src/content/articles/[slug].md`. The schema requires the following frontmatter:

```yaml
---
title: "Article Title"                       # Max 70 characters
description: "Short SEO snippet description" # 100-160 characters
publishDate: YYYY-MM-DD
category: "tutorials"                        # frontend, backend, ai, architecture, tutorials
tags: ["astro", "css"]                       # Max 5 approved tags
heroImage: "/your-hero-illustration.svg"     # 16:9 vector illustration
heroImageAlt: "Accessible alt text description"
draft: false                                 # Set to true to hide from build feeds
---
```
*Note: Drafts are automatically excluded from production builds but are accessible during local development.*

---

## 🚀 Deployment

### Primary Deployment: Vercel (Auto-Deployment)
The production site is hosted on **Vercel** with automatic deployment:
- **Trigger**: Every push or merge to the `main` branch on GitHub automatically kicks off a production build on Vercel.
- **Build Settings**: Vercel automatically detects the Astro project and configures the build settings (`npm run build` and output directory `dist/`).

### Legacy Deployment: GitHub Pages (Alternative)
A workflow is also configured in [.github/workflows/deploy.yml](file:///.github/workflows/deploy.yml) for deploying to GitHub Pages. It can be used as a backup deployment pipeline.

