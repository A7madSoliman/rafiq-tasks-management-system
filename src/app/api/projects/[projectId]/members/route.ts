import { mapProjectMembers } from '@/features/projects/utils/map-project-members';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

type ProjectMembersRouteContext = {
  params: Promise<{
    projectId: string;
  }>;
};

export async function GET(_request: Request, { params }: ProjectMembersRouteContext) {
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

  const response = await fetch(
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

  const data: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    return NextResponse.json(
      { message: 'Unable to load project members.' },
      { status: response.status },
    );
  }

  const members = mapProjectMembers(data);

  if (!members) {
    return NextResponse.json({ message: 'Invalid project members response.' }, { status: 502 });
  }

  return NextResponse.json(members, {
    status: 200,
  });
}
