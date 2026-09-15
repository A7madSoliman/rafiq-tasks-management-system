export function getUserInitials(name: string | null): string {
  const normalizedName = name?.trim().replace(/\s+/g, ' ');

  if (!normalizedName) {
    return '?';
  }

  const nameParts = normalizedName.split(' ');

  if (nameParts.length === 1) {
    return nameParts[0].slice(0, 2).toUpperCase();
  }

  const firstName = nameParts[0];
  const lastName = nameParts[nameParts.length - 1];

  return `${firstName[0]}${lastName[0]}`.toUpperCase();
}
