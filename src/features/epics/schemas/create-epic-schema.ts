import { z } from 'zod';

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

function getTodayLocalDate() {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export const createEpicSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Title is required.')
    .min(3, 'Title must be at least 3 characters.'),

  description: z
    .string()
    .trim()
    .max(500, 'Description must be 500 characters or fewer.')
    .optional(),

  assigneeId: z.union([z.literal(''), z.string().uuid('Invalid assignee.')]).optional(),

  deadline: z
    .string()
    .trim()
    .refine((value) => value === '' || datePattern.test(value), 'Enter a valid deadline.')
    .refine(
      (value) => value === '' || value >= getTodayLocalDate(),
      'Deadline cannot be before today.',
    )
    .optional(),
});

export type CreateEpicFormValues = z.infer<typeof createEpicSchema>;
