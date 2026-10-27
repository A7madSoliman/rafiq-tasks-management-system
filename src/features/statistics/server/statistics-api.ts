import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { mapProjectMembers } from '@/features/projects/utils/map-project-members';
import { verifyAccessToken } from '@/lib/auth/session';

import {
  calendarMatchesRange,
  calendarStatisticsRequestSchema,
  calendarStatisticsSchema,
  projectsStatisticsRequestSchema,
  projectsStatisticsSchema,
} from '../schemas/statistics-schema';

const noStoreHeaders = { 'Cache-Control': 'no-store' };

function failure(message: string, status: number) {
  return NextResponse.json({ message }, { status, headers: noStoreHeaders });
}

function upstreamStatus(status: number) {
  return [400, 401, 403, 422, 429].includes(status) ? status : 502;
}

// Use the same scoped project + member reads as the task-list endpoint.
async function verifyProjectAccess(
  projectId: string,
  userId: string,
  supabaseUrl: string,
  headers: Record<string, string>,
): Promise<NextResponse | null> {
  const projectUrl = new URL('/rest/v1/projects', supabaseUrl);
  projectUrl.searchParams.set('id', `eq.${projectId}`);
  projectUrl.searchParams.set('select', 'id,created_by');
  projectUrl.searchParams.set('limit', '2');
  const projectResponse = await fetch(projectUrl, { headers, cache: 'no-store' });
  if (!projectResponse.ok)
    return failure('Unable to verify project access.', upstreamStatus(projectResponse.status));

  const projects = z
    .array(z.strictObject({ id: z.uuid(), created_by: z.uuid() }))
    .max(1)
    .safeParse(await projectResponse.json().catch(() => null));
  if (!projects.success || projects.data.some((project) => project.id !== projectId))
    return failure('Unable to verify project access.', 502);
  const project = projects.data[0];
  if (!project) return failure('Project not found.', 404);

  const membersUrl = new URL('/rest/v1/get_project_members', supabaseUrl);
  membersUrl.searchParams.set('project_id', `eq.${projectId}`);
  const membersResponse = await fetch(membersUrl, { headers, cache: 'no-store' });
  if (!membersResponse.ok)
    return failure('Unable to verify project access.', upstreamStatus(membersResponse.status));
  const members = mapProjectMembers(await membersResponse.json().catch(() => null));
  if (!members) return failure('Unable to verify project access.', 502);

  if (project.created_by !== userId && !members.some((member) => member.userId === userId))
    return failure('You do not have permission to view project statistics.', 403);
  return null;
}

// Server API boundary only. Secrets and the cookie token never enter response data.
export async function handleStatisticsRequest(request: Request, kind: 'calendar' | 'projects') {
  if (request.headers.get('origin') !== new URL(request.url).origin)
    return failure('Cross-origin requests are not allowed.', 403);
  if (
    request.headers.get('content-type')?.split(';', 1)[0]?.trim().toLowerCase() !==
    'application/json'
  )
    return failure('Content-Type must be application/json.', 415);

  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('access_token')?.value;
    if (!accessToken) return failure('No active session.', 401);

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;
    if (!supabaseUrl || !supabaseSecretKey) return failure('Server configuration error.', 500);

    const user = await verifyAccessToken(accessToken);
    if (!user) return failure('Invalid or expired session.', 401);

    const body: unknown = await request.json().catch(() => null);
    const parsed =
      kind === 'calendar'
        ? calendarStatisticsRequestSchema.safeParse(body)
        : projectsStatisticsRequestSchema.safeParse(body);
    if (!parsed.success) return failure('Invalid statistics filters.', 400);

    const input = parsed.data;
    const headers = {
      apikey: supabaseSecretKey,
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };
    if ('p_project_id' in input && typeof input.p_project_id === 'string') {
      const denied = await verifyProjectAccess(input.p_project_id, user.id, supabaseUrl, headers);
      if (denied) return denied;
    }

    const rpc = kind === 'calendar' ? 'get_tasks_calendar_stats' : 'get_tasks_count_per_project';
    const response = await fetch(new URL(`/rest/v1/rpc/${rpc}`, supabaseUrl), {
      method: 'POST',
      headers,
      body: JSON.stringify(input),
      cache: 'no-store',
    });
    if (!response.ok) return failure('Unable to load statistics.', upstreamStatus(response.status));
    const data: unknown = await response.json().catch(() => null);

    if (kind === 'calendar') {
      const result = calendarStatisticsSchema.safeParse(data);
      if (!result.success || !calendarMatchesRange(result.data, input))
        return failure('Invalid statistics response.', 502);
      return NextResponse.json(result.data, { headers: noStoreHeaders });
    }

    const result = projectsStatisticsSchema.safeParse(data);
    if (!result.success) return failure('Invalid statistics response.', 502);
    return NextResponse.json(result.data, { headers: noStoreHeaders });
  } catch {
    return failure('Unable to load statistics.', 502);
  }
}
