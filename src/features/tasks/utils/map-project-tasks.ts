import { z } from 'zod';

import { createdTaskSchema, type CreatedTask } from '../schemas/created-task-schema';

const projectTaskSchema = createdTaskSchema
  .omit({
    assignee_id: true,
  })
  .extend({
    assignee: z
      .object({
        id: z.uuid().nullable(),
      })
      .nullish(),
  });

export function mapProjectTasks(value: unknown): CreatedTask[] | null {
  const result = z.array(projectTaskSchema).safeParse(value);

  if (!result.success) {
    return null;
  }

  return result.data.map(({ assignee, ...task }) => ({
    ...task,
    assignee_id: assignee?.id ?? null,
  }));
}
