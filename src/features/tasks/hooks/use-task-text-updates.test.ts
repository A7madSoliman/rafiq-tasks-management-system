import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { TaskDetails } from '../schemas/task-details-schema';

// Follow the existing hook harness pattern; no DOM/test-library dependency is needed.
const hooks = vi.hoisted(() => ({
  slots: [] as unknown[],
  index: 0,
  dependencies: undefined as readonly unknown[] | undefined,
  cleanup: undefined as (() => void) | undefined,
  effects: [] as (() => (() => void) | void)[],
  router: { replace: vi.fn(), refresh: vi.fn() },
  toast: { success: vi.fn(), error: vi.fn() },
}));
vi.mock('next/navigation', () => ({ useRouter: () => hooks.router }));
vi.mock('sonner', () => ({ toast: hooks.toast }));
vi.mock('react', () => ({
  useState: (initial: unknown) => {
    const index = hooks.index++;
    if (!(index in hooks.slots)) hooks.slots[index] = initial;
    return [
      hooks.slots[index],
      (value: unknown) => {
        hooks.slots[index] =
          typeof value === 'function'
            ? (value as (current: unknown) => unknown)(hooks.slots[index])
            : value;
      },
    ];
  },
  useRef: (initial: unknown) => {
    const index = hooks.index++;
    if (!(index in hooks.slots)) hooks.slots[index] = { current: initial };
    return hooks.slots[index];
  },
  useEffect: (effect: () => (() => void) | void, dependencies: readonly unknown[]) => {
    if (
      !hooks.dependencies ||
      dependencies.some((value, i) => !Object.is(value, hooks.dependencies?.[i]))
    ) {
      hooks.effects.push(effect);
      hooks.dependencies = dependencies;
    }
  },
}));

import { useTaskTextUpdates } from './use-task-text-updates';

const task: TaskDetails = {
  id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  projectId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  taskCode: 'TASK-10',
  title: 'Original title',
  description: 'Original description',
  canEdit: true,
  assigneeId: null,
  assigneeName: null,
  epic: null,
  dueDate: null,
  status: 'TO_DO',
  createdAt: null,
  createdByName: null,
};
const failedMessage = 'Failed to update task. Please try again.';

function TaskTextUpdatesHookHarness(currentTask: TaskDetails | null) {
  return useTaskTextUpdates(currentTask);
}

function HookHarness(currentTask: TaskDetails | null = task) {
  hooks.index = 0;
  const result = TaskTextUpdatesHookHarness(currentTask);
  for (const effect of hooks.effects.splice(0)) {
    hooks.cleanup?.();
    hooks.cleanup = effect() ?? undefined;
  }
  return result;
}
function persisted(
  changes: Partial<{ title: string; description: string | null }> = {},
  status = 200,
) {
  return new Response(
    JSON.stringify({
      task: {
        id: task.id,
        project_id: task.projectId,
        task_id: task.taskCode,
        title: task.title,
        description: task.description,
        assignee_id: null,
        due_date: null,
        epic_id: null,
        status: 'TO_DO',
        ...changes,
      },
    }),
    { status },
  );
}
function deferred() {
  let resolve!: (response: Response) => void;
  const promise = new Promise<Response>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}
function resetHarness() {
  hooks.slots = [];
  hooks.index = 0;
  hooks.dependencies = undefined;
  hooks.cleanup = undefined;
  hooks.effects = [];
}

describe('useTaskTextUpdates', () => {
  beforeEach(() => {
    resetHarness();
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn());
  });
  afterEach(() => {
    hooks.cleanup?.();
    vi.unstubAllGlobals();
  });

  it('initializes when loaded details arrive without treating them as edits', async () => {
    expect(HookHarness(null).title).toBe('');
    const editor = HookHarness();
    expect(editor.title).toBe(task.title);
    expect(editor.description).toBe(task.description);
    await editor.save('title');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('guards Viewer mutations even if handlers are invoked directly', async () => {
    const viewer = { ...task, canEdit: false };
    const editor = HookHarness(viewer);
    editor.change('title', 'Forbidden');
    await editor.save('title');
    expect(HookHarness(viewer).title).toBe(task.title);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('rejects blank titles without discarding the invalid draft', async () => {
    HookHarness().change('title', ' \n ');
    expect(await HookHarness().save('title')).toBe(false);
    expect(HookHarness().errors.title).toBe('Title is required.');
    expect(HookHarness().title).toBe(' \n ');
    expect(fetch).not.toHaveBeenCalled();
    HookHarness().change('title', 'Corrected');
    expect(HookHarness().errors.title).toBeUndefined();
  });

  it('skips normalized unchanged values and normalizes the displayed drafts', async () => {
    const editor = HookHarness();
    editor.change('title', '  Original title  ');
    editor.change('description', '\n Original description \n');
    expect(await editor.save('title')).toBe(true);
    expect(await editor.save('description')).toBe(true);
    expect(HookHarness()).toMatchObject({ title: task.title, description: task.description });
    expect(fetch).not.toHaveBeenCalled();
    expect(hooks.toast.success).not.toHaveBeenCalled();
  });

  it('sends only the trimmed title and remembers confirmed values for subsequent blurs', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(persisted({ title: 'Updated' }));
    const editor = HookHarness();
    editor.change('title', '  Updated  ');
    const saving = editor.save('title');
    expect(HookHarness()).toMatchObject({ title: 'Updated', saving: { title: true } });
    expect(await saving).toBe(true);
    expect(fetch).toHaveBeenCalledWith(
      `/api/projects/${task.projectId}/tasks/${task.id}`,
      expect.objectContaining({
        method: 'PATCH',
        body: '{"title":"Updated"}',
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    expect(hooks.toast.success).toHaveBeenCalledWith('Task updated successfully.');
    await HookHarness().save('title');
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(HookHarness().saving.title).toBe(false);
  });

  it('clears whitespace-only descriptions to null and retains multiline content', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(persisted({ description: null }))
      .mockResolvedValueOnce(persisted({ description: 'First line\n\nSecond line' }));
    HookHarness().change('description', ' \n ');
    expect(await HookHarness().save('description')).toBe(true);
    expect(HookHarness().description).toBe('');
    expect(vi.mocked(fetch).mock.calls[0][1]?.body).toBe('{"description":null}');
    HookHarness().change('description', '\n First line\n\nSecond line \n');
    expect(await HookHarness().save('description')).toBe(true);
    expect(JSON.parse(String(vi.mocked(fetch).mock.calls[1][1]?.body))).toEqual({
      description: 'First line\n\nSecond line',
    });
  });

  it('skips an empty description that is already null', async () => {
    const emptyTask = { ...task, description: null };
    HookHarness(emptyTask).change('description', ' \n ');
    await HookHarness(emptyTask).save('description');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('shares pending saves and blocks changes to only the saving field', async () => {
    const pending = deferred();
    vi.mocked(fetch).mockReturnValueOnce(pending.promise);
    const editor = HookHarness();
    editor.change('title', 'Updated');
    const first = editor.save('title');
    const second = editor.save('title');
    expect(first).toBe(second);
    editor.change('title', 'Duplicate');
    editor.change('description', 'Unrelated draft');
    expect(HookHarness()).toMatchObject({
      title: 'Updated',
      description: 'Unrelated draft',
      saving: { title: true },
    });
    expect(fetch).toHaveBeenCalledTimes(1);
    pending.resolve(persisted({ title: 'Updated' }));
    await first;
    expect(HookHarness().description).toBe('Unrelated draft');
  });

  it('rolls back only the failed field to its last confirmed value', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(persisted({ title: 'Confirmed' }))
      .mockRejectedValueOnce(new Error('offline'));
    HookHarness().change('title', 'Confirmed');
    await HookHarness().save('title');
    HookHarness().change('title', 'Failed');
    HookHarness().change('description', 'Keep my draft');
    expect(await HookHarness().save('title')).toBe(false);
    expect(HookHarness()).toMatchObject({
      title: 'Confirmed',
      description: 'Keep my draft',
      errors: { title: failedMessage },
    });
    expect(hooks.toast.error).toHaveBeenCalledWith(failedMessage);
  });

  it.each(['title', 'description'] as const)(
    'isolates concurrent saves when %s completes first',
    async (firstField) => {
      const title = deferred();
      const description = deferred();
      vi.mocked(fetch).mockReturnValueOnce(title.promise).mockReturnValueOnce(description.promise);
      const editor = HookHarness();
      editor.change('title', 'Updated');
      editor.change('description', 'New description');
      const titleSave = editor.save('title');
      const descriptionSave = editor.save('description');
      expect(HookHarness().saving).toEqual({ title: true, description: true });
      const finishTitle = () => title.resolve(persisted({ title: 'Updated' }));
      const finishDescription = () =>
        description.resolve(persisted({ description: 'New description' }));
      if (firstField === 'title') {
        finishTitle();
        await titleSave;
        finishDescription();
      } else {
        finishDescription();
        await descriptionSave;
        finishTitle();
      }
      await Promise.all([titleSave, descriptionSave]);
      expect(HookHarness()).toMatchObject({ title: 'Updated', description: 'New description' });
    },
  );

  it('preserves a successful concurrent description when title fails', async () => {
    const title = deferred();
    vi.mocked(fetch)
      .mockReturnValueOnce(title.promise)
      .mockResolvedValueOnce(persisted({ description: 'Saved description' }));
    const editor = HookHarness();
    editor.change('title', 'Fail');
    editor.change('description', 'Saved description');
    const titleSave = editor.save('title');
    await editor.save('description');
    title.resolve(persisted({}, 500));
    await titleSave;
    expect(HookHarness()).toMatchObject({ title: task.title, description: 'Saved description' });
  });

  it.each(['invalid schema', 'wrong task', 'wrong project', 'unconfirmed value', 'empty body'])(
    'rejects a successful HTTP response with %s',
    async (kind) => {
      let response = persisted();
      if (kind === 'invalid schema') response = new Response('{}');
      if (kind === 'empty body') response = new Response(null);
      if (kind === 'wrong task' || kind === 'wrong project') {
        const body = await persisted({ title: 'Updated' }).json();
        body.task[kind === 'wrong task' ? 'id' : 'project_id'] =
          'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
        response = new Response(JSON.stringify(body));
      }
      vi.mocked(fetch).mockResolvedValueOnce(response);
      HookHarness().change('title', 'Updated');
      expect(await HookHarness().save('title')).toBe(false);
      expect(HookHarness().title).toBe(task.title);
      expect(hooks.toast.success).not.toHaveBeenCalled();
    },
  );

  it('uses the existing session-expiry redirect flow', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(persisted({}, 401));
    HookHarness().change('title', 'Updated');
    await HookHarness().save('title');
    expect(hooks.router.replace).toHaveBeenCalledWith('/login');
    expect(hooks.router.refresh).toHaveBeenCalledOnce();
    expect(HookHarness().title).toBe(task.title);
  });

  it('flushes both drafts and waits for existing requests before closing once', async () => {
    const title = deferred();
    const description = deferred();
    vi.mocked(fetch).mockReturnValueOnce(title.promise).mockReturnValueOnce(description.promise);
    const onClose = vi.fn();
    const editor = HookHarness();
    editor.change('title', 'Updated');
    editor.change('description', 'New description');
    const titleSave = editor.save('title');
    const closing = editor.close(onClose);
    await editor.close(onClose);
    expect(HookHarness().isClosing).toBe(true);
    editor.change('description', 'Too late');
    expect(HookHarness().description).toBe('New description');
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(onClose).not.toHaveBeenCalled();
    title.resolve(persisted({ title: 'Updated' }));
    await titleSave;
    expect(onClose).not.toHaveBeenCalled();
    description.resolve(persisted({ description: 'New description' }));
    await closing;
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('keeps the modal open for an invalid title and permits correction', async () => {
    const onClose = vi.fn();
    HookHarness().change('title', ' ');
    await HookHarness().close(onClose);
    expect(onClose).not.toHaveBeenCalled();
    expect(HookHarness().isClosing).toBe(false);
    vi.mocked(fetch).mockResolvedValueOnce(persisted({ title: 'Corrected' }));
    HookHarness().change('title', 'Corrected');
    await HookHarness().close(onClose);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('keeps the modal open when an in-flight blur save fails during close', async () => {
    const pending = deferred();
    vi.mocked(fetch).mockReturnValueOnce(pending.promise);
    const onClose = vi.fn();
    const editor = HookHarness();
    editor.change('description', 'Fail');
    const saving = editor.save('description');
    const closing = editor.close(onClose);
    pending.resolve(persisted({}, 403));
    await saving;
    await closing;
    expect(onClose).not.toHaveBeenCalled();
    expect(HookHarness()).toMatchObject({
      isClosing: false,
      description: task.description,
      errors: { description: failedMessage },
    });
  });

  it.each([task.id, 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'])(
    'ignores old saves and close callbacks when reopening task %s',
    async (reopenedId) => {
      const pending = deferred();
      vi.mocked(fetch).mockReturnValueOnce(pending.promise);
      const onClose = vi.fn();
      const editor = HookHarness();
      editor.change('title', 'Old save');
      const closing = editor.close(onClose);
      hooks.cleanup?.();
      resetHarness();
      const reopened = { ...task, id: reopenedId, title: 'Fresh details' };
      HookHarness(reopened);
      pending.resolve(persisted({ title: 'Old save' }));
      await closing;
      expect(HookHarness(reopened).title).toBe('Fresh details');
      expect(onClose).not.toHaveBeenCalled();
      expect(hooks.toast.success).not.toHaveBeenCalled();
    },
  );
});
