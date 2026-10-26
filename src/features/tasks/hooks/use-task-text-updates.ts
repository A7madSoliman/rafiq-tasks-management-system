'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import type { TaskDetails } from '../schemas/task-details-schema';
import { updateTaskResponseSchema, updateTaskSchema } from '../schemas/update-task-schema';

type TextField = 'title' | 'description';
type TextValues = Partial<Record<TextField, string>>;

const failureMessage = 'Failed to update task. Please try again.';

// Owned by the dialog content, which is keyed by project/task and remounted on reopen.
export function useTaskTextUpdates(task: TaskDetails | null) {
  const router = useRouter();
  const [draft, setDraft] = useState<TextValues>({});
  const [saving, setSaving] = useState<Partial<Record<TextField, boolean>>>({});
  const [errors, setErrors] = useState<TextValues>({});
  const [isClosing, setIsClosing] = useState(false);

  const draftRef = useRef<TextValues>({});
  const confirmedRef = useRef<Partial<Record<TextField, string | null>>>({});
  const pendingRef = useRef<Partial<Record<TextField, Promise<boolean>>>>({});
  const closingRef = useRef(false);
  const generationRef = useRef(0);

  useEffect(() => {
    generationRef.current += 1;
    return () => {
      generationRef.current += 1;
    };
  }, [task?.projectId, task?.id]);

  function setField(field: TextField, value: string) {
    draftRef.current[field] = value;
    setDraft((current) => ({ ...current, [field]: value }));
  }

  function change(field: TextField, value: string) {
    if (!task?.canEdit || closingRef.current || pendingRef.current[field]) return;
    setField(field, value);
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function save(field: TextField): Promise<boolean> {
    if (!task?.canEdit) return Promise.resolve(true);
    const pending = pendingRef.current[field];
    if (pending) return pending;

    const raw = draftRef.current[field] ?? task[field] ?? '';
    const value = field === 'title' ? raw.trim() : raw.trim() || null;
    const parsed = updateTaskSchema.safeParse({ [field]: value });
    if (!parsed.success) {
      setErrors((current) => ({ ...current, [field]: 'Title is required.' }));
      return Promise.resolve(false);
    }

    const previous =
      confirmedRef.current[field] !== undefined ? confirmedRef.current[field] : task[field];
    setField(field, value ?? '');
    setErrors((current) => ({ ...current, [field]: undefined }));
    if (value === (field === 'title' ? previous?.trim() : previous?.trim() || null)) {
      return Promise.resolve(true);
    }

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
          result.data.task[field] !== value
        )
          throw new Error(failureMessage);

        // A response may contain an older value for the other independently saved field.
        confirmedRef.current[field] = value;
        setField(field, value ?? '');
        toast.success('Task updated successfully.');
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
    const results = await Promise.all([save('title'), save('description')]);
    if (generationRef.current !== generation) return;
    if (results.every(Boolean)) onClose();
    closingRef.current = false;
    setIsClosing(false);
  }

  return {
    title: draft.title ?? task?.title ?? '',
    description: draft.description ?? task?.description ?? '',
    saving,
    errors,
    isClosing,
    change,
    save,
    close,
  };
}
