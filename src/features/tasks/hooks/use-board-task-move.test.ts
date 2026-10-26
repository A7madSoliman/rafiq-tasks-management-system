import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CreatedTask } from '../schemas/created-task-schema';
import { useBoardTaskMove } from './use-board-task-move';

const harness = vi.hoisted(() => ({
  slots: [] as unknown[],
  index: 0,
  effects: [] as (() => void)[],
  router: { replace: vi.fn(), refresh: vi.fn() },
  toast: { success: vi.fn(), error: vi.fn() },
  onConfirmed: vi.fn(),
  onUncertain: vi.fn(),
}));
vi.mock('next/navigation', () => ({ useRouter: () => harness.router }));
vi.mock('sonner', () => ({ toast: harness.toast }));
vi.mock('react', () => ({
  useState(initial: unknown) {
    const index = harness.index++;
    if (!(index in harness.slots)) harness.slots[index] = initial;
    return [
      harness.slots[index],
      (value: unknown) => {
        harness.slots[index] =
          typeof value === 'function'
            ? (value as (current: unknown) => unknown)(harness.slots[index])
            : value;
      },
    ];
  },
  useRef(initial: unknown) {
    const index = harness.index++;
    if (!(index in harness.slots)) harness.slots[index] = { current: initial };
    return harness.slots[index];
  },
  useEffect(effect: () => void, dependencies: readonly unknown[]) {
    const index = harness.index++;
    const previous = harness.slots[index] as readonly unknown[] | undefined;
    if (!previous || dependencies.some((value, i) => !Object.is(value, previous[i]))) {
      harness.slots[index] = dependencies;
      harness.effects.push(effect);
    }
  },
  useCallback: (callback: unknown) => callback,
}));

const projectId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const task: CreatedTask = {
  id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  project_id: projectId,
  task_id: 'TASK-1',
  title: 'Login',
  description: null,
  epic_id: null,
  assignee_id: null,
  due_date: null,
  status: 'TO_DO',
};
const intent = {
  projectId,
  taskId: task.id,
  sourceStatus: 'TO_DO' as const,
  destinationStatus: 'DONE' as const,
};

function HookHarness(id: string | null = projectId, mobile = false) {
  harness.index = 0;
  const result = useBoardTaskMove(id, mobile, harness.onConfirmed, harness.onUncertain);
  for (const effect of harness.effects.splice(0)) effect();
  return result;
}
function deferred() {
  let resolve!: (value: Response) => void;
  const promise = new Promise<Response>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}
function patched(status = 'DONE') {
  return new Response(
    JSON.stringify({
      task: {
        ...task,
        status,
        title: task.title,
      },
    }),
  );
}
describe('useBoardTaskMove', () => {
  beforeEach(() => {
    harness.slots = [];
    harness.index = 0;
    harness.effects = [];
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn());
  });
  afterEach(() => vi.unstubAllGlobals());

  it('projects immediately, sends only status, blocks duplicate moves, and refreshes both columns after confirmation', async () => {
    const request = deferred();
    vi.mocked(fetch).mockReturnValue(request.promise);
    HookHarness().start(intent, task);
    expect(HookHarness().move?.phase).toBe('pending');
    HookHarness().start(intent, task);
    expect(fetch).toHaveBeenCalledOnce();
    expect(JSON.parse(vi.mocked(fetch).mock.calls[0][1]?.body as string)).toEqual({
      status: 'DONE',
    });
    request.resolve(patched());
    await vi.waitFor(() => expect(HookHarness().move?.phase).toBe('confirmed'));
    expect(harness.onConfirmed).toHaveBeenCalledOnce();
    expect(HookHarness().revisions.TO_DO).toBe(1);
    expect(HookHarness().revisions.DONE).toBe(1);
    expect(HookHarness().revisions.BLOCKED).toBe(0);
    HookHarness().acknowledge('TO_DO', 0); // Obsolete response cannot clear the move.
    expect(HookHarness().move).not.toBeNull();
    HookHarness().acknowledge('TO_DO', 1);
    expect(HookHarness().move).not.toBeNull();
    HookHarness().acknowledge('DONE', 1);
    expect(HookHarness().move).toBeNull();
    expect(harness.toast.success).toHaveBeenCalledOnce();
  });

  it('restores the fetched state on a definite failure', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 403 }));
    HookHarness().start(intent, task);
    await vi.waitFor(() => expect(HookHarness().move).toBeNull());
    expect(harness.toast.error).toHaveBeenCalledWith('Failed to update task. Please try again.');
    expect(harness.onConfirmed).not.toHaveBeenCalled();
    expect(fetch).toHaveBeenCalledOnce();
  });

  it('reads back an unconfirmed write before accepting it and refreshes Mobile', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(new Response(null, { status: 502 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: task.id,
            projectId,
            taskCode: task.task_id,
            title: task.title,
            description: null,
            status: 'DONE',
            epic: null,
            assigneeName: null,
            assigneeId: null,
            canEdit: true,
            createdByName: null,
            dueDate: null,
            createdAt: null,
          }),
        ),
      );
    HookHarness(projectId, true).start(intent, task);
    await vi.waitFor(() => expect(HookHarness(projectId, true).move?.phase).toBe('confirmed'));
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(HookHarness(projectId, true).mobileRevision).toBe(1);
    HookHarness(projectId, true).acknowledge('mobile', 1);
    expect(HookHarness(projectId, true).move).toBeNull();
  });

  it('ignores an old project response while leaving its PATCH in flight', async () => {
    const request = deferred();
    vi.mocked(fetch).mockReturnValue(request.promise);
    HookHarness().start(intent, task);
    HookHarness('dddddddd-dddd-4ddd-8ddd-dddddddddddd');
    request.resolve(patched());
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(harness.onConfirmed).not.toHaveBeenCalled();
    expect(harness.toast.success).not.toHaveBeenCalled();
    expect(HookHarness(projectId).move).toBeNull();
  });

  it('keeps an uncertain move until all status queries reload and drops the local copy', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(new Response(null, { status: 502 }))
      .mockRejectedValueOnce(new Error('offline'));
    HookHarness().start(intent, task);
    await vi.waitFor(() => expect(HookHarness().move?.uncertain).toBe(true));
    expect(harness.onUncertain).toHaveBeenCalledWith(intent);
    expect(harness.onConfirmed).not.toHaveBeenCalled();
    expect(HookHarness().revisions.BLOCKED).toBe(1);
    for (const status of [
      'TO_DO',
      'IN_PROGRESS',
      'BLOCKED',
      'IN_REVIEW',
      'READY_FOR_QA',
      'REOPENED',
      'READY_FOR_PRODUCTION',
      'DONE',
    ] as const) {
      HookHarness().acknowledge(status, 1);
    }
    expect(HookHarness().move).toBeNull();
    expect(harness.toast.error).toHaveBeenCalledWith('Failed to update task. Please try again.');
  });
});
