import { describe, expect, it } from 'vitest';

import {
  buildTaskPageParams,
  createTaskQueryKey,
  normalizeTaskSearchTerm,
} from './project-task-search-query';

describe('normalizeTaskSearchTerm', () => {
  it('trims whitespace and normalizes case', () => {
    expect(normalizeTaskSearchTerm('  LOGIN  ')).toBe('login');
  });

  it('preserves an empty search', () => {
    expect(normalizeTaskSearchTerm('   ')).toBe('');
  });
});

describe('createTaskQueryKey', () => {
  it('treats equivalent searches as the same query', () => {
    expect(createTaskQueryKey('project-1', null, ' LOGIN ')).toBe(
      createTaskQueryKey('project-1', null, 'login'),
    );
  });

  it('scopes queries to a project', () => {
    expect(createTaskQueryKey('project-1', null, 'login')).not.toBe(
      createTaskQueryKey('project-2', null, 'login'),
    );
  });

  it('scopes queries to a task status', () => {
    expect(createTaskQueryKey('project-1', 'TO_DO', 'login')).not.toBe(
      createTaskQueryKey('project-1', 'DONE', 'login'),
    );
  });

  it('changes when the search changes', () => {
    expect(createTaskQueryKey('project-1', null, 'login')).not.toBe(
      createTaskQueryKey('project-1', null, 'dashboard'),
    );
  });
});

describe('buildTaskPageParams', () => {
  it('builds a filtered first-page request', () => {
    const params = buildTaskPageParams({
      limit: 10,
      offset: 0,
      statusFilter: 'TO_DO',
      searchTerm: ' Login ',
    });

    expect(params.get('limit')).toBe('10');
    expect(params.get('offset')).toBe('0');
    expect(params.get('status')).toBe('TO_DO');
    expect(params.get('search')).toBe('login');
  });

  it('keeps the search filter on additional pages', () => {
    const params = buildTaskPageParams({
      limit: 10,
      offset: 20,
      statusFilter: null,
      searchTerm: 'dashboard',
    });

    expect(params.get('offset')).toBe('20');
    expect(params.get('search')).toBe('dashboard');
    expect(params.has('status')).toBe(false);
  });

  it('omits search when it is empty', () => {
    const params = buildTaskPageParams({
      limit: 10,
      offset: 0,
      statusFilter: null,
      searchTerm: '   ',
    });

    expect(params.has('search')).toBe(false);
  });

  it('properly encodes special characters', () => {
    const params = buildTaskPageParams({
      limit: 10,
      offset: 0,
      statusFilter: null,
      searchTerm: ' Login & UI ',
    });

    expect(params.get('search')).toBe('login & ui');
    expect(params.toString()).toContain('search=login+%26+ui');
  });
});
