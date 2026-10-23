import { describe, expect, it } from 'vitest';

import { canInviteProjectMember } from './can-invite-project-member';

const USER_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const OWNER_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

describe('canInviteProjectMember', () => {
  it.each(['owner', 'admin', 'member'] as const)('allows the %s role', (memberRole) => {
    expect(
      canInviteProjectMember({
        userId: USER_ID,
        projectCreatedBy: OWNER_ID,
        memberRole,
      }),
    ).toBe(true);
  });

  it('rejects viewers', () => {
    expect(
      canInviteProjectMember({
        userId: USER_ID,
        projectCreatedBy: OWNER_ID,
        memberRole: 'viewer',
      }),
    ).toBe(false);
  });

  it('rejects users outside the project', () => {
    expect(
      canInviteProjectMember({
        userId: USER_ID,
        projectCreatedBy: OWNER_ID,
        memberRole: null,
      }),
    ).toBe(false);
  });

  it('allows the project creator without a membership record', () => {
    expect(
      canInviteProjectMember({
        userId: OWNER_ID,
        projectCreatedBy: OWNER_ID,
        memberRole: null,
      }),
    ).toBe(true);
  });

  it('does not override an explicit viewer restriction', () => {
    expect(
      canInviteProjectMember({
        userId: OWNER_ID,
        projectCreatedBy: OWNER_ID,
        memberRole: 'viewer',
      }),
    ).toBe(false);
  });
});
