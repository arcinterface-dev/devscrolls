import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const posts = await getCollection('articles', ({ data }) => {
    return !data.draft;
  });
  
  posts.sort((a, b) => b.data.publishDate.valueOf() - a.data.publishDate.valueOf());

  return rss({
    title: 'DevScrolls',
    description: 'Technical deep dives, software engineering, and design systems.',
    site: context.site,
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.publishDate,
      description: post.data.description,
      link: `/articles/${post.id}/`,
    })),
  });
}
