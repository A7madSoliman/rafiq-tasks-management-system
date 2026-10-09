'use client';

import { CreateTaskModal } from './create-task-modal';
import { CreateTaskForm } from './create-task-form';

type CreateTaskDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  initialEpicId?: string | null;
};

export function CreateTaskDialog({ isOpen, onClose, initialEpicId = null }: CreateTaskDialogProps) {
  return (
    <CreateTaskModal isOpen={isOpen} onClose={onClose}>
      <CreateTaskForm onClose={onClose} initialEpicId={initialEpicId} />
    </CreateTaskModal>
  );
}
