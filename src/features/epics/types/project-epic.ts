export type EpicUser = {
  userId: string;
  name: string;
  email: string;
  department: string;
};

export type ProjectEpic = {
  id: string;
  projectId: string;
  epicId: string;
  title: string;
  description: string | null;
  createdAt: string;
  deadline: string | null;
  createdBy: EpicUser;
  assignee: EpicUser | null;
};