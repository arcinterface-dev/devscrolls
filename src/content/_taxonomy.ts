export const CATEGORIES = [
  { slug: 'frontend', name: 'Frontend Scrolls', description: 'UI, frameworks, and client-side architecture' },
  { slug: 'backend', name: 'Backend Scrolls', description: 'APIs, databases, and server logic' },
  { slug: 'ai', name: 'AI Scrolls', description: 'Machine learning, agents, and data engineering' },
  { slug: 'architecture', name: 'Architecture Scrolls', description: 'System design and scalable patterns' },
  { slug: 'interviews', name: 'Interview Scrolls', description: 'Real-world technical interview breakdowns and questions' },
  { slug: 'tutorials', name: 'Tutorial Scrolls', description: 'Step-by-step guides and how-tos' }
] as const;

export type CategorySlug = typeof CATEGORIES[number]['slug'];

export const TAGS = [
  { slug: 'react', name: 'React', aliases: ['reactjs'] },
  { slug: 'typescript', name: 'TypeScript', aliases: ['ts'] },
  { slug: 'astro', name: 'Astro', aliases: ['astrojs'] },
  { slug: 'css', name: 'CSS', aliases: ['styling'] },
  { slug: 'performance', name: 'Performance', aliases: ['perf'] },
  { slug: 'accessibility', name: 'Accessibility', aliases: ['a11y'] },
  { slug: 'system-design', name: 'System Design', aliases: ['sysdesign'] }
] as const;

export type TagSlug = typeof TAGS[number]['slug'];
