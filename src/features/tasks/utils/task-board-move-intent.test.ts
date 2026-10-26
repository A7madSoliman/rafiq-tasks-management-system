import { describe, expect, it } from 'vitest';
import { TASK_STATUSES } from '../constants/task-statuses';
import { getTaskMoveIntent, getKeyboardTargetStatus } from './task-board-move-intent';

const projectId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const taskId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const source = {
  projectId,
  taskId,
  title: 'Task',
  sourceStatus: 'TO_DO',
  canEdit: true,
  mobile: false,
};
const target = { projectId, status: 'DONE', available: true };
const input = { projectId, source, target, canceled: false, disabled: false };

describe('Board move intent', () => {
  it.each(TASK_STATUSES.filter((status) => status.value !== 'TO_DO'))(
    'accepts $value destinations',
    ({ value }) => {
      expect(getTaskMoveIntent({ ...input, target: { ...target, status: value } })).toEqual({
        projectId,
        taskId,
        sourceStatus: 'TO_DO',
        destinationStatus: value,
      });
    },
  );

  it.each([
    { canceled: true },
    { disabled: true },
    { source: null },
    { target: null },
    { source: { ...source, taskId: '' } },
    { source: { ...source, projectId: '' } },
    { source: { ...source, canEdit: false } },
    { source: { ...source, sourceStatus: 'UNKNOWN' } },
    { target: { ...target, status: 'TO_DO' } },
    { target: { ...target, status: 'UNKNOWN' } },
    { target: { ...target, available: false } },
    { target: { ...target, projectId: taskId } },
    { source: { ...source, projectId: taskId } },
  ])('rejects invalid, unauthorized and cancelled drops: %j', (overrides) => {
    expect(getTaskMoveIntent({ ...input, ...overrides })).toBeNull();
  });
});

describe('keyboard status navigation', () => {
  const all = new Set(TASK_STATUSES.map((status) => status.value));
  it('moves across Desktop columns and skips unavailable ones', () => {
    expect(getKeyboardTargetStatus('TO_DO', 'right', false, all)).toBe('IN_PROGRESS');
    expect(getKeyboardTargetStatus('DONE', 'left', false, new Set(['TO_DO']))).toBe('TO_DO');
    expect(getKeyboardTargetStatus('TO_DO', 'left', false, all)).toBeNull();
    expect(getKeyboardTargetStatus('TO_DO', 'down', false, all)).toBeNull();
  });
  it('uses a two-column Mobile grid without wrapping across rows', () => {
    expect(getKeyboardTargetStatus('TO_DO', 'right', true, all)).toBe('IN_PROGRESS');
    expect(getKeyboardTargetStatus('TO_DO', 'down', true, all)).toBe('BLOCKED');
    expect(getKeyboardTargetStatus('BLOCKED', 'up', true, all)).toBe('TO_DO');
    expect(getKeyboardTargetStatus('IN_PROGRESS', 'right', true, all)).toBeNull();
    expect(getKeyboardTargetStatus('DONE', 'down', true, all)).toBeNull();
  });
});
