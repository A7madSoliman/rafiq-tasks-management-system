import { z } from 'zod';

import { TASK_STATUSES } from '../constants/task-statuses';

export const createdTaskSchema = z.object({
  id: z.uuid(),
  task_id: z.string().nullable(),
  project_id: z.uuid(),
  title: z.string(),
  description: z.string().nullable(),
  epic_id: z.uuid().nullable(),
  assignee_id: z.uuid().nullable(),
  due_date: z.iso.datetime({ offset: true }).nullable(),
  status: z.enum(TASK_STATUSES.map((status) => status.value)),
});

export const createTaskResponseSchema = z.object({
  task: createdTaskSchema,
});

export type CreatedTask = z.infer<typeof createdTaskSchema>;
