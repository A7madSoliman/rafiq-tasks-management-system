import { LoginForm } from '@/features/auth/components/login-form';
import { getSafeInvitationReturnPath } from '@/features/auth/utils/invitation-return-path';

type LoginPageProps = {
  searchParams: Promise<{
    next?: string | string[];
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { next } = await searchParams;

  const returnPath = getSafeInvitationReturnPath(next);

  return (
    <main className="px-lg sm:px-lg relative z-10 flex flex-1 items-center justify-center py-12">
      <LoginForm returnPath={returnPath} />
    </main>
  );
}
