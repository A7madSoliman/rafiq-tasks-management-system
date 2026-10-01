import { describe, expect, it } from 'vitest';

import { getPaginationItems } from './get-pagination-items';

describe('getPaginationItems', () => {
  it('returns all pages when the total is small', () => {
    expect(getPaginationItems(2, 5)).toEqual([1, 2, 3, 4, 5]);
  });

  it('shows an ellipsis near the start', () => {
    expect(getPaginationItems(1, 15)).toEqual([1, 2, 3, 'ellipsis-right', 15]);
  });

  it('shows pages around the current page', () => {
    expect(getPaginationItems(8, 15)).toEqual([1, 'ellipsis-left', 7, 8, 9, 'ellipsis-right', 15]);
  });

  it('shows an ellipsis near the end', () => {
    expect(getPaginationItems(15, 15)).toEqual([1, 'ellipsis-left', 13, 14, 15]);
  });
});
