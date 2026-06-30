export const CATEGORIES = [
  { slug: 'engineering', name: 'Engineering', description: 'Technical deep dives and tutorials' },
  { slug: 'design-systems', name: 'Design Systems', description: 'Component architecture and tokens' },
  { slug: 'ai', name: 'AI', description: 'Experiments with agentic coding and LLMs' },
  { slug: 'career', name: 'Career', description: 'Thoughts on the software industry' },
  { slug: 'tools', name: 'Tools', description: 'Workflows, editors, and CLIs' },
  { slug: 'process', name: 'Process', description: 'Methodologies and teamwork' },
  { slug: 'notes', name: 'Notes', description: 'Short-form TILs and streams' }
] as const;

export type CategorySlug = typeof CATEGORIES[number]['slug'];

export const TAGS = [
  { slug: 'astro', name: 'Astro', aliases: ['astrojs'] },
  { slug: 'react', name: 'React', aliases: ['reactjs'] },
  { slug: 'typescript', name: 'TypeScript', aliases: ['ts'] },
  { slug: 'css', name: 'CSS', aliases: ['styling'] },
  { slug: 'performance', name: 'Performance', aliases: ['perf'] },
  { slug: 'accessibility', name: 'Accessibility', aliases: ['a11y'] }
] as const;

export type TagSlug = typeof TAGS[number]['slug'];
