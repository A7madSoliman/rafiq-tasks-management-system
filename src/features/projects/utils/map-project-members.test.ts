import { describe, expect, it } from 'vitest';

import { mapProjectMembers } from './map-project-members';

describe('mapProjectMembers', () => {
  it('maps a valid project member response', () => {
    const result = mapProjectMembers([
      {
        member_id: 'member-1',
        project_id: 'project-1',
        user_id: 'user-1',
        role: 'owner',
        email: 'ahmedsoliman3992@gmail.com',
        metadata: {
          name: 'Ahmed Ashry',
        },
      },
    ]);

    expect(result).toEqual([
      {
        id: 'member-1',
        userId: 'user-1',
        name: 'Ahmed Ashry',
        email: 'ahmedsoliman3992@gmail.com',
        role: 'owner',
      },
    ]);
  });

  it('rejects an unsupported member role', () => {
    const result = mapProjectMembers([
      {
        member_id: 'member-1',
        user_id: 'user-1',
        role: 'manager',
        email: 'ahmedsoliman3992@gmail.com',
        metadata: {
          name: 'Ahmed Ashry',
        },
      },
    ]);

    expect(result).toBeNull();
  });

  it('rejects a member without a valid name', () => {
    const result = mapProjectMembers([
      {
        member_id: 'member-1',
        user_id: 'user-1',
        role: 'member',
        email: 'ahmedsoliman3992@gmail.com',
        metadata: {},
      },
    ]);

    expect(result).toBeNull();
  });

  it('rejects a non-array response', () => {
    expect(mapProjectMembers({})).toBeNull();
  });
});
