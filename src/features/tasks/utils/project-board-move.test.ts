import { describe, expect, it } from 'vitest';
import type { CreatedTask } from '../schemas/created-task-schema';
import type { BoardMove } from './project-board-move';
import { projectBoardColumn, projectMobileTasks } from './project-board-move';

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
const other: CreatedTask = { ...task, id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', title: 'Other' };
const move: BoardMove = {
  intent: { projectId, taskId: task.id, sourceStatus: 'TO_DO', destinationStatus: 'DONE' },
  task,
  phase: 'pending',
  baseRevisions: {
    TO_DO: 0,
    IN_PROGRESS: 0,
    BLOCKED: 0,
    IN_REVIEW: 0,
    READY_FOR_QA: 0,
    REOPENED: 0,
    READY_FOR_PRODUCTION: 0,
    DONE: 0,
  },
  baseMobileRevision: 0,
};

describe('Board move projection', () => {
  it('moves a card across columns, adjusts counts once, and preserves the fetched arrays for rollback', () => {
    const source = [other, task];
    const destination = [task]; // Stale duplicate from a concurrent page.
    const from = projectBoardColumn(source, 12, 'TO_DO', move, true);
    const to = projectBoardColumn(destination, 3, 'DONE', move, true, false, true);
    expect(from).toEqual({ tasks: [other], totalCount: 11 });
    expect(to.tasks).toEqual([{ ...task, status: 'DONE' }]);
    expect(to.totalCount).toBe(3);
    expect(source).toEqual([other, task]);
    expect(projectBoardColumn(source, 12, 'TO_DO', null, true).tasks).toEqual(source);
  });

  it('counts a confirmed locally created task once while the destination server page is stale', () => {
    expect(
      projectBoardColumn([task], 3, 'DONE', { ...move, phase: 'confirmed' }, true).totalCount,
    ).toBe(4);
  });

  it('leaves unrelated columns and unmatched searches alone, and uses fresh server data', () => {
    expect(projectBoardColumn([task], 1, 'BLOCKED', move, true).tasks).toEqual([task]);
    expect(projectBoardColumn([task], 1, 'TO_DO', move, false).tasks).toEqual([task]);
    expect(
      projectBoardColumn([task], 1, 'TO_DO', { ...move, phase: 'confirmed' }, true, true),
    ).toEqual({ tasks: [task], totalCount: 1 });
  });

  it('holds an uncertain projection until all refreshed columns can be shown together', () => {
    const uncertain = { ...move, phase: 'confirmed' as const, uncertain: true };
    expect(projectBoardColumn([task], 1, 'BLOCKED', uncertain, true).tasks).toEqual([]);
    expect(projectBoardColumn([task], 1, 'TO_DO', uncertain, true, true).totalCount).toBe(1);
    expect(projectBoardColumn([], 1, 'DONE', uncertain, true, true).totalCount).toBe(1);
    expect(projectMobileTasks([task], uncertain, true)[0].status).toBe('DONE');
  });

  it('updates only the matching Mobile badge without changing list order', () => {
    const source = [other, task];
    expect(projectMobileTasks(source, move)).toEqual([other, { ...task, status: 'DONE' }]);
    expect(source[1].status).toBe('TO_DO');
    expect(projectMobileTasks(source, null)).toEqual(source);
  });
});
