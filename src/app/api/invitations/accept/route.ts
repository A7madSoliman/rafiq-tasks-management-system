import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { acceptInvitationSchema } from '@/features/invitations/schemas/accept-invitation-schema';
import { verifyAccessToken } from '@/lib/auth/session';

const projectIdSchema = z.uuid();

function extractProjectId(value: unknown): string | null {
  // Only use a project ID if the backend explicitly returns one.
  if (projectIdSchema.safeParse(value).success) {
    return value as string;
  }

  if (typeof value !== 'object' || value === null) {
    return null;
  }

  const projectId =
    'project_id' in value ? value.project_id : 'projectId' in value ? value.projectId : null;

  return projectIdSchema.safeParse(projectId).success ? (projectId as string) : null;
}

function json(body: { message: string; projectId?: string | null }, status: number) {
  return NextResponse.json(body, {
    status,
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}

export async function POST(request: Request) {
  // Prevent cross-origin cookie-based submissions.
  if (request.headers.get('origin') !== new URL(request.url).origin) {
    return json({ message: 'Cross-origin requests are not allowed.' }, 403);
  }

  const contentType = request.headers.get('content-type')?.split(';', 1)[0]?.trim().toLowerCase();

  if (contentType !== 'application/json') {
    return json({ message: 'Content-Type must be application/json.' }, 415);
  }

  const body: unknown = await request.json().catch(() => null);
  const parsed = acceptInvitationSchema.safeParse(body);

  if (!parsed.success) {
    return json({ message: 'Invalid invitation token.' }, 400);
  }

  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;

  if (!accessToken) {
    return json({ message: 'No active session.' }, 401);
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !supabaseSecretKey) {
    return json({ message: 'Server configuration error.' }, 500);
  }

  try {
    const user = await verifyAccessToken(accessToken);

    if (!user) {
      return json({ message: 'Invalid or expired session.' }, 401);
    }

    const rpcUrl = new URL('/rest/v1/rpc/accept_invitation', supabaseUrl);

    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: {
        apikey: supabaseSecretKey,
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        p_token: parsed.data.token,
      }),
      cache: 'no-store',
    });

    if (!response.ok) {
      const allowedStatuses = [400, 401, 403, 404, 409, 410, 422, 429];

      const responseStatus = allowedStatuses.includes(response.status) ? response.status : 502;

      return json(
        {
          message:
            responseStatus === 400 || responseStatus === 404 || responseStatus === 410
              ? 'This invitation is invalid or has expired.'
              : 'Unable to accept invitation. Please try again.',
        },
        responseStatus,
      );
    }

    // PostgREST RPCs may return 204 with no body.
    // The actual response contract has not been documented.
    const result: unknown =
      response.status === 204 ? null : await response.json().catch(() => null);

    if (
      result === false ||
      (typeof result === 'object' &&
        result !== null &&
        'success' in result &&
        result.success === false)
    ) {
      return json({ message: 'Invitation could not be accepted.' }, 400);
    }

    const projectId = extractProjectId(result);

    return json(
      {
        message: 'Invitation accepted successfully.',
        projectId,
      },
      200,
    );
  } catch {
    // Never log the token or server credentials.
    return json({ message: 'Unable to accept invitation.' }, 502);
  }
}
