import { z } from 'zod';

export const epicTaskSchema = z.object({
  id: z.uuid(),
  title: z.string(),
  assigneeName: z.string().nullable(),
  dueDate: z.iso.datetime({ offset: true }).nullable(),
});

export type EpicTask = z.infer<typeof epicTaskSchema>;
