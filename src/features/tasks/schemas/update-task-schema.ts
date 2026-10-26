import { z } from 'zod';

import { TASK_STATUSES } from '../constants/task-statuses';

export const updateTaskSchema = z
  .object({
    title: z.string().trim().min(1, 'Title is required.').optional(),
    description: z
      .string()
      .trim()
      .transform((value) => value || null)
      .nullable()
      .optional(),
    assignee_id: z.uuid().nullable().optional(),
    due_date: z.iso.date().nullable().optional(),
    epic_id: z.uuid().nullable().optional(),
    status: z.enum(TASK_STATUSES.map((status) => status.value)).optional(),
  })
  .strict()
  .refine((value) => Object.values(value).some((field) => field !== undefined), {
    message: 'At least one task field is required.',
  });

export type UpdateTask = z.infer<typeof updateTaskSchema>;

// Read persisted rows without rejecting legacy titles or unknown display statuses.
export const updatedTaskSchema = z.object({
  id: z.uuid(),
  project_id: z.uuid(),
  task_id: z.string().nullable(),
  title: z.string().nullable(),
  description: z.string().nullable(),
  assignee_id: z.uuid().nullable(),
  due_date: z.iso.datetime({ offset: true }).nullable(),
  epic_id: z.uuid().nullable(),
  status: z.string().min(1),
});

export const updateTaskResponseSchema = z.object({ task: updatedTaskSchema });
