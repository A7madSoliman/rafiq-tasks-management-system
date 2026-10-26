'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import type { TaskDetails } from '../schemas/task-details-schema';
import { updateTaskResponseSchema, updateTaskSchema } from '../schemas/update-task-schema';
import type { TaskUpdateEvent } from '../types/task-update-event';

type Field = 'title' | 'description' | 'assignee_id' | 'epic_id' | 'due_date' | 'status';
type FieldValues = Partial<Record<Field, string>>;

function initialValue(task: TaskDetails | null, field: Field): string {
  if (!task) return '';
  switch (field) {
    case 'assignee_id':
      return task.assigneeId ?? '';
    case 'epic_id':
      return task.epic?.id ?? '';
    case 'due_date':
      return task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : '';
    default:
      return task[field] ?? '';
  }
}

function normalize(field: Field, raw: string) {
  if (field === 'title') return raw.trim();
  if (field === 'description') return raw.trim() || null;
  return field === 'status' ? raw : raw || null;
}

const failureMessage = 'Failed to update task. Please try again.';

// Owned by the dialog content, which is keyed by project/task and remounted on reopen.
export function useTaskUpdates(
  task: TaskDetails | null,
  onUpdated?: (event: TaskUpdateEvent) => void,
) {
  const router = useRouter();
  const [draft, setDraft] = useState<FieldValues>({});
  const [saving, setSaving] = useState<Partial<Record<Field, boolean>>>({});
  const [errors, setErrors] = useState<FieldValues>({});
  const [isClosing, setIsClosing] = useState(false);

  const draftRef = useRef<FieldValues>({});
  const confirmedRef = useRef<FieldValues>({});
  const pendingRef = useRef<Partial<Record<Field, Promise<boolean>>>>({});
  const closingRef = useRef(false);
  const generationRef = useRef(0);

  useEffect(() => {
    generationRef.current += 1;
    return () => {
      generationRef.current += 1;
    };
  }, [task?.projectId, task?.id]);

  function setField(field: Field, value: string) {
    draftRef.current[field] = value;
    setDraft((current) => ({ ...current, [field]: value }));
  }

  function change(field: 'title' | 'description', value: string) {
    if (!task?.canEdit || closingRef.current || pendingRef.current[field]) return;
    setField(field, value);
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function save(field: Field, selection?: string): Promise<boolean> {
    if (!task?.canEdit) return Promise.resolve(true);
    if (selection !== undefined && closingRef.current) return Promise.resolve(false);
    const pending = pendingRef.current[field];
    if (pending) return pending;

    const raw = selection ?? draftRef.current[field] ?? initialValue(task, field);
    const value = normalize(field, raw);
    const previous = confirmedRef.current[field] ?? initialValue(task, field);
    if (value === normalize(field, previous)) {
      setField(field, value ?? '');
      setErrors((current) => ({ ...current, [field]: undefined }));
      return Promise.resolve(true);
    }
    const parsed = updateTaskSchema.safeParse({ [field]: value });
    if (!parsed.success) {
      setErrors((current) => ({
        ...current,
        [field]: field === 'title' ? 'Title is required.' : 'Select a valid value.',
      }));
      return Promise.resolve(false);
    }
    if (field === 'due_date' && value && value < new Date().toISOString().slice(0, 10)) {
      setErrors((current) => ({ ...current, [field]: 'Due date cannot be before today.' }));
      return Promise.resolve(false);
    }

    setField(field, value ?? '');
    setErrors((current) => ({ ...current, [field]: undefined }));

    const generation = generationRef.current;
    const isActive = () => generationRef.current === generation;
    setSaving((current) => ({ ...current, [field]: true }));

    const request = (async () => {
      try {
        const response = await fetch(
          `/api/projects/${encodeURIComponent(task.projectId)}/tasks/${encodeURIComponent(task.id)}`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(parsed.data),
            cache: 'no-store',
          },
        );
        if (!isActive()) return false;
        if (response.status === 401) {
          router.replace('/login');
          router.refresh();
        }
        if (!response.ok) throw new Error(failureMessage);

        const body: unknown = await response.json();
        if (!isActive()) return false;
        const result = updateTaskResponseSchema.safeParse(body);
        if (
          !result.success ||
          result.data.task.id !== task.id ||
          result.data.task.project_id !== task.projectId ||
          (field === 'due_date' && value !== null
            ? result.data.task.due_date === null ||
              new Date(result.data.task.due_date).getTime() !==
                new Date(`${value}T00:00:00.000Z`).getTime()
            : result.data.task[field] !== value)
        )
          throw new Error(failureMessage);

        // A response may contain an older value for the other independently saved field.
        confirmedRef.current[field] = value ?? '';
        setField(field, value ?? '');
        toast.success('Task updated successfully.');
        onUpdated?.({
          projectId: task.projectId,
          taskId: task.id,
          changes: field === 'due_date' ? { due_date: result.data.task.due_date } : parsed.data,
        });
        return true;
      } catch {
        if (isActive()) {
          setField(field, previous ?? '');
          setErrors((current) => ({ ...current, [field]: failureMessage }));
          toast.error(failureMessage);
        }
        return false;
      } finally {
        delete pendingRef.current[field];
        if (isActive()) setSaving((current) => ({ ...current, [field]: false }));
      }
    })();
    pendingRef.current[field] = request;
    return request;
  }

  async function close(onClose: () => void) {
    if (closingRef.current) return;
    if (!task?.canEdit) {
      onClose();
      return;
    }
    closingRef.current = true;
    setIsClosing(true);
    const generation = generationRef.current;
    const results = await Promise.all([
      save('title'),
      save('description'),
      ...Object.values(pendingRef.current),
    ]);
    if (generationRef.current !== generation) return;
    if (results.every(Boolean)) onClose();
    closingRef.current = false;
    setIsClosing(false);
  }

  return {
    title: draft.title ?? task?.title ?? '',
    description: draft.description ?? task?.description ?? '',
    assigneeId: draft.assignee_id ?? initialValue(task, 'assignee_id'),
    epicId: draft.epic_id ?? initialValue(task, 'epic_id'),
    dueDate: draft.due_date ?? initialValue(task, 'due_date'),
    status: draft.status ?? initialValue(task, 'status'),
    saving,
    errors,
    isClosing,
    change,
    save,
    close,
  };
}
