'use client';

import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import CloseIcon from '@/assets/icons/navigation/close.svg';
import CopyLinkIcon from '@/assets/icons/epics/details/copy-link.svg';
import EpicIcon from '@/assets/icons/epics/details/epic.svg';
import type { ProjectEpic } from '../types/project-epic';
import { EpicDetailsContent } from './epic-details-content';

type EpicDetailsModalProps = {
  isOpen: boolean;
  epic: ProjectEpic | null;
  status: 'loading' | 'success' | 'error';
  errorMessage: string | null;
  onClose: () => void;
  onAddTask: (epicId: string) => void;
  onTitleSaved: (epicId: string, title: string) => void;
  onAssigneeSaved: (epicId: string, assignee: ProjectEpic['assignee']) => void;
  onDeadlineSaved: (epicId: string, deadline: ProjectEpic['deadline']) => void;
  onTaskClick: (taskId: string) => void;
  isTaskDetailsOpen: boolean;
};

type Field = 'title' | 'description';

type Values = {
  title: string;
  description: string;
};

export function EpicDetailsModal(props: EpicDetailsModalProps) {
  if (!props.isOpen) return null;

  // Remount the editor when switching epics or reopening the modal.
  return <EpicDetailsModalContent key={props.epic?.id ?? 'loading'} {...props} />;
}

function EpicDetailsModalContent({
  epic,
  status,
  errorMessage,
  onClose,
  onAddTask,
  onTitleSaved,
  onAssigneeSaved,
  onDeadlineSaved,
  onTaskClick,
  isTaskDetailsOpen,
}: EpicDetailsModalProps) {
  const initialValues: Values = {
    title: epic?.title ?? '',
    description: epic?.description ?? '',
  };

  const [draft, setDraft] = useState(initialValues);
  const [saved, setSaved] = useState(initialValues);
  const [isSaving, setIsSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLDialogElement>(null);
  const skipAutoSaveRef = useRef(false);
  const savingRef = useRef(false);

  const titleChanged = draft.title.trim() !== saved.title.trim();

  const descriptionChanged =
    (draft.description.trim() || null) !== (saved.description.trim() || null);

  const hasChanges = titleChanged || descriptionChanged;

  function updateField(field: Field, value: string) {
    setDraft((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function patchEpic(payload: { title: string } | { description: string | null }) {
    if (!epic) throw new Error('Epic not found');

    const response = await fetch(
      `/api/projects/${encodeURIComponent(epic.projectId)}/epics/${encodeURIComponent(epic.id)}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
    );

    if (!response.ok) {
      throw new Error('Failed to update epic');
    }
  }

  async function save(field?: Field): Promise<boolean> {
    if (!epic || savingRef.current) return false;

    const nextTitle = draft.title.trim();
    const nextDescription = draft.description.trim() || null;

    const saveTitle = field !== 'description' && titleChanged;
    const saveDescription = field !== 'title' && descriptionChanged;

    if (saveTitle && !nextTitle) {
      toast.error('Epic title cannot be empty.');

      if (!confirmOpen) {
        setDraft((current) => ({ ...current, title: saved.title }));
      }

      return false;
    }

    if (!saveTitle && !saveDescription) return true;

    savingRef.current = true;
    setIsSaving(true);

    let activeField: Field = 'title';

    try {
      if (saveTitle) {
        activeField = 'title';

        await patchEpic({ title: nextTitle });

        setSaved((current) => ({
          ...current,
          title: nextTitle,
        }));

        setDraft((current) => ({
          ...current,
          title: nextTitle,
        }));

        onTitleSaved(epic.id, nextTitle);
      }

      if (saveDescription) {
        activeField = 'description';

        await patchEpic({ description: nextDescription });

        setSaved((current) => ({
          ...current,
          description: nextDescription ?? '',
        }));

        setDraft((current) => ({
          ...current,
          description: nextDescription ?? '',
        }));
      }

      toast.success('Epic updated successfully.');
      return true;
    } catch {
      setDraft((current) => ({
        ...current,
        [activeField]: saved[activeField],
      }));

      toast.error('Failed to update epic. Please try again.');
      return false;
    } finally {
      savingRef.current = false;
      setIsSaving(false);
    }
  }

  function saveOnBlur(field: Field) {
    if (skipAutoSaveRef.current) return;
    void save(field);
  }

  function requestClose() {
    if (savingRef.current) return;

    skipAutoSaveRef.current = true;

    if (hasChanges) {
      setConfirmOpen(true);
      return;
    }

    onClose();
  }

  function handleTaskClick(taskId: string) {
    if (savingRef.current || confirmOpen) return;

    onTaskClick(taskId);
  }

  function keepEditing() {
    skipAutoSaveRef.current = false;
    setConfirmOpen(false);
  }

  async function confirmSave() {
    const success = await save();

    if (success) onClose();
  }

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previousFocus =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, []);

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key !== 'Escape' || confirmOpen || isTaskDetailsOpen) {
        return;
      }

      event.preventDefault();
      requestClose();
    }

    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  });

  useEffect(() => {
    const dialog = confirmRef.current;

    if (!dialog) return;

    if (confirmOpen && !dialog.open) {
      dialog.showModal();
    } else if (!confirmOpen && dialog.open) {
      dialog.close();
    }
  }, [confirmOpen]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center md:p-6">
      <div className="absolute inset-0 bg-black/40" aria-hidden="true" />

      <section
        role="dialog"
        aria-label="Epic details"
        inert={isTaskDetailsOpen}
        aria-modal={!isTaskDetailsOpen}
        className="bg-surface relative z-10 flex h-[91dvh] max-h-[calc(100dvh-12px)] w-full flex-col overflow-hidden rounded-t-[24px] shadow-[0_-4px_12px_rgba(4,27,60,0.06)] md:h-auto md:max-h-[calc(100dvh-48px)] md:max-w-[672px] md:rounded-md md:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)]"
      >
        <div
          aria-hidden="true"
          className="bg-outline/30 mx-auto mt-4 h-1 w-10 shrink-0 rounded-full md:hidden"
        />

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain md:block">
          <div className="shrink-0 px-4 pt-3 md:px-8 md:pt-8">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                {status === 'success' && epic ? (
                  <div className="flex min-w-0 items-center gap-2">
                    <EpicIcon aria-hidden="true" />
                    <p className="text-foreground/60 truncate text-[11px] leading-4 font-bold tracking-[0.6px] uppercase md:text-xs">
                      {epic.epicId}
                    </p>
                  </div>
                ) : (
                  <p className="text-foreground/60 text-[11px] leading-4 font-bold tracking-[0.6px] uppercase md:text-xs">
                    Epic Details
                  </p>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-3">
                <div className="text-foreground-secondary flex items-center gap-1 rounded-xs p-1.5 text-[11px] leading-4 font-medium md:gap-2 md:px-3 md:py-1.5 md:text-sm md:leading-5">
                  <CopyLinkIcon aria-hidden="true" />
                  <span>Copy link</span>
                </div>

                <button
                  ref={closeButtonRef}
                  type="button"
                  disabled={isSaving}
                  onPointerDownCapture={() => {
                    skipAutoSaveRef.current = true;
                  }}
                  onPointerCancel={() => {
                    skipAutoSaveRef.current = false;
                  }}
                  onClick={requestClose}
                  aria-label="Close epic details"
                  className="flex size-[30px] shrink-0 cursor-pointer items-center justify-center rounded-[12px] disabled:opacity-50"
                >
                  <CloseIcon aria-hidden="true" />
                </button>
              </div>
            </div>

            {status === 'success' && epic && (
              <div className="border-outline/50 md:border-surface-highest mt-2 rounded-md border p-2 md:mt-4 md:rounded-[12px] md:p-3">
                <input
                  type="text"
                  aria-label="Epic title"
                  value={draft.title}
                  disabled={isSaving}
                  onChange={(event) => updateField('title', event.target.value)}
                  onBlur={() => saveOnBlur('title')}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.currentTarget.blur();
                    }
                  }}
                  className="text-foreground w-full bg-transparent text-[13px] leading-5 font-semibold outline-none md:text-xl md:leading-8 md:font-bold"
                />
              </div>
            )}
          </div>

          {status === 'loading' && (
            <div className="px-6 py-8 md:px-8">
              <p role="status" className="text-foreground-muted text-sm">
                Loading epic details...
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="px-6 py-8 md:px-8">
              <p role="alert" className="text-error text-sm">
                {errorMessage ?? 'Unable to load epic details.'}
              </p>
            </div>
          )}

          {status === 'success' && epic && (
            <EpicDetailsContent
              epic={epic}
              onAddTask={() => onAddTask(epic.id)}
              description={draft.description}
              onDescriptionChange={(value) => updateField('description', value)}
              onDescriptionBlur={() => saveOnBlur('description')}
              isSaving={isSaving}
              onAssigneeSaved={onAssigneeSaved}
              onDeadlineSaved={onDeadlineSaved}
              onTaskClick={handleTaskClick}
            />
          )}
        </div>
      </section>

      <dialog
        ref={confirmRef}
        aria-labelledby="confirm-epic-title"
        style={{ width: 'min(90vw, 448px)' }}
        onCancel={(event) => {
          event.preventDefault();
          keepEditing();
        }}
        className="bg-surface text-foreground fixed inset-0 m-auto rounded-md p-6 shadow-2xl backdrop:bg-black/50"
      >
        <h2 id="confirm-epic-title" className="text-lg font-semibold">
          Save changes?
        </h2>

        <p className="text-foreground-secondary mt-2 text-sm">
          You have unsaved changes to this epic.
        </p>

        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            disabled={isSaving}
            onClick={keepEditing}
            className="cursor-pointer rounded-md px-4 py-2 text-sm"
          >
            Keep Editing
          </button>

          <button
            type="button"
            disabled={isSaving}
            onClick={onClose}
            className="text-error cursor-pointer rounded-md px-4 py-2 text-sm"
          >
            Discard
          </button>

          <button
            type="button"
            disabled={isSaving}
            onClick={() => void confirmSave()}
            className="bg-primary text-on-primary cursor-pointer rounded-md px-4 py-2 text-sm font-semibold"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </dialog>
    </div>
  );
}
