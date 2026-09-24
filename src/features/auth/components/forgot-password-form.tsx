'use client';
import { useForm } from 'react-hook-form';
import {
  forgotPasswordSchema,
  type ForgotPasswordFormValues,
} from '../schemas/forgot-password-schema';
import { zodResolver } from '@hookform/resolvers/zod';
import { FieldLabel } from '@/components/ui/field-label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function ForgotPasswordForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: 'onTouched',
    reValidateMode: 'onChange',
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = (_values: ForgotPasswordFormValues) => {};

  return (
    <section aria-labelledby="forgot-password-title" className="w-full max-w-[448px]">
      <div className="bg-surface flex w-full flex-col rounded-md p-8 shadow-[0_24px_48px_-12px_rgba(4,27,60,0.06)] sm:gap-8 sm:border sm:border-[rgba(195,198,214,0.3)] sm:p-[41px]">
        <header className="text-center">
          <h1
            id="forgot-password-title"
            className="text-foreground text-2xl leading-8 font-semibold sm:text-[32px] sm:leading-10 sm:tracking-[-0.8px]"
          >
            Forgot password?
          </h1>

          <p className="text-foreground-secondary mt-2 text-[14px] leading-5 sm:leading-[22.75px]">
            No worries, we&apos;ll send you reset instructions.
          </p>
        </header>

        <form
          noValidate
          className="mt-8 flex flex-col gap-4 sm:mt-0 sm:gap-6"
          onSubmit={handleSubmit(onSubmit)}
        >
          <div className="flex flex-col gap-1.5 sm:gap-2">
            <FieldLabel
              htmlFor="email"
              className="text-foreground-secondary text-[11px] leading-[16.5px] font-bold tracking-[0.55px] uppercase"
            >
              Email Address
            </FieldLabel>

            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              aria-invalid={Boolean(errors.email)}
              className="h-12 rounded-xs px-4 text-[16px] sm:rounded-sm"
              {...register('email')}
            />

            {errors.email && (
              <p className="text-error text-[11px] leading-[16.5px]">{errors.email.message}</p>
            )}
          </div>

          <Button type="submit" className="h-12 w-full cursor-pointer text-[14px] sm:text-[16px]">
            Send Reset Link
          </Button>
        </form>

        <div className="mt-6 flex justify-center">
          <Link href="/login" className="text-primary text-[14px] leading-5 font-medium">
            Back to log in
          </Link>
        </div>
      </div>
    </section>
  );
}
