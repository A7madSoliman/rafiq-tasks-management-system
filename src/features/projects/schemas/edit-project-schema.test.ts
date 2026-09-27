import { describe, expect, it } from 'vitest';

import { editProjectSchema } from './edit-project-schema';

describe('editProjectSchema', () => {
  it('accepts valid project data', () => {
    const result = editProjectSchema.safeParse({
      name: 'Taskly Project',
      description: 'Frontend implementation',
    });

    expect(result.success).toBe(true);
  });

  it('trims the project name', () => {
    const result = editProjectSchema.safeParse({
      name: '  Taskly Project  ',
      description: '',
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.name).toBe('Taskly Project');
    }
  });

  it('rejects an empty project name', () => {
    const result = editProjectSchema.safeParse({
      name: '',
      description: '',
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(
        result.error.issues.some((issue) => issue.message === 'Project name is required.'),
      ).toBe(true);
    }
  });

  it('rejects a project name shorter than 3 characters', () => {
    const result = editProjectSchema.safeParse({
      name: 'ab',
      description: '',
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(
        result.error.issues.some(
          (issue) => issue.message === 'Project name must be at least 3 characters.',
        ),
      ).toBe(true);
    }
  });

  it('rejects a description longer than 500 characters', () => {
    const result = editProjectSchema.safeParse({
      name: 'Taskly Project',
      description: 'a'.repeat(501),
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(
        result.error.issues.some(
          (issue) => issue.message === 'Description must not exceed 500 characters.',
        ),
      ).toBe(true);
    }
  });
});
