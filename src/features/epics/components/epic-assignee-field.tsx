'use client';

import type { UseFormRegister } from 'react-hook-form';

import ChevronDownIcon from '@/assets/icons/forms/chevron-down.svg';
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
    <div className="flex flex-col gap-2 lg:gap-4">
      <FieldLabel
        htmlFor="assigneeId"
        className="text-foreground-secondary text-[11px] leading-[16.5px] font-bold tracking-[1.1px] uppercase"
      >
        Assignee
      </FieldLabel>

      <div className="relative">
        <select
          id="assigneeId"
          disabled={selectDisabled}
          aria-invalid={Boolean(errorMessage)}
          className="bg-surface-highest text-foreground h-12 w-full appearance-none rounded-xs px-4 pr-10 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-60"
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

        <ChevronDownIcon
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2"
        />
      </div>

      {status === 'error' && (
        <button type="button" onClick={retry} className="text-primary w-fit text-xs font-medium">
          Retry loading members
        </button>
      )}

      {errorMessage && <p className="text-error text-[11px] leading-[16.5px]">{errorMessage}</p>}
    </div>
  );
}
