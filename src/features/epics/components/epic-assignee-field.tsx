'use client';

import type { UseFormRegister } from 'react-hook-form';
import { FieldLabel } from '@/components/ui/field-label';
import { useProjectMembers } from '@/features/projects/hooks/use-project-members';
import type { CreateEpicFormValues } from '../schemas/create-epic-schema';

type EpicAssigneeFieldProps = {
  projectId: string;
  register: UseFormRegister<CreateEpicFormValues>;
  errorMessage?: string;
  disabled?: boolean;
};

export function EpicAssigneeField({
  projectId,
  register,
  errorMessage,
  disabled = false,
}: EpicAssigneeFieldProps) {
  const { members, status, retry } = useProjectMembers(projectId);

  const selectDisabled = disabled || status !== 'success' || members.length === 0;

  return (
    <div>
      <FieldLabel htmlFor="assigneeId">Assignee</FieldLabel>

      <select
        id="assigneeId"
        disabled={selectDisabled}
        aria-invalid={Boolean(errorMessage)}
        className="bg-surface-highest text-foreground h-12 w-full rounded-xs px-4 outline-none disabled:cursor-not-allowed disabled:opacity-60"
        {...register('assigneeId')}
      >
        <option value="">
          {status === 'loading'
            ? 'Loading members...'
            : status === 'error'
              ? 'Unable to load members'
              : members.length === 0
                ? 'No members available'
                : 'Select a member...'}
        </option>

        {status === 'success' &&
          members.map((member) => (
            <option key={member.id} value={member.userId}>
              {member.name} — {member.email}
            </option>
          ))}
      </select>

      {status === 'error' && (
        <button type="button" onClick={retry} className="text-primary mt-2 text-xs font-medium">
          Retry loading members
        </button>
      )}

      {errorMessage && <p className="text-error text-xs">{errorMessage}</p>}
    </div>
  );
}
