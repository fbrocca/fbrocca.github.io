import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://www.fabiobrocca.tech',
  integrations: [
    sitemap({
      // unlisted pages stay out of the sitemap
      filter: (page) => !page.includes('/invest'),
    }),
  ],
});
