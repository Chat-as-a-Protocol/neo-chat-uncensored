import node from "@astrojs/node";
import sitemap from "@astrojs/sitemap";
import tailwind from "@astrojs/tailwind";
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://noxai.chat",
  output: "server",
  adapter: node({
    mode: "standalone",
  }),
  integrations: [
    tailwind(),
    sitemap({
      // Apenas páginas públicas indexáveis; remove rotas privadas/de sessão.
      filter: (page) => {
        const path = new URL(page).pathname;
        const blocked = ["/account/", "/success/", "/login/", "/signup/", "/upgrade/"];
        return !path.startsWith("/auth/") && !blocked.includes(path);
      },
    }),
  ],
  devToolbar: {
    enabled: false,
  },
  vite: {
    build: {
      sourcemap: false, // Desativa mapeamento de código original no Chrome
      minify: "terser",
      terserOptions: {
        compress: {
          drop_console: true, // Remove console.logs no build de produção
        },
      },
    },
  },
  server: {
    host: process.env.HOST || "0.0.0.0",
    port: parseInt(process.env.PORT || "3000"),
  },
});
