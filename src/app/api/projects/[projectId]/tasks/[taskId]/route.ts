import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { mapProjectMembers } from '@/features/projects/utils/map-project-members';
import { taskDetailsSchema } from '@/features/tasks/schemas/task-details-schema';
import { verifyAccessToken } from '@/lib/auth/session';

type RouteContext = {
  params: Promise<{
    projectId: string;
    taskId: string;
  }>;
};

const projectSchema = z.object({
  id: z.uuid(),
  created_by: z.uuid(),
});

const userSchema = z
  .object({
    id: z.uuid().nullable(),
    name: z.string().nullable(),
  })
  .nullish();

const taskRowSchema = z.object({
  id: z.uuid(),
  project_id: z.uuid(),
  epic_id: z.uuid().nullable(),
  task_id: z.string().nullish(),
  title: z.string().nullable(),
  description: z.string().nullish(),
  status: z.string().min(1),
  due_date: z.iso.datetime({ offset: true }).nullish(),
  created_at: z.iso.datetime({ offset: true }).nullish(),
  assignee: userSchema,
  created_by: userSchema,
  epic: z
    .object({
      id: z.uuid().nullable(),
      epic_id: z.string().nullable(),
      title: z.string().nullable(),
    })
    .nullish(),
});

export async function GET(request: Request, { params }: RouteContext) {
  const { projectId, taskId } = await params;

  if (!z.uuid().safeParse(projectId).success || !z.uuid().safeParse(taskId).success) {
    return NextResponse.json({ message: 'Invalid project or task ID.' }, { status: 400 });
  }

  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;

  if (!accessToken) {
    return NextResponse.json({ message: 'No active session.' }, { status: 401 });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !supabaseSecretKey) {
    return NextResponse.json({ message: 'Server configuration error.' }, { status: 500 });
  }

  try {
    const user = await verifyAccessToken(accessToken);

    if (!user) {
      return NextResponse.json({ message: 'Invalid or expired session.' }, { status: 401 });
    }

    const headers = {
      apikey: supabaseSecretKey,
      Authorization: `Bearer ${accessToken}`,
    };

    const options = {
      method: 'GET',
      headers,
      cache: 'no-store',
      signal: request.signal,
    } as const;

    // Verify the project exists.
    const projectUrl = new URL('/rest/v1/projects', supabaseUrl);

    projectUrl.searchParams.set('id', `eq.${projectId}`);
    projectUrl.searchParams.set('select', 'id,created_by');
    projectUrl.searchParams.set('limit', '1');

    const projectResponse = await fetch(projectUrl, options);

    if (!projectResponse.ok) {
      return NextResponse.json({ message: 'Unable to verify project access.' }, { status: 502 });
    }

    const projects = projectSchema.array().safeParse(await projectResponse.json());

    if (
      !projects.success ||
      projects.data.length > 1 ||
      projects.data.some((project) => project.id !== projectId)
    ) {
      return NextResponse.json({ message: 'Invalid project response.' }, { status: 502 });
    }

    const project = projects.data[0];

    if (!project) {
      return NextResponse.json({ message: 'Project not found.' }, { status: 404 });
    }

    // Verify the current user's membership.
    const membersUrl = new URL('/rest/v1/get_project_members', supabaseUrl);

    membersUrl.searchParams.set('project_id', `eq.${projectId}`);

    const membersResponse = await fetch(membersUrl, options);

    if (!membersResponse.ok) {
      return NextResponse.json(
        { message: 'Unable to verify project membership.' },
        { status: 502 },
      );
    }

    const members = mapProjectMembers(await membersResponse.json());

    if (!members) {
      return NextResponse.json({ message: 'Invalid project members response.' }, { status: 502 });
    }

    const isOwner = project.created_by === user.id;
    const isMember = members.some((member) => member.userId === user.id);

    if (!isOwner && !isMember) {
      return NextResponse.json(
        { message: 'You do not have permission to view tasks.' },
        { status: 403 },
      );
    }

    // Fetch exactly the selected task within its project.
    const taskUrl = new URL('/rest/v1/project_tasks', supabaseUrl);

    taskUrl.searchParams.set('project_id', `eq.${projectId}`);
    taskUrl.searchParams.set('id', `eq.${taskId}`);
    taskUrl.searchParams.set(
      'select',
      [
        'id',
        'project_id',
        'epic_id',
        'task_id',
        'title',
        'description',
        'status',
        'due_date',
        'created_at',
        'assignee',
        'created_by',
        'epic',
      ].join(','),
    );
    taskUrl.searchParams.set('limit', '2');

    const taskResponse = await fetch(taskUrl, options);

    if (!taskResponse.ok) {
      return NextResponse.json({ message: 'Unable to load task details.' }, { status: 502 });
    }

    const tasks = taskRowSchema.array().safeParse(await taskResponse.json());

    if (
      !tasks.success ||
      tasks.data.length > 1 ||
      tasks.data.some(
        (task) =>
          task.id !== taskId ||
          task.project_id !== projectId ||
          (task.epic?.id != null && task.epic.id !== task.epic_id),
      )
    ) {
      return NextResponse.json({ message: 'Invalid task details response.' }, { status: 502 });
    }

    const task = tasks.data[0];

    if (!task) {
      return NextResponse.json({ message: 'Task not found.' }, { status: 404 });
    }

    // Return only fields needed by the UI.
    const result = taskDetailsSchema.safeParse({
      id: task.id,
      projectId: task.project_id,
      taskCode: task.task_id?.trim() || null,
      title: task.title?.trim() || 'Untitled task',
      description: task.description?.trim() || null,
      status: task.status,
      epic: task.epic_id
        ? {
            id: task.epic_id,
            code: task.epic?.epic_id?.trim() || null,
            title: task.epic?.title?.trim() || null,
          }
        : null,
      assigneeName: task.assignee?.id ? task.assignee.name?.trim() || 'Unknown assignee' : null,
      createdByName: task.created_by?.id ? task.created_by.name?.trim() || 'Unknown user' : null,
      dueDate: task.due_date ?? null,
      createdAt: task.created_at ?? null,
    });

    if (!result.success) {
      return NextResponse.json({ message: 'Invalid task details response.' }, { status: 502 });
    }

    return NextResponse.json(result.data, {
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  } catch {
    return NextResponse.json({ message: 'Unable to load task details.' }, { status: 502 });
  }
}
