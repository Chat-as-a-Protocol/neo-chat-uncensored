import node from "@astrojs/node";
import tailwind from "@astrojs/tailwind";
import { defineConfig } from "astro/config";

export default defineConfig({
  output: "server",
  adapter: node({
    mode: "standalone",
  }),
  integrations: [tailwind()],
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
