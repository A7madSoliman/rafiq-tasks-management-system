import { z } from 'zod';

const titleUpdate = z.object({
  title: z.string().trim().min(1, 'Title is required.'),
}).strict();

const descriptionUpdate = z.object({
  description: z.string().trim().max(500, 'Description must be 500 characters or fewer.')
    .transform((value) => value || null).nullable(),
}).strict();

const assigneeUpdate = z.object({
  assignee_id: z.string().uuid('Invalid assignee.').nullable(),
}).strict();

const deadlineUpdate = z.object({
  deadline: z.iso.date().nullable(),
}).strict();

// Independent field updates; reject empty or mixed-field payloads.
export const editEpicFieldSchema = z.union([
  titleUpdate,
  descriptionUpdate,
  assigneeUpdate,
  deadlineUpdate,
]);
