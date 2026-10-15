import { describe, expect, it } from 'vitest';

import { editEpicFieldSchema } from './edit-epic-field-schema';

describe('editEpicFieldSchema', () => {
  it('trims a non-empty title', () => {
    expect(editEpicFieldSchema.parse({ title: '  Updated epic  ' })).toEqual({
      title: 'Updated epic',
    });
  });

  it('rejects a blank title', () => {
    expect(editEpicFieldSchema.safeParse({ title: '   ' }).success).toBe(false);
  });

  it('accepts a description and converts an empty value to null', () => {
    expect(editEpicFieldSchema.parse({ description: '  Details  ' })).toEqual({
      description: 'Details',
    });
    expect(editEpicFieldSchema.parse({ description: '' })).toEqual({ description: null });
    expect(editEpicFieldSchema.parse({ description: null })).toEqual({ description: null });
  });

  it('accepts a member UUID or null', () => {
    const id = '8e75f064-a499-4f43-9c05-64199d8af685';
    expect(editEpicFieldSchema.safeParse({ assignee_id: id }).success).toBe(true);
    expect(editEpicFieldSchema.safeParse({ assignee_id: null }).success).toBe(true);
    expect(editEpicFieldSchema.safeParse({ assignee_id: 'invalid' }).success).toBe(false);
  });

  it('accepts ISO calendar dates or null', () => {
    expect(editEpicFieldSchema.safeParse({ deadline: '2026-12-31' }).success).toBe(true);
    expect(editEpicFieldSchema.safeParse({ deadline: null }).success).toBe(true);
    expect(editEpicFieldSchema.safeParse({ deadline: '2026-02-30' }).success).toBe(false);
  });

  it('rejects empty, multiple, and unexpected fields', () => {
    expect(editEpicFieldSchema.safeParse({}).success).toBe(false);
    expect(editEpicFieldSchema.safeParse({ title: 'X', description: 'Y' }).success).toBe(false);
    expect(editEpicFieldSchema.safeParse({ title: 'X', project_id: 'wrong' }).success).toBe(false);
  });
});
