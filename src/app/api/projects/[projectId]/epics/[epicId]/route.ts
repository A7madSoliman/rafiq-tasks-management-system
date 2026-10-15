import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { mapProjectEpics } from '@/features/epics/utils/map-project-epics';
import { z } from 'zod';
import { mapProjectMembers } from '@/features/projects/utils/map-project-members';
import { editEpicFieldSchema } from '@/features/epics/schemas/edit-epic-field-schema';
import { canEditEpic } from '@/features/epics/utils/can-edit-epic';
import { verifyAccessToken } from '@/lib/auth/session';

type ProjectEpicDetailsRouteContext = {
  params: Promise<{
    projectId: string;
    epicId: string;
  }>;
};

export async function GET(_request: Request, { params }: ProjectEpicDetailsRouteContext) {
  const { projectId, epicId } = await params;
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

  const epicUrl = new URL('/rest/v1/project_epics', supabaseUrl);

  epicUrl.searchParams.set('project_id', `eq.${projectId}`);
  epicUrl.searchParams.set('id', `eq.${epicId}`);

  const response = await fetch(epicUrl, {
    method: 'GET',
    headers: {
      apikey: supabaseSecretKey,
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  const data: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    return NextResponse.json(
      { message: 'Unable to load epic details.' },
      { status: response.status },
    );
  }

  const epics = mapProjectEpics(data);

  if (!epics) {
    return NextResponse.json({ message: 'Invalid epic details response.' }, { status: 502 });
  }

  if (epics.length === 0) {
    return NextResponse.json({ message: 'Epic not found.' }, { status: 404 });
  }

  if (epics.length > 1) {
    return NextResponse.json({ message: 'Invalid epic details response.' }, { status: 502 });
  }

  return NextResponse.json(epics[0], { status: 200 });
}

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

export async function PATCH(request: Request, { params }: ProjectEpicDetailsRouteContext) {
  const { projectId, epicId } = await params;

  if (!z.uuid().safeParse(projectId).success || !z.uuid().safeParse(epicId).success) {
    return NextResponse.json({ message: 'Invalid project or epic ID.' }, { status: 400 });
  }

  // Follow the same CSRF boundary as the existing task-creation endpoint.
  if (request.headers.get('origin') !== new URL(request.url).origin) {
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
    const result = editEpicFieldSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ message: 'Invalid epic data.' }, { status: 400 });
    }

    const headers = {
      apikey: supabaseSecretKey,
      Authorization: `Bearer ${accessToken}`,
    };

    const projectUrl = new URL('/rest/v1/projects', supabaseUrl);
    projectUrl.searchParams.set('id', `eq.${projectId}`);
    projectUrl.searchParams.set('select', 'id,created_by');
    projectUrl.searchParams.set('limit', '1');

    const projectResponse = await fetch(projectUrl, {
      method: 'GET',
      headers,
      cache: 'no-store',
    });

    if (!projectResponse.ok) {
      return NextResponse.json({ message: 'Unable to verify project access.' }, { status: 502 });
    }

    const projectData: unknown = await projectResponse.json().catch(() => null);

    if (!Array.isArray(projectData) || projectData.length !== 1) {
      return NextResponse.json({ message: 'Project not found.' }, { status: 404 });
    }

    const project: unknown = projectData[0];

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

    const memberRole = members.find((member) => member.userId === user.id)?.role ?? null;

    if (!canEditEpic({ userId: user.id, projectCreatedBy: project.created_by, memberRole })) {
      return NextResponse.json(
        { message: 'You do not have permission to edit epics.' },
        { status: 403 },
      );
    }

    const assigneeId = 'assignee_id' in result.data ? result.data.assignee_id : null;

    if (assigneeId !== null && !members.some((member) => member.userId === assigneeId)) {
      return NextResponse.json(
        { message: 'Assignee must be a member of this project.' },
        { status: 400 },
      );
    }

    const epicUrl = new URL('/rest/v1/epics', supabaseUrl);
    epicUrl.searchParams.set('id', `eq.${epicId}`);
    epicUrl.searchParams.set('project_id', `eq.${projectId}`);
    epicUrl.searchParams.set('select', 'id,project_id');
    epicUrl.searchParams.set('limit', '1');

    const epicResponse = await fetch(epicUrl, {
      method: 'GET',
      headers,
      cache: 'no-store',
    });

    if (!epicResponse.ok) {
      return NextResponse.json({ message: 'Unable to verify epic access.' }, { status: 502 });
    }

    const epicData: unknown = await epicResponse.json().catch(() => null);

    if (!Array.isArray(epicData)) {
      return NextResponse.json({ message: 'Invalid epic response.' }, { status: 502 });
    }

    if (epicData.length === 0) {
      return NextResponse.json({ message: 'Epic not found.' }, { status: 404 });
    }

    const epic: unknown = epicData[0];

    if (
      epicData.length !== 1 ||
      typeof epic !== 'object' ||
      epic === null ||
      !('id' in epic) ||
      epic.id !== epicId ||
      !('project_id' in epic) ||
      epic.project_id !== projectId
    ) {
      return NextResponse.json({ message: 'Invalid epic response.' }, { status: 502 });
    }

    const updateUrl = new URL('/rest/v1/epics', supabaseUrl);
    updateUrl.searchParams.set('id', `eq.${epicId}`);
    updateUrl.searchParams.set('project_id', `eq.${projectId}`);

    const updateResponse = await fetch(updateUrl, {
      method: 'PATCH',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(result.data),
      cache: 'no-store',
    });

    if (!updateResponse.ok) {
      return NextResponse.json(
        { message: 'Failed to update epic. Please try again.' },
        { status: updateResponse.status >= 500 ? 502 : updateResponse.status },
      );
    }

    // PostgREST PATCH can succeed with 204 No Content; do not parse a response body.
    return NextResponse.json({ message: 'Epic updated successfully.' }, { status: 200 });
  } catch {
    return NextResponse.json(
      { message: 'Failed to update epic. Please try again.' },
      { status: 502 },
    );
  }
}
