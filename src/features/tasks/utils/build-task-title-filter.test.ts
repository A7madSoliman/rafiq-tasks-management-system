import { describe, expect, it } from 'vitest';

import { buildTaskTitleFilter } from './build-task-title-filter';

describe('buildTaskTitleFilter', () => {
  it('creates a case-insensitive substring filter', () => {
    expect(buildTaskTitleFilter('login')).toBe('ilike.%login%');
  });

  it('trims leading and trailing whitespace', () => {
    expect(buildTaskTitleFilter('  Login Page  ')).toBe('ilike.%Login Page%');
  });

  it('omits the filter for an empty search', () => {
    expect(buildTaskTitleFilter('')).toBeNull();
    expect(buildTaskTitleFilter('   ')).toBeNull();
  });

  it('escapes SQL LIKE wildcard characters', () => {
    expect(buildTaskTitleFilter('50%_done')).toBe('ilike.%50\\%\\_done%');
  });

  it('escapes backslashes', () => {
    expect(buildTaskTitleFilter('path\\file')).toBe('ilike.%path\\\\file%');
  });

  it('quotes PostgREST reserved characters', () => {
    expect(buildTaskTitleFilter('Login, UI')).toBe('ilike."%Login, UI%"');

    expect(buildTaskTitleFilter('version 1.0')).toBe('ilike."%version 1.0%"');
  });

  it('supports Unicode text', () => {
    expect(buildTaskTitleFilter(' تسجيل الدخول ')).toBe('ilike.%تسجيل الدخول%');
  });
});
