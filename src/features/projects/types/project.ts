export type Project = {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
};

export type ProjectDetails = Pick<Project, 'id' | 'name' | 'description'>;
