import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { mapProjectMembers } from '@/features/projects/utils/map-project-members';
import { createTaskSchema } from '@/features/tasks/schemas/create-task-schema';
import { canCreateTask } from '@/features/tasks/utils/can-create-task';
import { verifyAccessToken } from '@/lib/auth/session';

type TasksRouteContext = {
  params: Promise<{
    projectId: string;
  }>;
};

type ProjectOwnership = {
  id: string;
  created_by: string;
};

function isProjectOwnership(value: unknown): value is ProjectOwnership {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    typeof value.id === 'string' &&
    'created_by' in value &&
    typeof value.created_by === 'string'
  );
}

export async function POST(request: Request, { params }: TasksRouteContext) {
  const { projectId } = await params;

  if (!z.uuid().safeParse(projectId).success) {
    return NextResponse.json({ message: 'Invalid project ID.' }, { status: 400 });
  }

  const requestOrigin = request.headers.get('origin');
  const expectedOrigin = new URL(request.url).origin;

  if (requestOrigin !== expectedOrigin) {
    return NextResponse.json(
      { message: 'Cross-origin requests are not allowed.' },
      { status: 403 },
    );
  }

  const contentType = request.headers.get('content-type')?.split(';', 1)[0]?.trim().toLowerCase();

  if (contentType !== 'application/json') {
    return NextResponse.json(
      { message: 'Content-Type must be application/json.' },
      { status: 415 },
    );
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

    const body: unknown = await request.json().catch(() => null);
    const result = createTaskSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          message: 'Invalid task data.',
          fieldErrors: result.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const projectUrl = new URL('/rest/v1/projects', supabaseUrl);

    projectUrl.searchParams.set('id', `eq.${projectId}`);
    projectUrl.searchParams.set('select', 'id,created_by');
    projectUrl.searchParams.set('limit', '1');

    const headers = {
      apikey: supabaseSecretKey,
      Authorization: `Bearer ${accessToken}`,
    };

    const projectResponse = await fetch(projectUrl, {
      method: 'GET',
      headers,
      cache: 'no-store',
    });

    if (!projectResponse.ok) {
      return NextResponse.json({ message: 'Unable to verify project access.' }, { status: 502 });
    }

    const projectData: unknown = await projectResponse.json().catch(() => null);

    if (!Array.isArray(projectData)) {
      return NextResponse.json({ message: 'Invalid project response.' }, { status: 502 });
    }

    if (projectData.length === 0) {
      return NextResponse.json({ message: 'Project not found.' }, { status: 404 });
    }

    const project = projectData[0];

    if (!isProjectOwnership(project) || project.id !== projectId) {
      return NextResponse.json({ message: 'Invalid project response.' }, { status: 502 });
    }

    const membersUrl = new URL('/rest/v1/get_project_members', supabaseUrl);

    membersUrl.searchParams.set('project_id', `eq.${projectId}`);

    const membersResponse = await fetch(membersUrl, {
      method: 'GET',
      headers,
      cache: 'no-store',
    });

    if (!membersResponse.ok) {
      return NextResponse.json(
        { message: 'Unable to verify project membership.' },
        { status: 502 },
      );
    }

    const membersData: unknown = await membersResponse.json().catch(() => null);
    const members = mapProjectMembers(membersData);

    if (!members) {
      return NextResponse.json({ message: 'Invalid project members response.' }, { status: 502 });
    }

    // 1. Verify the current user's permission.
    const memberRole = members.find((member) => member.userId === user.id)?.role ?? null;

    if (
      !canCreateTask({
        userId: user.id,
        projectCreatedBy: project.created_by,
        memberRole,
      })
    ) {
      return NextResponse.json(
        { message: 'You do not have permission to create tasks.' },
        { status: 403 },
      );
    }

    // 2. Verify that the selected assignee belongs to this project.
    if (
      result.data.assigneeId &&
      !members.some((member) => member.userId === result.data.assigneeId)
    ) {
      return NextResponse.json(
        { message: 'Assignee must be a member of this project.' },
        { status: 400 },
      );
    }

    if (result.data.epicId) {
      const epicUrl = new URL('/rest/v1/epics', supabaseUrl);

      epicUrl.searchParams.set('select', 'id,project_id');
      epicUrl.searchParams.set('id', `eq.${result.data.epicId}`);
      epicUrl.searchParams.set('project_id', `eq.${projectId}`);
      epicUrl.searchParams.set('limit', '1');

      const epicResponse = await fetch(epicUrl, {
        method: 'GET',
        headers,
        cache: 'no-store',
      });

      if (!epicResponse.ok) {
        return NextResponse.json({ message: 'Unable to verify task epic.' }, { status: 502 });
      }

      const epicsData: unknown = await epicResponse.json().catch(() => null);

      if (!Array.isArray(epicsData)) {
        return NextResponse.json({ message: 'Invalid epic response.' }, { status: 502 });
      }

      if (epicsData.length === 0) {
        return NextResponse.json(
          { message: 'Selected epic does not belong to this project.' },
          { status: 400 },
        );
      }

      const epic: unknown = epicsData[0];

      if (
        typeof epic !== 'object' ||
        epic === null ||
        !('id' in epic) ||
        epic.id !== result.data.epicId ||
        !('project_id' in epic) ||
        epic.project_id !== projectId
      ) {
        return NextResponse.json({ message: 'Invalid epic response.' }, { status: 502 });
      }
    }

    const { title, description, epicId, assigneeId, dueDate, status } = result.data;

    const payload = {
      project_id: projectId,
      title,
      description: description || null,
      epic_id: epicId || null,
      assignee_id: assigneeId || null,
      due_date: dueDate ? new Date(`${dueDate}T00:00:00.000Z`).toISOString() : null,
      status,
    };

    const tasksUrl = new URL('/rest/v1/tasks', supabaseUrl);

    tasksUrl.searchParams.set(
      'select',
      'id,task_id,project_id,title,description,epic_id,assignee_id,due_date,status',
    );

    const taskResponse = await fetch(tasksUrl, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });

    if (!taskResponse.ok) {
      const responseStatus = [400, 401, 403, 409, 422].includes(taskResponse.status)
        ? taskResponse.status
        : 502;

      return NextResponse.json({ message: 'Unable to create task.' }, { status: responseStatus });
    }

    const createdData: unknown = await taskResponse.json().catch(() => null);

    const createdTask: unknown =
      Array.isArray(createdData) && createdData.length === 1 ? createdData[0] : null;

    if (
      typeof createdTask !== 'object' ||
      createdTask === null ||
      !('id' in createdTask) ||
      typeof createdTask.id !== 'string' ||
      !('project_id' in createdTask) ||
      createdTask.project_id !== projectId
    ) {
      return NextResponse.json({ message: 'Invalid task creation response.' }, { status: 502 });
    }

    return NextResponse.json({ task: createdTask }, { status: 201 });
  } catch {
    return NextResponse.json(
      { message: 'Unable to process task creation request.' },
      { status: 502 },
    );
  }
}
