import { describe, expect, it } from 'vitest';

import { canCreateTask } from './can-create-task';

describe('canCreateTask', () => {
  const userId = 'user-1';
  const projectCreatedBy = 'user-2';

  it('allows the project creator without a membership record', () => {
    expect(
      canCreateTask({
        userId,
        projectCreatedBy: userId,
        memberRole: null,
      }),
    ).toBe(true);
  });

  it.each(['owner', 'admin', 'member'])('allows a project %s to create tasks', (memberRole) => {
    expect(
      canCreateTask({
        userId,
        projectCreatedBy,
        memberRole,
      }),
    ).toBe(true);
  });

  it('rejects a viewer', () => {
    expect(
      canCreateTask({
        userId,
        projectCreatedBy,
        memberRole: 'viewer',
      }),
    ).toBe(false);
  });

  it('rejects a user without membership', () => {
    expect(
      canCreateTask({
        userId,
        projectCreatedBy,
        memberRole: null,
      }),
    ).toBe(false);
  });

  it('rejects an unknown role', () => {
    expect(
      canCreateTask({
        userId,
        projectCreatedBy,
        memberRole: 'unknown',
      }),
    ).toBe(false);
  });
  it('rejects a project creator with an explicit viewer role', () => {
    expect(
      canCreateTask({
        userId: 'user-1',
        projectCreatedBy: 'user-1',
        memberRole: 'viewer',
      }),
    ).toBe(false);
  });
});
