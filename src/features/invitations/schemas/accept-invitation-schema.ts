import { z } from 'zod';

export const acceptInvitationSchema = z.object({
  token: z
    .string()
    .min(1, 'Invitation token is required.')
    .max(2048, 'Invalid invitation token.')
    .regex(/^\S+$/, 'Invalid invitation token.'),
});

export type AcceptInvitationValues = z.infer<typeof acceptInvitationSchema>;
