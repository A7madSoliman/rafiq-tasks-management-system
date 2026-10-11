'use client';

import { useCallback, useState } from 'react';

import type { TaskStatus } from '../constants/task-statuses';
import type { CreatedTask } from '../schemas/created-task-schema';

import { CreateTaskModal } from './create-task-modal';
import { CreateTaskForm } from './create-task-form';

type CreateTaskDialogProps = {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (task: CreatedTask) => void;
  initialEpicId?: string | null;
  initialStatus?: TaskStatus;
};

export function CreateTaskDialog({
  projectId,
  isOpen,
  onClose,
  onCreated,
  initialEpicId = null,
  initialStatus = 'TO_DO',
}: CreateTaskDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRequestClose = useCallback(() => {
    if (!isSubmitting) {
      onClose();
    }
  }, [isSubmitting, onClose]);

  return (
    <CreateTaskModal isOpen={isOpen} onClose={handleRequestClose} isSubmitting={isSubmitting}>
      <CreateTaskForm
        projectId={projectId}
        onClose={onClose}
        onCreated={onCreated}
        onSubmittingChange={setIsSubmitting}
        initialEpicId={initialEpicId}
        initialStatus={initialStatus}
      />
    </CreateTaskModal>
  );
}
