export function parseContentRangeTotal(contentRange: string | null): number | null {
  if (!contentRange) {
    return null;
  }

  const match = contentRange.trim().match(/^(?:\d+-\d+|\*)\/(\d+)$/);

  if (!match) {
    return null;
  }

  const total = Number(match[1]);

  if (!Number.isSafeInteger(total) || total < 0) {
    return null;
  }

  return total;
}
