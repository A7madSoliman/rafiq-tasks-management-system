import { SignupForm } from '@/features/auth/components/signup-form';
import { getSafeInvitationReturnPath } from '@/features/auth/utils/invitation-return-path';

type SignupPageProps = {
  searchParams: Promise<{
    next?: string | string[];
  }>;
};

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const { next } = await searchParams;

  const returnPath = getSafeInvitationReturnPath(next);

  return (
    <main className="px-lg pt-xl sm:pt-md sm:pb-2xl relative z-10 flex flex-1 items-start justify-center pb-0 sm:px-0">
      <SignupForm returnPath={returnPath} />
    </main>
  );
}
