import react from "@astrojs/react";
import tailwind from "@astrojs/tailwind";
import { defineConfig } from "astro/config";

export default defineConfig({
  integrations: [react(), tailwind()],
  output: "static", // Astro v5: static mode (hybrid merged into static in v5+)
  vite: {
    ssr: {
      noExternal: [
        "@react-three/fiber",
        "@react-three/drei",
        "three",
        "framer-motion",
      ],
    },
  },
});
