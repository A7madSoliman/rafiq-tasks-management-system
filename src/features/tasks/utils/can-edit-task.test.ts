import { describe, expect, it } from 'vitest';
import type { ProjectMemberRole } from '@/features/projects/types/project-member';
import { canEditTask } from './can-edit-task';

describe('canEditTask', () => {
  it.each<ProjectMemberRole>(['owner', 'admin', 'member'])('allows %s', (memberRole) => {
    expect(canEditTask({ userId: 'user', projectCreatedBy: 'other', memberRole })).toBe(true);
  });

  it('allows a project creator without a membership record', () => {
    expect(canEditTask({ userId: 'user', projectCreatedBy: 'user', memberRole: null })).toBe(true);
  });

  it.each(['user', 'other'])('denies explicit viewers even for creator %s', (projectCreatedBy) => {
    expect(canEditTask({ userId: 'user', projectCreatedBy, memberRole: 'viewer' })).toBe(false);
  });

  it('denies outsiders', () => {
    expect(canEditTask({ userId: 'user', projectCreatedBy: 'other', memberRole: null })).toBe(
      false,
    );
  });
});
