import { glob } from "astro/loaders";
import { defineCollection } from "astro:content";
import { z } from "astro/zod";

const legal = defineCollection({
  loader: glob({ pattern: "**/[^_]*.{md,mdx}", base: "./src/content/legal" }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    lastUpdated: z.coerce.date().optional(),
  }),
});

export const collections = { legal };
