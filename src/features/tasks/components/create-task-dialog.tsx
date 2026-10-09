'use client';

import { CreateTaskModal } from './create-task-modal';
import { CreateTaskForm } from './create-task-form';

type CreateTaskDialogProps = {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  initialEpicId?: string | null;
};

export function CreateTaskDialog({
  projectId,
  isOpen,
  onClose,
  initialEpicId = null,
}: CreateTaskDialogProps) {
  return (
    <CreateTaskModal isOpen={isOpen} onClose={onClose}>
      <CreateTaskForm projectId={projectId} onClose={onClose} initialEpicId={initialEpicId} />
    </CreateTaskModal>
  );
}
