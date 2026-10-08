import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createEpicSchema } from '@/features/epics/schemas/create-epic-schema';
import { mapProjectMembers } from '@/features/projects/utils/map-project-members';
import { mapProjectEpics } from '@/features/epics/utils/map-project-epics';

type ProjectEpicsRouteContext = {
  params: Promise<{
    projectId: string;
  }>;
};

export async function GET(request: Request, { params }: ProjectEpicsRouteContext) {
  const { projectId } = await params;

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

  const { searchParams } = new URL(request.url);

  const limitParam = searchParams.get('limit');
  const offsetParam = searchParams.get('offset');
  const searchTerm = searchParams.get('search')?.trim() ?? '';

  const limit = limitParam === null ? null : Number(limitParam);
  const offset = offsetParam === null ? null : Number(offsetParam);

  const hasInvalidLimit = limit !== null && (!Number.isInteger(limit) || limit <= 0);

  const hasInvalidOffset = offset !== null && (!Number.isInteger(offset) || offset < 0);

  if (hasInvalidLimit || hasInvalidOffset) {
    return NextResponse.json({ message: 'Invalid pagination parameters.' }, { status: 400 });
  }

  const epicsUrl = new URL('/rest/v1/project_epics', supabaseUrl);

  epicsUrl.searchParams.set('project_id', `eq.${projectId}`);

  if (searchTerm) {
    epicsUrl.searchParams.set('title', `ilike.%${searchTerm}%`);
  }

  if (limit !== null) {
    epicsUrl.searchParams.set('limit', String(limit));
  }

  if (offset !== null) {
    epicsUrl.searchParams.set('offset', String(offset));
  }

  const response = await fetch(epicsUrl, {
    method: 'GET',
    headers: {
      apikey: supabaseSecretKey,
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      Prefer: 'count=exact',
    },
    cache: 'no-store',
  });

  const data: unknown = await response.json().catch(() => null);

  const contentRange = response.headers.get('content-range');

  const responseHeaders = new Headers();

  if (contentRange) {
    responseHeaders.set('Content-Range', contentRange);
  }

  if (!response.ok) {
    return NextResponse.json(
      { message: 'Unable to load project epics.' },
      {
        status: response.status,
        headers: responseHeaders,
      },
    );
  }

  const epics = mapProjectEpics(data);

  if (!epics) {
    return NextResponse.json({ message: 'Invalid project epics response.' }, { status: 502 });
  }

  return NextResponse.json(epics, {
    status: response.status,
    headers: responseHeaders,
  });
}
export async function POST(request: Request, { params }: ProjectEpicsRouteContext) {
  const { projectId } = await params;

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

  const body: unknown = await request.json().catch(() => null);
  const result = createEpicSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      {
        message: 'Invalid epic data.',
        fieldErrors: result.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const { title, description, assigneeId, deadline } = result.data;

  if (assigneeId) {
    const membersResponse = await fetch(
      `${supabaseUrl}/rest/v1/get_project_members?project_id=eq.${encodeURIComponent(projectId)}`,
      {
        method: 'GET',
        headers: {
          apikey: supabaseSecretKey,
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      },
    );

    const membersData: unknown = await membersResponse.json().catch(() => null);

    if (!membersResponse.ok) {
      return NextResponse.json(
        { message: 'Unable to validate epic assignee.' },
        { status: membersResponse.status },
      );
    }

    const members = mapProjectMembers(membersData);

    if (!members) {
      return NextResponse.json({ message: 'Invalid project members response.' }, { status: 502 });
    }

    const isProjectMember = members.some((member) => member.userId === assigneeId);

    if (!isProjectMember) {
      return NextResponse.json(
        { message: 'Assignee must be a member of this project.' },
        { status: 400 },
      );
    }
  }

  const response = await fetch(`${supabaseUrl}/rest/v1/epics`, {
    method: 'POST',
    headers: {
      apikey: supabaseSecretKey,
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify({
      title,
      description: description || null,
      assignee_id: assigneeId || null,
      project_id: projectId,
      deadline: deadline || null,
    }),
    cache: 'no-store',
  });

  const data: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    return NextResponse.json(
      {
        message: 'Unable to create epic.',
      },
      { status: response.status },
    );
  }

  return NextResponse.json(data, { status: 201 });
}
