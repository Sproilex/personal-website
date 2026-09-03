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
        category: z.string().optional(),
        year: z.string().optional(),
        tags: z.string().array(),
        technologies: z.string().array(),
        image: z.string().optional(),
        caseStudyUrl: z.string().optional(),
    }),
});

export const collections = { projects };