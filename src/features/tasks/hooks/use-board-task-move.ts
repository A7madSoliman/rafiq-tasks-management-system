'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { TASK_STATUSES, type TaskStatus } from '../constants/task-statuses';
import type { CreatedTask } from '../schemas/created-task-schema';
import { taskDetailsSchema } from '../schemas/task-details-schema';
import { updateTaskResponseSchema } from '../schemas/update-task-schema';
import type { TaskMoveIntent } from '../utils/task-board-move-intent';
import type { BoardMove } from '../utils/project-board-move';

const failureMessage = 'Failed to update task. Please try again.';
type Revision = Record<TaskStatus, number>;
const emptyRevisions: Revision = {
  TO_DO: 0,
  IN_PROGRESS: 0,
  BLOCKED: 0,
  IN_REVIEW: 0,
  READY_FOR_QA: 0,
  REOPENED: 0,
  READY_FOR_PRODUCTION: 0,
  DONE: 0,
};

export function useBoardTaskMove(
  projectId: string | null,
  mobile: boolean,
  onConfirmed: (intent: TaskMoveIntent) => void,
  onUncertain: (intent: TaskMoveIntent) => void,
) {
  const router = useRouter();
  const [move, setMove] = useState<BoardMove | null>(null);
  const [revisions, setRevisions] = useState<Revision>(emptyRevisions);
  const [mobileRevision, setMobileRevision] = useState(0);
  const activeRef = useRef<BoardMove | null>(null);
  const projectRef = useRef(projectId);
  const mobileRef = useRef(mobile);
  const onConfirmedRef = useRef(onConfirmed);
  const onUncertainRef = useRef(onUncertain);
  const expectedRef = useRef<Map<string, number>>(new Map());
  const revisionsRef = useRef(revisions);
  const mobileRevisionRef = useRef(mobileRevision);

  useEffect(() => {
    projectRef.current = projectId;
  }, [projectId]);
  useEffect(() => {
    mobileRef.current = mobile;
  }, [mobile]);
  useEffect(() => {
    onConfirmedRef.current = onConfirmed;
  }, [onConfirmed]);
  useEffect(() => {
    onUncertainRef.current = onUncertain;
  }, [onUncertain]);

  const refresh = useCallback((intent: TaskMoveIntent, uncertain = false) => {
    const affected = uncertain
      ? TASK_STATUSES.map((status) => status.value)
      : [intent.sourceStatus, intent.destinationStatus];
    const next = {
      ...revisionsRef.current,
    };
    for (const status of affected) next[status] += 1;
    const nextMobile = mobileRevisionRef.current + 1;
    revisionsRef.current = next;
    mobileRevisionRef.current = nextMobile;
    expectedRef.current = mobileRef.current
      ? new Map([['mobile', nextMobile]])
      : new Map(affected.map((status) => [status, next[status]]));
    setRevisions(next);
    setMobileRevision(nextMobile);
  }, []);

  const acknowledge = useCallback((key: TaskStatus | 'mobile', revision: number) => {
    const active = activeRef.current;
    if (!active || active.phase !== 'confirmed' || active.intent.projectId !== projectRef.current)
      return;
    if (!expectedRef.current.has(key)) {
      if (
        key !== 'mobile' &&
        (!expectedRef.current.has('mobile') ||
          (!active.uncertain &&
            key !== active.intent.sourceStatus &&
            key !== active.intent.destinationStatus))
      )
        return;
      // A breakpoint switch replaces the visible queries during reconciliation.
      expectedRef.current =
        key === 'mobile'
          ? new Map([['mobile', mobileRevisionRef.current]])
          : new Map(
              (active.uncertain
                ? TASK_STATUSES.map((status) => status.value)
                : [active.intent.sourceStatus, active.intent.destinationStatus]
              ).map((status) => [status, revisionsRef.current[status]]),
            );
    }
    if (expectedRef.current.get(key) !== revision) return;
    expectedRef.current.delete(key);
    if (expectedRef.current.size === 0) {
      activeRef.current = null;
      setMove((current) => (current?.phase === 'confirmed' ? null : current));
    }
  }, []);

  const start = useCallback(
    (intent: TaskMoveIntent, task: CreatedTask) => {
      if (
        !projectId ||
        intent.projectId !== projectId ||
        task.project_id !== projectId ||
        task.id !== intent.taskId ||
        task.status !== intent.sourceStatus ||
        intent.sourceStatus === intent.destinationStatus ||
        activeRef.current?.intent.projectId === projectId
      )
        return;

      const transaction: BoardMove = {
        intent,
        task,
        phase: 'pending',
        baseRevisions: revisionsRef.current,
        baseMobileRevision: mobileRevisionRef.current,
      };
      activeRef.current = transaction;
      setMove(transaction);
      void (async () => {
        let confirmed = false;
        let definiteFailure = false;
        try {
          const response = await fetch(
            `/api/projects/${encodeURIComponent(projectId)}/tasks/${encodeURIComponent(task.id)}`,
            {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: intent.destinationStatus }),
              cache: 'no-store',
            },
          );
          if (response.status === 401) {
            router.replace('/login');
            router.refresh();
          }
          if (!response.ok) {
            definiteFailure = [400, 401, 403, 404, 409, 422].includes(response.status);
            throw new Error(failureMessage);
          }
          const body: unknown = await response.json();
          const parsed = updateTaskResponseSchema.safeParse(body);
          if (
            !parsed.success ||
            parsed.data.task.id !== task.id ||
            parsed.data.task.project_id !== projectId ||
            parsed.data.task.status !== intent.destinationStatus
          )
            throw new Error(failureMessage);
          confirmed = true;
        } catch {
          if (!definiteFailure) {
            try {
              const read = await fetch(
                `/api/projects/${encodeURIComponent(projectId)}/tasks/${encodeURIComponent(task.id)}`,
                { cache: 'no-store' },
              );
              if (read.ok) {
                const body: unknown = await read.json();
                const parsed = taskDetailsSchema.safeParse(body);
                if (
                  parsed.success &&
                  parsed.data.id === task.id &&
                  parsed.data.projectId === projectId
                ) {
                  confirmed = parsed.data.status === intent.destinationStatus;
                  definiteFailure = parsed.data.status === intent.sourceStatus;
                }
              }
            } catch {
              /* A refresh will reconcile an uncertain write. */
            }
          }
        }
        if (projectRef.current !== projectId) {
          if (activeRef.current === transaction) activeRef.current = null;
          setMove((current) => (current?.intent === intent ? null : current));
          return;
        }
        if (confirmed) {
          activeRef.current = { ...transaction, phase: 'confirmed' };
          setMove(activeRef.current);
          onConfirmedRef.current(intent);
          refresh(intent);
          toast.success('Task updated successfully.');
        } else if (definiteFailure) {
          activeRef.current = null;
          setMove(null);
          toast.error(failureMessage);
        } else {
          // Keep the projection until fresh server pages settle the uncertain write.
          activeRef.current = { ...transaction, phase: 'confirmed', uncertain: true };
          setMove(activeRef.current);
          onUncertainRef.current(intent);
          refresh(intent, true);
          toast.error(failureMessage);
        }
      })();
    },
    [projectId, refresh, router],
  );

  return {
    move: move?.intent.projectId === projectId ? move : null,
    moving: move?.intent.projectId === projectId,
    revisions,
    mobileRevision,
    start,
    acknowledge,
  };
}
