import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createEpicSchema } from '@/features/epics/schemas/create-epic-schema';

type CreateEpicRouteContext = {
  params: Promise<{
    projectId: string;
  }>;
};

export async function POST(request: Request, { params }: CreateEpicRouteContext) {
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
