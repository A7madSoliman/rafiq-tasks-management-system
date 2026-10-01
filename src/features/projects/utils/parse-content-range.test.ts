import { describe, expect, it } from 'vitest';

import { parseContentRangeTotal } from './parse-content-range';

describe('parseContentRangeTotal', () => {
  it('parses the total count from a valid content range', () => {
    expect(parseContentRangeTotal('0-4/11')).toBe(11);
    expect(parseContentRangeTotal('5-9/11')).toBe(11);
  });

  it('parses an empty range with zero total', () => {
    expect(parseContentRangeTotal('*/0')).toBe(0);
  });

  it('returns null when the header is missing', () => {
    expect(parseContentRangeTotal(null)).toBeNull();
  });

  it('returns null for invalid content ranges', () => {
    expect(parseContentRangeTotal('0-4/*')).toBeNull();
    expect(parseContentRangeTotal('invalid')).toBeNull();
    expect(parseContentRangeTotal('')).toBeNull();
  });
});
