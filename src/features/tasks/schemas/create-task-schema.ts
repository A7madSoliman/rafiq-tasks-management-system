import { z } from 'zod';

import { TASK_STATUSES } from '../constants/task-statuses';

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

function isValidDate(value: string): boolean {
  if (!datePattern.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00Z`);

  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export const createTaskSchema = z.object({
  title: z.string().trim().min(1, 'Title is required.'),

  description: z.string().trim(),

  epicId: z.union([z.literal(''), z.string().uuid('Invalid epic.')]),

  assigneeId: z.union([z.literal(''), z.string().uuid('Invalid assignee.')]),

  status: z.enum(TASK_STATUSES.map((status) => status.value)),

  dueDate: z
    .string()
    .refine((value) => value === '' || isValidDate(value), 'Select a valid due date.'),
});

export type CreateTaskFormValues = z.infer<typeof createTaskSchema>;
