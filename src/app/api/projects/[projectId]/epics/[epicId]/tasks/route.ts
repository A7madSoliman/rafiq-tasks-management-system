import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { mapProjectMembers } from '@/features/projects/utils/map-project-members';
import { parseContentRangeTotal } from '@/features/projects/utils/parse-content-range';
import { verifyAccessToken } from '@/lib/auth/session';
import type { EpicTask } from '@/features/epics/schemas/epic-task-schema';

type RouteContext = {
  params: Promise<{ projectId: string; epicId: string }>;
};

const projectSchema = z.object({ id: z.uuid(), created_by: z.uuid() });
const epicSchema = z.object({ id: z.uuid(), project_id: z.uuid() });
const taskSchema = z.object({
  id: z.uuid(),
  project_id: z.uuid(),
  epic_id: z.uuid(),
  title: z.string().nullable(),
  due_date: z.iso.datetime({ offset: true }).nullish(),
  assignee: z.object({ id: z.uuid().nullable(), name: z.string().nullable() }).nullish(),
});

export async function GET(request: Request, { params }: RouteContext) {
  const { projectId, epicId } = await params;

  if (!z.uuid().safeParse(projectId).success || !z.uuid().safeParse(epicId).success) {
    return NextResponse.json({ message: 'Invalid project or epic ID.' }, { status: 400 });
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

    const headers = { apikey: supabaseSecretKey, Authorization: `Bearer ${accessToken}` };
    const options = { method: 'GET', headers, cache: 'no-store', signal: request.signal } as const;
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
      projects.data.some((p) => p.id !== projectId)
    ) {
      return NextResponse.json({ message: 'Invalid project response.' }, { status: 502 });
    }
    if (projects.data.length === 0) {
      return NextResponse.json({ message: 'Project not found.' }, { status: 404 });
    }

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
    if (
      projects.data[0].created_by !== user.id &&
      !members.some((member) => member.userId === user.id)
    ) {
      return NextResponse.json(
        { message: 'You do not have permission to view tasks.' },
        { status: 403 },
      );
    }

    const epicUrl = new URL('/rest/v1/epics', supabaseUrl);
    epicUrl.searchParams.set('id', `eq.${epicId}`);
    epicUrl.searchParams.set('project_id', `eq.${projectId}`);
    epicUrl.searchParams.set('select', 'id,project_id');
    epicUrl.searchParams.set('limit', '1');
    const epicResponse = await fetch(epicUrl, options);
    if (!epicResponse.ok) {
      return NextResponse.json({ message: 'Unable to verify task epic.' }, { status: 502 });
    }

    const epics = epicSchema.array().safeParse(await epicResponse.json());
    if (
      !epics.success ||
      epics.data.length > 1 ||
      epics.data.some((epic) => epic.id !== epicId || epic.project_id !== projectId)
    ) {
      return NextResponse.json({ message: 'Invalid epic response.' }, { status: 502 });
    }
    if (epics.data.length === 0) {
      return NextResponse.json({ message: 'Epic not found.' }, { status: 404 });
    }

    const tasksUrl = new URL('/rest/v1/project_tasks', supabaseUrl);
    tasksUrl.searchParams.set('epic_id', `eq.${epicId}`);
    tasksUrl.searchParams.set('project_id', `eq.${projectId}`);
    tasksUrl.searchParams.set('select', 'id,project_id,epic_id,title,due_date,assignee');
    tasksUrl.searchParams.set('order', 'created_at.asc,id.asc');
    tasksUrl.searchParams.set('limit', '100');

    const tasks: EpicTask[] = [];
    do {
      tasksUrl.searchParams.set('offset', String(tasks.length));
      const response = await fetch(new URL(tasksUrl), {
        ...options,
        headers: { ...headers, Prefer: 'count=exact' },
      });
      if (!response.ok) {
        return NextResponse.json({ message: 'Unable to load epic tasks.' }, { status: 502 });
      }

      const total = parseContentRangeTotal(response.headers.get('content-range'));
      const page = taskSchema.array().safeParse(await response.json());
      if (
        total === null ||
        !page.success ||
        page.data.some((task) => task.project_id !== projectId || task.epic_id !== epicId)
      ) {
        return NextResponse.json({ message: 'Invalid epic tasks response.' }, { status: 502 });
      }
      if (
        (page.data.length === 0 && tasks.length < total) ||
        tasks.length + page.data.length > total
      ) {
        return NextResponse.json({ message: 'Incomplete epic tasks response.' }, { status: 502 });
      }

      tasks.push(
        ...page.data.map((task) => ({
          id: task.id,
          title: task.title?.trim() || 'Untitled task',
          assigneeName: task.assignee?.id ? task.assignee.name?.trim() || 'Unknown assignee' : null,
          dueDate: task.due_date ?? null,
        })),
      );
      if (tasks.length >= total) break;
    } while (true);
    return NextResponse.json(tasks, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ message: 'Unable to load epic tasks.' }, { status: 502 });
  }
}
