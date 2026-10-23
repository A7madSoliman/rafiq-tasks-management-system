import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import TasklyMark from '@/assets/icons/taskly-mark.svg';
import { SessionRestore } from '@/components/shared/authenticated-layout/session-restore';
import { getAuthPageHref } from '@/features/auth/utils/invitation-return-path';
import { acceptInvitationSchema } from '@/features/invitations/schemas/accept-invitation-schema';
import { getAuthState } from '@/lib/auth/session';
import { AcceptInvitationView } from '@/features/invitations/components/accept-invitation-view';

export const metadata: Metadata = {
  title: 'Accept Invitation | Taskly',
  robots: {
    index: false,
    follow: false,
  },
};

type InvitePageProps = {
  searchParams: Promise<{
    token?: string | string[];
  }>;
};

function InvitationPageFrame({ children }: { children: React.ReactNode }) {
  return (
    <main className="bg-background flex min-h-dvh w-full min-w-0 items-center justify-center px-4 py-12 sm:px-6">
      <div className="mx-auto flex w-full max-w-[576px] min-w-0 flex-col gap-12">
        <div className="flex w-full items-center justify-center gap-2">
          <TasklyMark aria-hidden="true" />

          <span className="text-foreground text-2xl leading-7 font-bold tracking-[-0.5px]">
            TASKLY
          </span>
        </div>

        {children}
      </div>
    </main>
  );
}

function InvalidInvitation() {
  return (
    <InvitationPageFrame>
      <section className="bg-surface relative overflow-hidden rounded-md px-6 py-12 text-center shadow-[0_24px_48px_-12px_rgba(4,27,60,0.06)] sm:px-12">
        <div className="from-primary to-primary-container absolute inset-x-0 top-0 h-1 bg-gradient-to-r" />

        <h1 className="text-foreground text-2xl font-semibold">Invalid Invitation</h1>

        <p className="text-foreground-secondary mt-4 text-sm">
          This invitation link is missing or invalid. Please request a new invitation.
        </p>

        <Link
          href="/project"
          className="text-primary mt-6 inline-block text-sm font-semibold underline"
        >
          Go to Projects
        </Link>
      </section>
    </InvitationPageFrame>
  );
}

export default async function InvitePage({ searchParams }: InvitePageProps) {
  const { token: rawToken } = await searchParams;

  const parsed = acceptInvitationSchema.safeParse({
    token: rawToken,
  });

  if (!parsed.success) {
    return <InvalidInvitation />;
  }

  const token = parsed.data.token;

  const returnPath = `/invite?${new URLSearchParams({
    token,
  }).toString()}`;

  const loginHref = getAuthPageHref('/login', returnPath);

  const authState = await getAuthState();

  if (authState.status === 'unauthenticated') {
    redirect(loginHref);
  }

  if (authState.status === 'refreshable') {
    return <SessionRestore loginHref={loginHref} />;
  }

  return (
    <InvitationPageFrame>
      <AcceptInvitationView token={token} />
    </InvitationPageFrame>
  );
}
