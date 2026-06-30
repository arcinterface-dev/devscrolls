---
name: scaffold-astro-layout
description: >
  Invoke when creating or modifying a major Astro layout template — BaseLayout,
  ArticleLayout, PageLayout, etc. Ensures the layout includes all required meta tags,
  semantic HTML regions, SEO components, accessibility features, and performance
  optimizations from the start.
inputs:
  - layout_name: Name of the layout (e.g., BaseLayout, ArticleLayout)
  - template_type: base | article | page | index | 404
---

# Scaffold Astro Layout Skill

## Knowledge Base Files to Consult

1. `knowledge-base/08_SEO_Master_Guide.md` — meta tags, OG, Twitter Card, JSON-LD, canonical
2. `knowledge-base/10_Accessibility_Standards.md` — semantic HTML regions, skip-to-content, lang attribute
3. `knowledge-base/11_Performance_Guide.md` — font preload, critical CSS, JS budget
4. `knowledge-base/05_UX_Guidelines.md` — navigation, reading flow, article anatomy
5. `knowledge-base/04_Typography_System.md` — heading hierarchy, reading experience
6. `knowledge-base/07_Information_Architecture.md` — URL patterns, footer nav

## Rationale

Layouts are the skeleton every page inherits. A layout missing a `<link rel="canonical">`,
skip-to-content link, or `lang` attribute means every page on the site fails those checks.
This skill ensures layouts are born complete.

## Steps

### 1. HTML shell
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="theme-color" content="[brand-color]" />
  <meta name="color-scheme" content="light dark" />
  <!-- Title, meta description, canonical — from props -->
  <!-- OG tags, Twitter Card — from SEO component -->
  <!-- JSON-LD — from StructuredData component -->
  <!-- Font preloads -->
  <!-- Critical CSS inlined -->
</head>
<body>
  <a href="#main" class="skip-to-content">Skip to content</a>
  <header><!-- site nav --></header>
  <main id="main">
    <slot />
  </main>
  <footer><!-- minimal footer --></footer>
</body>
</html>
```

### 2. Required `<head>` elements
- [ ] `<meta charset="UTF-8">`
- [ ] `<meta name="viewport">`
- [ ] `<title>` — unique, ≤ 60 chars, from props
- [ ] `<meta name="description">` — unique, 140–160 chars, from props
- [ ] `<link rel="canonical">` — self-referencing
- [ ] OG tags (type, url, title, description, image, locale, site_name)
- [ ] Twitter Card tags
- [ ] `<meta name="theme-color">`
- [ ] `<meta name="color-scheme" content="light dark">`
- [ ] Font preload links (`<link rel="preload" as="font">`)
- [ ] `prefers-reduced-motion` global CSS

### 3. Semantic regions
- [ ] `<header>` with `<nav>`
- [ ] `<main id="main">`
- [ ] `<footer>`
- [ ] Skip-to-content link (first focusable element)

### 4. Template-specific additions

| Template | Extra requirements |
|----------|-------------------|
| Article | `<article>`, `<time>`, author byline, TOC slot, JSON-LD Article |
| Page | JSON-LD if applicable type |
| Index | Pagination, category filters |
| 404 | Search field, 3 recommended posts, 404 HTTP status |

### 5. Performance
- [ ] Critical CSS inlined
- [ ] No render-blocking scripts
- [ ] Font preloads for body + code fonts
- [ ] `font-display: swap` in @font-face

## Output

- Astro layout file(s)
- Reusable SEO component
- Reusable StructuredData component
- Reusable Navigation component
- Reusable Footer component
