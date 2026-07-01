export const CATEGORIES = [
  { slug: 'frontend', name: 'Frontend', description: 'UI, frameworks, and client-side architecture' },
  { slug: 'backend', name: 'Backend', description: 'APIs, databases, and server logic' },
  { slug: 'ai', name: 'AI & Data', description: 'Machine learning, agents, and data engineering' },
  { slug: 'architecture', name: 'Architecture', description: 'System design and scalable patterns' },
  { slug: 'tutorials', name: 'Tutorials', description: 'Step-by-step guides and how-tos' }
] as const;

export type CategorySlug = typeof CATEGORIES[number]['slug'];

export const TAGS = [
  { slug: 'astro', name: 'Astro', aliases: ['astrojs'] },
  { slug: 'react', name: 'React', aliases: ['reactjs'] },
  { slug: 'typescript', name: 'TypeScript', aliases: ['ts'] },
  { slug: 'css', name: 'CSS', aliases: ['styling'] },
  { slug: 'performance', name: 'Performance', aliases: ['perf'] },
  { slug: 'accessibility', name: 'Accessibility', aliases: ['a11y'] },
  { slug: 'architecture', name: 'Architecture', aliases: ['arch'] }
] as const;

export type TagSlug = typeof TAGS[number]['slug'];
