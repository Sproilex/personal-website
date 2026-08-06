import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const projects = defineCollection({
    loader: glob({ base: './src/content/projects', pattern: '**/*.md' }),
    schema: z.object({
        title: z.string(),
        description: z.string(),
        role: z.string(),
        company: z.string(),
        type: z.string(),
        tags: z.string().array(),
        technologies: z.string().array(),
    }),
});

export const collections = { projects };