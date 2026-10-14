type EditEpicPermissionParams = {
  userId: string;
  projectCreatedBy: string;
  memberRole: string | null;
};

export function canEditEpic({
  userId,
  projectCreatedBy,
  memberRole,
}: EditEpicPermissionParams): boolean {
  // Match existing project mutation permissions; viewers remain read-only.
  if (memberRole === 'viewer') return false;
  if (userId === projectCreatedBy) return true;
  return memberRole === 'owner' || memberRole === 'admin' || memberRole === 'member';
}
