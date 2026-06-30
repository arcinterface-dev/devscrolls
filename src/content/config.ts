import { defineCollection, z } from 'astro:content';
import { CATEGORIES, TAGS } from './_taxonomy';

const categorySlugs = CATEGORIES.map((c) => c.slug) as [string, ...string[]];
const tagSlugs = TAGS.map((t) => t.slug) as [string, ...string[]];

const writingCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string().max(70, "Title must be 70 characters or less"),
    description: z.string().min(100).max(160, "Description should be between 100-160 characters for SEO"),
    publishDate: z.date(),
    updatedDate: z.date().optional(),
    category: z.enum(categorySlugs),
    tags: z.array(z.enum(tagSlugs)).max(5, "Maximum 5 tags allowed"),
    heroImage: z.string(),
    heroImageAlt: z.string().min(1, "Alt text is required for the hero image"),
    draft: z.boolean().default(true),
    canonical: z.string().url().optional(),
    series: z.string().optional(),
    seriesOrder: z.number().optional()
  })
});

export const collections = {
  'writing': writingCollection
};
