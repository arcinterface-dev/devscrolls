import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { unified } from '@astrojs/markdown-remark';
import { remarkReadingTime } from './remark-reading-time.mjs';

export default defineConfig({
  site: 'https://devscrolls.com',
  integrations: [sitemap()],
  markdown: {
    processor: unified({
      remarkPlugins: [remarkReadingTime],
      shikiConfig: {
        theme: 'github-dark',
      }
    })
  }
});
