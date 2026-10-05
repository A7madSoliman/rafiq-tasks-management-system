import type { EpicUser, ProjectEpic } from '../types/project-epic';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function mapEpicUser(value: unknown): EpicUser | null {
  if (
    !isRecord(value) ||
    typeof value.sub !== 'string' ||
    typeof value.name !== 'string' ||
    typeof value.email !== 'string' ||
    typeof value.department !== 'string'
  ) {
    return null;
  }

  return {
    userId: value.sub,
    name: value.name,
    email: value.email,
    department: value.department,
  };
}

function isEpicUser(value: unknown): value is EpicUser {
  return (
    isRecord(value) &&
    typeof value.userId === 'string' &&
    typeof value.name === 'string' &&
    typeof value.email === 'string' &&
    typeof value.department === 'string'
  );
}

function isEmptyAssignee(value: unknown): boolean {
  return (
    isRecord(value) &&
    value.sub === null &&
    value.name === null &&
    value.email === null &&
    value.department === null
  );
}

function mapProjectEpic(value: unknown): ProjectEpic | null {
  if (!isRecord(value)) {
    return null;
  }

  const {
    id,
    project_id,
    epic_id,
    title,
    description,
    created_at,
    deadline,
    created_by,
    assignee,
  } = value;

  if (
    typeof id !== 'string' ||
    typeof project_id !== 'string' ||
    typeof epic_id !== 'string' ||
    typeof title !== 'string' ||
    typeof created_at !== 'string'
  ) {
    return null;
  }

  if (description !== null && typeof description !== 'string') {
    return null;
  }

  if (deadline !== null && typeof deadline !== 'string') {
    return null;
  }

  const createdBy = mapEpicUser(created_by);

  if (!createdBy) {
    return null;
  }

  let mappedAssignee: EpicUser | null;

  if (isEmptyAssignee(assignee)) {
    mappedAssignee = null;
  } else {
    mappedAssignee = mapEpicUser(assignee);

    if (!mappedAssignee) {
      return null;
    }
  }

  return {
    id,
    projectId: project_id,
    epicId: epic_id,
    title,
    description,
    createdAt: created_at,
    deadline,
    createdBy,
    assignee: mappedAssignee,
  };
}

export function mapProjectEpics(value: unknown): ProjectEpic[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const epics = value.map(mapProjectEpic);

  if (epics.some((epic) => epic === null)) {
    return null;
  }

  return epics as ProjectEpic[];
}

export function isProjectEpic(value: unknown): value is ProjectEpic {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.projectId === 'string' &&
    typeof value.epicId === 'string' &&
    typeof value.title === 'string' &&
    (value.description === null || typeof value.description === 'string') &&
    typeof value.createdAt === 'string' &&
    (value.deadline === null || typeof value.deadline === 'string') &&
    isEpicUser(value.createdBy) &&
    (value.assignee === null || isEpicUser(value.assignee))
  );
}

export function isProjectEpics(value: unknown): value is ProjectEpic[] {
  return Array.isArray(value) && value.every(isProjectEpic);
}
