import rss from '@astrojs/rss';
import { getCollection, render } from 'astro:content';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';

const SITE_URL = 'https://devscrolls.dev';

/**
 * Converts relative URLs in rendered HTML to absolute URLs so the RSS feed
 * works correctly in external readers (dev.to, Feedly, etc.).
 *
 * Handles:
 * - src="/..."  → src="https://devscrolls.dev/..."
 * - href="/..." → href="https://devscrolls.dev/..."
 * - srcset="/..." patterns
 */
function absolutifyUrls(html, siteUrl) {
  return html
    .replace(/(src|href|poster)="\/(?!\/)/g, `$1="${siteUrl}/`)
    .replace(/srcset="([^"]*)"/g, (match, srcset) => {
      const fixed = srcset.replace(/(^|,\s*)\/(?!\/)/g, `$1${siteUrl}/`);
      return `srcset="${fixed}"`;
    });
}

/**
 * Builds the full HTML content for an RSS item:
 * 1. Prepends the hero image (if present) as a full-width <img>
 * 2. Absolutifies all relative URLs in the rendered article HTML
 */
function buildRssContent(renderedHtml, post, siteUrl) {
  let content = '';

  // Prepend hero image so dev.to / RSS readers show a cover
  if (post.data.heroImage) {
    const heroSrc = `${siteUrl}${post.data.heroImage}`;
    const heroAlt = post.data.heroImageAlt || post.data.title;
    content += `<img src="${heroSrc}" alt="${heroAlt}" width="960" />\n`;
  }

  content += absolutifyUrls(renderedHtml, siteUrl);

  return content;
}

export async function GET(context) {
  const posts = await getCollection('articles', ({ data }) => {
    return !data.draft;
  });

  posts.sort((a, b) => b.data.publishDate.valueOf() - a.data.publishDate.valueOf());

  // Create a container to render Content components to HTML strings
  const container = await AstroContainer.create();

  const items = await Promise.all(
    posts.map(async (post) => {
      const { Content } = await render(post);
      const rawHtml = await container.renderToString(Content);
      const content = buildRssContent(rawHtml, post, SITE_URL);

      return {
        title: post.data.title,
        pubDate: post.data.publishDate,
        description: post.data.description,
        link: `/articles/${post.id}/`,
        content,
      };
    })
  );

  return rss({
    title: 'DevScrolls',
    description: 'Technical deep dives, software engineering, and design systems.',
    site: context.site,
    items,
  });
}
