import { describe, expect, it } from 'vitest';

import { createTaskSchema } from './create-task-schema';

const validValues = {
  title: 'Create dashboard',
  description: '',
  epicId: '',
  assigneeId: '',
  dueDate: '',
  status: 'TO_DO',
};

describe('createTaskSchema', () => {
  it('accepts a valid task with empty optional fields', () => {
    const result = createTaskSchema.safeParse(validValues);

    expect(result.success).toBe(true);
  });

  it('trims the task title', () => {
    const result = createTaskSchema.safeParse({
      ...validValues,
      title: '  Create dashboard  ',
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.title).toBe('Create dashboard');
    }
  });

  it('rejects an empty title', () => {
    const result = createTaskSchema.safeParse({
      ...validValues,
      title: '   ',
    });

    expect(result.success).toBe(false);
  });

  it('rejects an unsupported task status', () => {
    const result = createTaskSchema.safeParse({
      ...validValues,
      status: 'UNKNOWN',
    });

    expect(result.success).toBe(false);
  });

  it('rejects invalid epic and assignee IDs', () => {
    const result = createTaskSchema.safeParse({
      ...validValues,
      epicId: 'invalid-id',
      assigneeId: 'invalid-id',
    });

    expect(result.success).toBe(false);
  });

  it('accepts a valid date', () => {
    const result = createTaskSchema.safeParse({
      ...validValues,
      dueDate: '2026-10-15',
    });

    expect(result.success).toBe(true);
  });

  it('rejects an invalid date', () => {
    const result = createTaskSchema.safeParse({
      ...validValues,
      dueDate: '2026-02-30',
    });

    expect(result.success).toBe(false);
  });
});
