import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { mapProjectEpics } from '@/features/epics/utils/map-project-epics';

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
