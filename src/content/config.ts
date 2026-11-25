import { defineCollection, z } from 'astro:content';

// One entry per page of the manual (src/content/manual/<slug>.mdx).
// `figures` lists the page's screen captures: `name` is the capture's slot, the file stem the
// capture script writes as <name>-light.png and <name>-dark.png; `caption` is shown under it.
// Place each one in the text with <Figure name="..." />.
const manual = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    order: z.number(),
    summary: z.string(),
    // The app step the page describes (1 Open ... 5 Export), drawn as a numbered disc.
    step: z.number().int().min(1).max(5).optional(),
    figures: z
      .array(
        z.object({
          name: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'slot names are lower-case words joined by -'),
          caption: z.string(),
        }),
      )
      .default([]),
  }),
});

export const collections = { manual };
