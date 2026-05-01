import tailwind from "@astrojs/tailwind";
import node from "@astrojs/node";
import { defineConfig } from "astro/config";

export default defineConfig({
  output: 'server',
  adapter: node({
    mode: 'standalone'
  }),
  integrations: [tailwind()],
  devToolbar: {
    enabled: false
  },
  server: {
    host: process.env.HOST || '0.0.0.0',
    port: parseInt(process.env.PORT || '3000')
  }
});
