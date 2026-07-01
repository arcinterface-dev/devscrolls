---
title: "Hello World: Building DevScrolls"
description: "A deep dive into the architectural decisions and design principles behind building this minimal, static-first platform."
publishDate: 2026-06-30
category: "tutorials"
tags: ["astro", "css", "performance"]
heroImage: "/hello-world-devscrolls-hero.svg"
heroImageAlt: "Isometric flowchart displaying Markdown files compiling through Astro into a static webpage layout"
draft: false
---

Welcome to DevScrolls. This is a living archive of my learnings in software engineering, architecture, and design systems.

## Why Astro?

When building this platform, the primary invariant was **performance**. The site needed to be exceptionally fast, which meant shipping zero JavaScript by default. Astro's island architecture allows us to keep the core reading experience completely static, while opting into interactivity only when necessary (like the theme toggle).

## The Design System

The design system is built on a few core principles:
1. **Content-First**: The content is the hero. The UI is just there to support it.
2. **Minimalism**: Every element must justify its existence.
3. **Semantic Tokens**: We don't use raw hex codes in our CSS. Everything maps to a semantic token (e.g., `var(--surface-base)` or `var(--text-primary)`).

### Typography

We use **Inter** for all sans-serif text and **JetBrains Mono** for code. Loading only two variable fonts keeps our payload small while offering tremendous flexibility in weights.

```typescript
// Example snippet
function greet(name: string): string {
  return `Hello, ${name}! Welcome to DevScrolls.`;
}
```

<aside class="callout callout-tip">
  <div class="callout-header">
    <span class="callout-icon" aria-hidden="true">💡</span>
    <strong class="callout-title">Tip</strong>
  </div>
  <div class="callout-body">
    Keep your color palettes constrained. A primary brand color, a contrasting accent, and a solid set of grays are all you need for 95% of interfaces.
  </div>
</aside>

## What's Next?

This is just the beginning. Over the next few months, expect deep dives into:
- Building resilient frontend architectures.
- The intricacies of CSS custom properties.
- My journey as a Full Stack Developer.

Stay tuned.
