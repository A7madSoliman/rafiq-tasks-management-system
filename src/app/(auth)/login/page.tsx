import { LoginForm } from '@/features/auth/components/login-form';

export default function LoginPage() {
  return (
    <main className="px-lg sm:px-lg relative z-10 flex min-h-0 flex-1 flex-col pt-4 pb-12 sm:justify-center sm:py-[147px]">
      <LoginForm />
    </main>
  );
}
