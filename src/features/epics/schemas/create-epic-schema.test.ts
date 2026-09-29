import { describe, expect, it } from 'vitest';

import { createEpicSchema } from './create-epic-schema';
import { getTodayLocalDate } from '../utils/get-today-local-date';

describe('createEpicSchema', () => {
  it('trims and accepts a valid title', () => {
    const result = createEpicSchema.safeParse({
      title: '  Authentication Epic  ',
      description: '',
      assigneeId: '',
      deadline: '',
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.title).toBe('Authentication Epic');
    }
  });

  it('rejects a title shorter than 3 characters after trimming', () => {
    const result = createEpicSchema.safeParse({
      title: '  ab  ',
      description: '',
      assigneeId: '',
      deadline: '',
    });

    expect(result.success).toBe(false);
  });

  it('rejects a description longer than 500 characters', () => {
    const result = createEpicSchema.safeParse({
      title: 'Valid Epic',
      description: 'a'.repeat(501),
      assigneeId: '',
      deadline: '',
    });

    expect(result.success).toBe(false);
  });

  it('accepts empty optional fields', () => {
    const result = createEpicSchema.safeParse({
      title: 'Valid Epic',
      description: '',
      assigneeId: '',
      deadline: '',
    });

    expect(result.success).toBe(true);
  });

  it('rejects an invalid assignee id', () => {
    const result = createEpicSchema.safeParse({
      title: 'Valid Epic',
      description: '',
      assigneeId: 'not-a-uuid',
      deadline: '',
    });

    expect(result.success).toBe(false);
  });

  it('accepts today as a deadline', () => {
    const result = createEpicSchema.safeParse({
      title: 'Valid Epic',
      description: '',
      assigneeId: '',
      deadline: getTodayLocalDate(),
    });

    expect(result.success).toBe(true);
  });

  it('rejects a past deadline', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const year = yesterday.getFullYear();
    const month = String(yesterday.getMonth() + 1).padStart(2, '0');
    const day = String(yesterday.getDate()).padStart(2, '0');

    const result = createEpicSchema.safeParse({
      title: 'Valid Epic',
      description: '',
      assigneeId: '',
      deadline: `${year}-${month}-${day}`,
    });

    expect(result.success).toBe(false);
  });
});
