import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { createProjectSchema } from '@/features/projects/schemas/create-project-schema';

export async function GET(request: Request) {
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

  const { searchParams } = new URL(request.url);

  const limitParam = searchParams.get('limit');
  const offsetParam = searchParams.get('offset');

  const limit = limitParam === null ? null : Number(limitParam);
  const offset = offsetParam === null ? null : Number(offsetParam);

  const hasInvalidLimit = limit !== null && (!Number.isInteger(limit) || limit <= 0);

  const hasInvalidOffset = offset !== null && (!Number.isInteger(offset) || offset < 0);

  if (hasInvalidLimit || hasInvalidOffset) {
    return NextResponse.json({ message: 'Invalid pagination parameters.' }, { status: 400 });
  }

  const projectsUrl = new URL('/rest/v1/rpc/get_projects', supabaseUrl);

  if (limit !== null) {
    projectsUrl.searchParams.set('limit', String(limit));
  }

  if (offset !== null) {
    projectsUrl.searchParams.set('offset', String(offset));
  }

  const response = await fetch(projectsUrl, {
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

  // Important:
  // Content-Range may still contain useful pagination metadata
  // even when Supabase returns an error such as 416.
  const contentRange = response.headers.get('content-range');

  const responseHeaders = new Headers();

  if (contentRange) {
    responseHeaders.set('Content-Range', contentRange);
  }

  if (!response.ok) {
    return NextResponse.json(
      { message: 'Unable to load projects.' },
      {
        status: response.status,
        headers: responseHeaders,
      },
    );
  }

  return NextResponse.json(data, {
    status: response.status,
    headers: responseHeaders,
  });
}

export async function POST(request: Request) {
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
  const result = createProjectSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      {
        message: 'Invalid project data.',
        fieldErrors: result.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const { title, description } = result.data;

  const response = await fetch(`${supabaseUrl}/rest/v1/projects`, {
    method: 'POST',
    headers: {
      apikey: supabaseSecretKey,
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: title,
      description: description?.trim() || null,
    }),
    cache: 'no-store',
  });

  if (!response.ok) {
    return NextResponse.json(
      {
        message: 'Failed To Add New Project, Try Again Later',
      },
      { status: response.status },
    );
  }

  return NextResponse.json(
    {
      message: 'Project created successfully.',
    },
    { status: 201 },
  );
}
