import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { unified } from '@astrojs/markdown-remark';
import { remarkReadingTime } from './remark-reading-time.mjs';

import react from '@astrojs/react';

export default defineConfig({
  site: 'https://devscrolls.dev',
  integrations: [sitemap(), react()],
  markdown: {
    processor: unified({
      remarkPlugins: [remarkReadingTime],
      shikiConfig: {
        theme: 'github-dark',
      }
    })
  }
});