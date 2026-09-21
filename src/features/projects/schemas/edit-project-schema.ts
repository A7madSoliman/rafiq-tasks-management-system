import { z } from 'zod';

import { projectDescriptionSchema, projectNameSchema } from './project-fields-schema';

export const editProjectSchema = z.object({
  name: projectNameSchema,
  description: projectDescriptionSchema,
});

export type EditProjectFormValues = z.infer<typeof editProjectSchema>;
