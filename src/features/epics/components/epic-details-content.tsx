'use client';

import { useState, type ReactNode } from 'react';
import type { ProjectEpic } from '../types/project-epic';
import { formatEpicDetailsDate } from '../utils/format-epic-details-date';
import DateIcon from '@/assets/icons/epics/details/date.svg';
import { EpicTasks } from './epic-tasks';
import { useProjectMembers } from '@/features/projects/hooks/use-project-members';
import { toast } from 'sonner';
import { getTodayLocalDate } from '../utils/get-today-local-date';

type EpicDetailsContentProps = {
  taskRefreshRevision?: number;
  epic: ProjectEpic;
  onAddTask: () => void;
  description: string;
  onDescriptionChange: (value: string) => void;
  onDescriptionBlur: () => void;
  isSaving: boolean;
  onAssigneeSaved: (epicId: string, assignee: ProjectEpic['assignee']) => void;
  onDeadlineSaved: (epicId: string, deadline: ProjectEpic['deadline']) => void;
  onTaskClick: (taskId: string) => void;
};

type EpicMetaItemProps = {
  label: string;
  children: ReactNode;
};

function getInitials(name: string): string {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');

  return initials || '—';
}

function EpicMetaItem({ label, children }: EpicMetaItemProps) {
  return (
    <div className="flex min-w-0 flex-col gap-1 md:gap-2">
      <p className="text-foreground/40 text-[10px] leading-[15px] font-bold uppercase">{label}</p>

      <div className="border-surface-highest flex min-h-9 items-center rounded-md border px-2 py-1 md:min-h-10 md:p-2">
        {children}
      </div>
    </div>
  );
}

function EpicUserValue({ name }: { name: string }) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <span
        aria-hidden="true"
        className="bg-surface-highest text-foreground-muted flex size-6 shrink-0 items-center justify-center rounded-[12px] text-[10px] leading-[15px] font-bold"
      >
        {getInitials(name)}
      </span>

      <span className="text-foreground truncate text-xs leading-4 font-medium md:text-sm md:leading-5">
        {name}
      </span>
    </div>
  );
}

export function EpicDetailsContent({
  taskRefreshRevision,
  epic,
  onAddTask,
  description,
  onDescriptionChange,
  onDescriptionBlur,
  onAssigneeSaved,
  onDeadlineSaved,
  isSaving,
  onTaskClick,
}: EpicDetailsContentProps) {
  const { members, status: membersStatus, retry } = useProjectMembers(epic.projectId);
  const [assigneeId, setAssigneeId] = useState(epic.assignee?.userId ?? '');
  const [deadline, setDeadline] = useState(epic.deadline?.slice(0, 10) ?? '');
  const [isSavingDeadline, setIsSavingDeadline] = useState(false);
  const [isSavingAssignee, setIsSavingAssignee] = useState(false);

  async function handleAssigneeChange(nextAssigneeId: string) {
    if (isSavingAssignee || nextAssigneeId === assigneeId) return;

    const previousAssigneeId = assigneeId;

    // Update UI immediately.
    setAssigneeId(nextAssigneeId);
    setIsSavingAssignee(true);

    try {
      const response = await fetch(
        `/api/projects/${encodeURIComponent(epic.projectId)}/epics/${encodeURIComponent(epic.id)}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            assignee_id: nextAssigneeId || null,
          }),
        },
      );

      if (!response.ok) {
        throw new Error('Failed to update assignee.');
      }

      const selectedMember = members.find((member) => member.userId === nextAssigneeId);

      onAssigneeSaved(
        epic.id,
        selectedMember
          ? {
              userId: selectedMember.userId,
              name: selectedMember.name,
            }
          : null,
      );

      toast.success('Epic assignee updated successfully.');
    } catch {
      setAssigneeId(previousAssigneeId);
      toast.error('Failed to update epic assignee.');
    } finally {
      setIsSavingAssignee(false);
    }
  }

  async function handleDeadlineChange(nextDeadline: string) {
    if (isSavingDeadline || nextDeadline === deadline) return;

    if (nextDeadline && nextDeadline < getTodayLocalDate()) {
      toast.error('Deadline cannot be before today.');
      return;
    }

    const previousDeadline = deadline;

    setDeadline(nextDeadline);
    setIsSavingDeadline(true);

    try {
      const response = await fetch(
        `/api/projects/${encodeURIComponent(epic.projectId)}/epics/${encodeURIComponent(epic.id)}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            deadline: nextDeadline || null,
          }),
        },
      );

      if (!response.ok) {
        throw new Error('Failed to update deadline.');
      }

      onDeadlineSaved(epic.id, nextDeadline || null);
      toast.success('Epic deadline updated successfully.');
    } catch {
      setDeadline(previousDeadline);
      toast.error('Failed to update epic deadline.');
    } finally {
      setIsSavingDeadline(false);
    }
  }
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] md:flex-none md:gap-8 md:px-8 md:pt-8 md:pb-8">
      <div className="border-outline/50 md:border-surface-highest min-h-[80px] shrink-0 rounded-md border p-2 md:min-h-[150px] md:rounded-[12px] md:p-3">
        <textarea
          aria-label="Epic description"
          placeholder="No description provided"
          value={description}
          maxLength={500}
          disabled={isSaving}
          onChange={(event) => onDescriptionChange(event.target.value)}
          onBlur={onDescriptionBlur}
          className="text-foreground placeholder:text-foreground-muted min-h-[62px] w-full resize-none bg-transparent text-xs leading-[18px] outline-none md:min-h-[124px] md:text-base md:leading-[26px]"
        />
      </div>
      <div className="grid shrink-0 grid-cols-1 gap-2 md:grid-cols-2 md:gap-4">
        <EpicMetaItem label="Assignee">
          {membersStatus === 'error' ? (
            <button type="button" onClick={retry} className="text-primary text-xs">
              Retry loading members
            </button>
          ) : (
            <select
              aria-label="Epic assignee"
              value={assigneeId}
              disabled={isSaving || isSavingAssignee || membersStatus !== 'success'}
              onChange={(event) => void handleAssigneeChange(event.target.value)}
              className="text-foreground w-full min-w-0 bg-transparent text-sm outline-none disabled:opacity-60"
            >
              <option value="">Unassigned</option>

              {members.map((member) => (
                <option key={member.userId} value={member.userId}>
                  {member.name}
                </option>
              ))}
            </select>
          )}
        </EpicMetaItem>

        <EpicMetaItem label="Deadline">
          <div className="flex w-full min-w-0 items-center gap-2">
            <DateIcon aria-hidden="true" />

            <input
              type="date"
              aria-label="Epic deadline"
              value={deadline}
              min={getTodayLocalDate()}
              disabled={isSaving || isSavingDeadline}
              onChange={(event) => void handleDeadlineChange(event.target.value)}
              className="text-foreground w-full min-w-0 bg-transparent text-xs outline-none disabled:opacity-60 md:text-sm"
            />
          </div>
        </EpicMetaItem>

        <EpicMetaItem label="Created By">
          <EpicUserValue name={epic.createdBy.name} />
        </EpicMetaItem>

        <EpicMetaItem label="Created At">
          <div className="flex min-w-0 items-center gap-2">
            <DateIcon aria-hidden="true" />

            <span className="text-foreground truncate text-xs leading-4 font-medium md:text-sm md:leading-5">
              {formatEpicDetailsDate(epic.createdAt)}
            </span>
          </div>
        </EpicMetaItem>
      </div>
      <EpicTasks
        refreshRevision={taskRefreshRevision}
        projectId={epic.projectId}
        epicId={epic.id}
        onAddTask={onAddTask}
        onTaskClick={onTaskClick}
      />
    </div>
  );
}
