/**
 * Builds a PostgREST case-insensitive substring filter.
 *
 * Examples:
 * " login " -> ilike.%login%
 * ""        -> null
 */
export function buildTaskTitleFilter(rawSearch: string): string | null {
  const search = rawSearch.trim();

  if (!search) {
    return null;
  }

  // Escape SQL LIKE wildcards and backslashes in user input.
  const escapedSearch = search.replace(/[\\%_]/g, '\\$&');
  const pattern = `%${escapedSearch}%`;

  // PostgREST requires quoting values containing reserved
  // filter characters. Escape quote-parser characters too.
  if (/[(),.:"]/.test(search)) {
    const quotedPattern = pattern.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

    return `ilike."${quotedPattern}"`;
  }

  return `ilike.${pattern}`;
}
