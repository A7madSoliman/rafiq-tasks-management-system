import { describe, expect, it } from 'vitest';
import { TASK_STATUSES } from '../constants/task-statuses';
import { updateTaskSchema } from './update-task-schema';

describe('updateTaskSchema', () => {
  it('normalizes text without adding omitted fields', () => {
    expect(updateTaskSchema.parse({ title: '  Title  ', description: ' \n ' })).toEqual({
      title: 'Title',
      description: null,
    });
    expect(updateTaskSchema.parse({ description: '  Description  ' })).toEqual({
      description: 'Description',
    });
  });

  it('accepts clearing nullable fields together', () => {
    const input = { description: null, assignee_id: null, due_date: null, epic_id: null };
    expect(updateTaskSchema.parse(input)).toEqual(input);
  });

  it.each(TASK_STATUSES)('accepts supported status $value', ({ value }) => {
    expect(updateTaskSchema.parse({ status: value })).toEqual({ status: value });
  });

  it.each(
    [
      {},
      null,
      [],
      { title: undefined },
      { title: ' \n ' },
      { title: null },
      { status: 'COMPLETED' },
      { status: null },
      { assignee_id: 'member' },
      { epic_id: '' },
      { project_id: 'project' },
      { title: 'Valid', created_by: 'user' },
      { due_date: '2026-02-29' },
      { due_date: '2026-04-31' },
      { due_date: '2026-10-26T00:00:00Z' },
      { description: 42 },
    ].map((input) => ({ input })),
  )('rejects invalid input $input', ({ input }) => {
    expect(updateTaskSchema.safeParse(input).success).toBe(false);
  });

  it('accepts a real leap day; past-date policy requires comparison with persisted state', () => {
    expect(updateTaskSchema.parse({ due_date: '2024-02-29' })).toEqual({ due_date: '2024-02-29' });
  });
});
