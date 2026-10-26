import { z } from 'zod';

export const taskDetailsSchema = z.object({
  id: z.uuid(),
  projectId: z.uuid(),
  taskCode: z.string().nullable(),
  title: z.string(),
  description: z.string().nullable(),
  status: z.string(),
  epic: z
    .object({
      id: z.uuid(),
      code: z.string().nullable(),
      title: z.string().nullable(),
    })
    .nullable(),
  assigneeName: z.string().nullable(),
  assigneeId: z.uuid().nullable(),
  canEdit: z.boolean(),
  createdByName: z.string().nullable(),
  dueDate: z.iso.datetime({ offset: true }).nullable(),
  createdAt: z.iso.datetime({ offset: true }).nullable(),
});

export type TaskDetails = z.infer<typeof taskDetailsSchema>;
