import { describe, expect, it } from 'vitest';

import { canEditEpic } from './can-edit-epic';

describe('canEditEpic', () => {
  const userId = 'user-1';
  const projectCreatedBy = 'user-2';

  it.each(['owner', 'admin', 'member'])('allows a project %s', (memberRole) => {
    expect(canEditEpic({ userId, projectCreatedBy, memberRole })).toBe(true);
  });

  it('allows the creator even without a membership record', () => {
    expect(canEditEpic({ userId, projectCreatedBy: userId, memberRole: null })).toBe(true);
  });

  it('rejects a viewer even if they created the project', () => {
    expect(canEditEpic({ userId, projectCreatedBy: userId, memberRole: 'viewer' })).toBe(false);
  });

  it('rejects missing and unknown membership', () => {
    expect(canEditEpic({ userId, projectCreatedBy, memberRole: null })).toBe(false);
    expect(canEditEpic({ userId, projectCreatedBy, memberRole: 'unknown' })).toBe(false);
  });
});
