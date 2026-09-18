import { z } from 'zod';

export const createProjectSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Project title is required.')
    .min(3, 'Project title must be at least 3 characters.')
    .max(100, 'Project title must not exceed 100 characters.'),

  description: z.string().max(500, 'Description must not exceed 500 characters.').optional(),
});

export type CreateProjectFormValues = z.infer<typeof createProjectSchema>;
