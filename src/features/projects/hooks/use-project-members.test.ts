import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const hooks = vi.hoisted(() => ({
  slots: [] as unknown[],
  index: 0,
  effects: [] as (() => (() => void) | void)[],
  router: { replace: vi.fn(), refresh: vi.fn() },
}));
vi.mock('next/navigation', () => ({ useRouter: () => hooks.router }));
vi.mock('react', () => ({
  useState: (initial: unknown) => {
    const index = hooks.index++;
    if (!(index in hooks.slots)) hooks.slots[index] = initial;
    return [
      hooks.slots[index],
      (value: unknown) => {
        hooks.slots[index] = typeof value === 'function' ? value(hooks.slots[index]) : value;
      },
    ];
  },
  useRef: (initial: unknown) => {
    const index = hooks.index++;
    if (!(index in hooks.slots)) hooks.slots[index] = { current: initial };
    return hooks.slots[index];
  },
  useCallback: (callback: unknown) => callback,
  useEffect: (effect: () => (() => void) | void) => {
    hooks.effects.push(effect);
  },
}));
import { useProjectMembers } from './use-project-members';
const member = {
  id: 'membership',
  userId: 'user',
  name: 'Jane',
  email: 'jane@example.com',
  role: 'member',
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
function MembersHookHarness(projectId: string, enabled: boolean) {
  return useProjectMembers(projectId, enabled);
}
function renderMembers(projectId = 'project', enabled = true) {
  hooks.index = 0;
  return MembersHookHarness(projectId, enabled);
}
function startEffect() {
  return hooks.effects.pop()?.();
}

describe('project member options', () => {
  beforeEach(() => {
    hooks.slots = [];
    hooks.effects = [];
    hooks.index = 0;
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('loads only when enabled and returns actual member user IDs', async () => {
    renderMembers('project', false);
    startEffect();
    expect(fetch).not.toHaveBeenCalled();
    vi.mocked(fetch).mockResolvedValueOnce(json([member]));
    renderMembers();
    const cleanup = startEffect();
    await vi.waitFor(() => expect(renderMembers().members).toEqual([member]));
    cleanup?.();
  });

  it('hides old project options and ignores late responses after a project switch', async () => {
    let resolveOld!: (response: Response) => void;
    vi.mocked(fetch)
      .mockReturnValueOnce(
        new Promise<Response>((resolve) => {
          resolveOld = resolve;
        }),
      )
      .mockResolvedValueOnce(json([{ ...member, userId: 'new-project-user' }]));
    renderMembers();
    const cleanup = startEffect();
    expect(renderMembers('other').members).toEqual([]);
    cleanup?.();
    startEffect();
    await vi.waitFor(() =>
      expect(renderMembers('other').members[0]?.userId).toBe('new-project-user'),
    );
    resolveOld(json([member]));
    await Promise.resolve();
    await Promise.resolve();
    expect(renderMembers('other').members[0]?.userId).toBe('new-project-user');
    expect(vi.mocked(fetch).mock.calls[0][1]?.signal?.aborted).toBe(true);
  });

  it('allows retrying failed option requests and aborts previous retries', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(json({}, 500))
      .mockReturnValueOnce(new Promise<Response>(() => {}))
      .mockResolvedValueOnce(json([member]));
    renderMembers();
    const cleanup = startEffect();
    await vi.waitFor(() => expect(renderMembers().status).toBe('error'));
    renderMembers().retry();
    renderMembers().retry();
    expect(vi.mocked(fetch).mock.calls[1][1]?.signal?.aborted).toBe(true);
    await vi.waitFor(() => expect(renderMembers().members).toEqual([member]));
    cleanup?.();
  });
});
