type CreateTaskPermissionParams = {
  userId: string;
  projectCreatedBy: string;
  memberRole: string | null;
};

export function canCreateTask({
  userId,
  projectCreatedBy,
  memberRole,
}: CreateTaskPermissionParams): boolean {
  // An explicit viewer role always denies task creation.
  if (memberRole === 'viewer') {
    return false;
  }

  // Project creators are allowed without a separate membership record.
  if (userId === projectCreatedBy) {
    return true;
  }

  return memberRole === 'owner' || memberRole === 'admin' || memberRole === 'member';
}
