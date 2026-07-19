import node from '@astrojs/node';
import sitemap from '@astrojs/sitemap';
import tailwind from '@astrojs/tailwind';
import { defineConfig } from 'astro/config';

const port = Number.parseInt(process.env.PORT ?? '3000', 10);

export default defineConfig({
  site: 'https://noxai.chat',

  output: 'server',

  adapter: node({
    mode: 'standalone',
  }),

  integrations: [
    tailwind(),

    sitemap({
      filter: (page) => {
        const { pathname } = new URL(page);

        const blockedRoutes = [
          '/account/',
          '/success/',
          '/login/',
          '/signup/',
          '/upgrade/',
        ];

        return (
          !pathname.startsWith('/auth/') && !blockedRoutes.includes(pathname)
        );
      },
    }),
  ],

  devToolbar: {
    enabled: false,
  },

  vite: {
    build: {
      sourcemap: false,
      minify: 'terser',

      terserOptions: {
        compress: {
          drop_console: true,
        },
      },
    },
  },

  server: {
    host: process.env.HOST ?? '0.0.0.0',
    port: Number.parseInt((process.env.ASTRO_PORT = 4321), 10),
  },
});
