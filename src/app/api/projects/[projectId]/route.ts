import { editProjectSchema } from '@/features/projects/schemas/edit-project-schema';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

type ProjectRouteContext = {
  params: Promise<{
    projectId: string;
  }>;
};

type ProjectDetails = {
  id: string;
  name: string;
  description: string | null;
};

function isProjectDetails(value: unknown): value is ProjectDetails {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    typeof value.id === 'string' &&
    'name' in value &&
    typeof value.name === 'string' &&
    'description' in value &&
    (typeof value.description === 'string' || value.description === null)
  );
}

export async function GET(_request: Request, { params }: ProjectRouteContext) {
  const { projectId } = await params;

  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;

  if (!accessToken) {
    return NextResponse.json({ message: 'No active session' }, { status: 401 });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !supabaseSecretKey) {
    return NextResponse.json({ message: 'Server configuration error.' }, { status: 500 });
  }

  const response = await fetch(
    `${supabaseUrl}/rest/v1/projects?id=eq.${encodeURIComponent(projectId)}&select=id,name,description&limit=1`,
    {
      method: 'GET',
      headers: {
        apikey: supabaseSecretKey,
        Authorization: `Bearer ${accessToken}`,
      },
      cache: 'no-store',
    },
  );

  const data: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    return NextResponse.json({ message: 'Unable to load project.' }, { status: response.status });
  }

  if (!Array.isArray(data) || data.length === 0) {
    return NextResponse.json({ message: 'Project not found.' }, { status: 404 });
  }

  const project = data[0];

  if (!isProjectDetails(project)) {
    return NextResponse.json({ message: 'Invalid project response.' }, { status: 502 });
  }

  return NextResponse.json(project, {
    status: 200,
  });
}

export async function PATCH(request: Request, { params }: ProjectRouteContext) {
  const { projectId } = await params;

  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;

  if (!accessToken) {
    return NextResponse.json({ message: 'No active session' }, { status: 401 });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !supabaseSecretKey) {
    return NextResponse.json({ message: 'Server configuration error.' }, { status: 500 });
  }

  const body: unknown = await request.json().catch(() => null);
  const result = editProjectSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      {
        message: 'Invalid project data.',
        fieldErrors: result.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const { name, description } = result.data;

  const response = await fetch(
    `${supabaseUrl}/rest/v1/projects?id=eq.${encodeURIComponent(projectId)}`,
    {
      method: 'PATCH',
      headers: {
        apikey: supabaseSecretKey,
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        description: description?.trim() || null,
      }),
      cache: 'no-store',
    },
  );

  const data: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      typeof data === 'object' &&
      data !== null &&
      'message' in data &&
      typeof data.message === 'string'
        ? data.message
        : 'Failed to update project.';

    return NextResponse.json({ message }, { status: response.status });
  }

  return NextResponse.json({ message: 'Project updated successfully.' }, { status: 200 });
}
