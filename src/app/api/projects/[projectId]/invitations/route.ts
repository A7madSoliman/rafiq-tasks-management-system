import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { inviteMemberSchema } from '@/features/invitations/schemas/invite-member-schema';
import { mapProjectMembers } from '@/features/projects/utils/map-project-members';
import { verifyAccessToken } from '@/lib/auth/session';
import { canInviteProjectMember } from '@/features/invitations/utils/can-invite-project-member';

type InvitationsRouteContext = {
  params: Promise<{
    projectId: string;
  }>;
};

const projectRecordSchema = z.object({
  id: z.uuid(),
  created_by: z.uuid(),
});

function serverError() {
  return NextResponse.json({ message: 'Unable to send invitation.' }, { status: 502 });
}

export async function POST(request: Request, { params }: InvitationsRouteContext) {
  const { projectId } = await params;

  // 1. Validate project ID.
  if (!z.uuid().safeParse(projectId).success) {
    return NextResponse.json({ message: 'Invalid project ID.' }, { status: 400 });
  }

  // 2. Prevent cross-origin cookie-based submissions.
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

  // 3. Validate submitted form data.
  const body: unknown = await request.json().catch(() => null);
  const result = inviteMemberSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      {
        message: 'Invalid invitation data.',
        fieldErrors: result.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  // 4. Read the authenticated session.
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;

  if (!accessToken) {
    return NextResponse.json({ message: 'No active session.' }, { status: 401 });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;
  const appUrl = process.env.APP_URL;

  if (!supabaseUrl || !supabaseSecretKey || !appUrl) {
    return NextResponse.json({ message: 'Server configuration error.' }, { status: 500 });
  }

  // 5. Validate trusted server configuration.
  let appOrigin: string;
  let supabaseOrigin: string;

  try {
    const frontendUrl = new URL(appUrl);
    const backendUrl = new URL(supabaseUrl);

    const isValidFrontend =
      frontendUrl.protocol === 'https:' ||
      (frontendUrl.protocol === 'http:' &&
        ['localhost', '127.0.0.1'].includes(frontendUrl.hostname));

    if (!isValidFrontend || backendUrl.protocol !== 'https:') {
      throw new Error('Invalid server URL configuration.');
    }

    appOrigin = frontendUrl.origin;
    supabaseOrigin = backendUrl.origin;
  } catch {
    return NextResponse.json({ message: 'Server configuration error.' }, { status: 500 });
  }

  try {
    // 6. Verify the access token.
    const user = await verifyAccessToken(accessToken);

    if (!user) {
      return NextResponse.json({ message: 'Invalid or expired session.' }, { status: 401 });
    }

    const headers = {
      apikey: supabaseSecretKey,
      Authorization: `Bearer ${accessToken}`,
    };

    // 7. Verify project existence and creator.
    const projectUrl = new URL('/rest/v1/projects', supabaseOrigin);

    projectUrl.searchParams.set('id', `eq.${projectId}`);
    projectUrl.searchParams.set('select', 'id,created_by');
    projectUrl.searchParams.set('limit', '1');

    const projectResponse = await fetch(projectUrl, {
      method: 'GET',
      headers,
      cache: 'no-store',
    });

    if (!projectResponse.ok) {
      return serverError();
    }

    const projectData: unknown = await projectResponse.json().catch(() => null);

    const parsedProjects = z.array(projectRecordSchema).safeParse(projectData);

    if (!parsedProjects.success) {
      return serverError();
    }

    if (parsedProjects.data.length === 0) {
      return NextResponse.json({ message: 'Project not found.' }, { status: 404 });
    }

    const project = parsedProjects.data[0];

    if (project.id !== projectId) {
      return serverError();
    }

    // 8. Retrieve the current user's project role.
    const membersUrl = new URL('/rest/v1/get_project_members', supabaseOrigin);

    membersUrl.searchParams.set('project_id', `eq.${projectId}`);

    const membersResponse = await fetch(membersUrl, {
      method: 'GET',
      headers,
      cache: 'no-store',
    });

    if (!membersResponse.ok) {
      return serverError();
    }

    const membersData: unknown = await membersResponse.json().catch(() => null);

    const members = mapProjectMembers(membersData);

    if (!members) {
      return serverError();
    }

    const memberRole = members.find((member) => member.userId === user.id)?.role ?? null;

    // 9. Enforce Owner/Admin/Member permissions.
    const isAllowed = canInviteProjectMember({
      userId: user.id,
      projectCreatedBy: project.created_by,
      memberRole,
    });

    if (!isAllowed) {
      return NextResponse.json(
        {
          message: 'You do not have permission to invite project members.',
        },
        { status: 403 },
      );
    }

    // 10. Call the backend RPC as the authenticated user.
    const rpcUrl = new URL('/rest/v1/rpc/invite_member', supabaseOrigin);

    const invitationResponse = await fetch(rpcUrl, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        p_email: result.data.email,
        p_project_id: projectId,
        p_app_url: appOrigin,
        p_base_url: supabaseOrigin,
      }),
      cache: 'no-store',
    });

    if (!invitationResponse.ok) {
      const allowedStatuses = [400, 401, 403, 409, 422, 429];

      const responseStatus = allowedStatuses.includes(invitationResponse.status)
        ? invitationResponse.status
        : 502;

      return NextResponse.json(
        { message: 'Unable to send invitation.' },
        { status: responseStatus },
      );
    }

    return NextResponse.json({ message: 'Invitation sent successfully.' }, { status: 200 });
  } catch {
    return serverError();
  }
}
