import { Project } from '../types/project';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function mapProject(value: unknown): Project | null {
  if (!isRecord(value)) {
    return null;
  }

  const { id, name, description, created_at } = value;
  if (
    (typeof id !== 'string' && typeof id !== 'number') ||
    typeof name !== 'string' ||
    typeof created_at !== 'string'
  ) {
    return null;
  }

  if (description !== null && description !== undefined && typeof description !== 'string') {
    return null;
  }

  return {
    id: String(id),
    name: name,
    description: description ?? null,
    createdAt: created_at,
  };
}

export function mapProjects(data: unknown): Project[] | null {
  if (!Array.isArray(data)) {
    return null;
  }

  const projects = data.map(mapProject);

  if (projects.some((project) => project === null)) {
    return null;
  }

  return projects as Project[];
}
