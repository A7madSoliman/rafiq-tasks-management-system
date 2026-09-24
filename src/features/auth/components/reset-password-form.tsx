'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { ResetPasswordFormValues, resetPasswordSchema } from '../schemas/reset-password-schema';
import { FieldLabel } from '@/components/ui/field-label';
import { Input } from '@/components/ui/input';
import EyeOffIcon from '@/assets/icons/eye-off.svg';
import EyeOnIcon from '@/assets/icons/eye-on.svg';
import ValidationPassedIcon from '@/assets/icons/validation-passed.svg';
import ValidationPendingIcon from '@/assets/icons/validation-pending.svg';
import { getPasswordChecks } from '../validation/password-rules';
import { Button } from '@/components/ui/button';
import ArrowLeftIcon from '@/assets/icons/arrow-left.svg';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

const inputClassName =
  'h-12 rounded-sm px-[17px] py-[14px] text-[16px] text-foreground placeholder:text-foreground-subtle';
const passwordInputClassName = `${inputClassName} pr-12`;
const labelClassName =
  'pl-2xs text-[11px] leading-[16.5px] tracking-[0.55px] text-foreground-secondary sm:text-foreground-muted';

export function ResetPasswordForm() {
  const router = useRouter();
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    mode: 'onTouched',
    reValidateMode: 'onChange',
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const password = useWatch({
    control,
    name: 'password',
    defaultValue: '',
  });

  const passwordChecks = getPasswordChecks(password);

  const onSubmit = async (values: ResetPasswordFormValues) => {
    setSubmitError(null);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      const data: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        const message =
          typeof data === 'object' &&
          data !== null &&
          'message' in data &&
          typeof data.message === 'string'
            ? data.message
            : 'Unable to update password. Please try again.';

        setSubmitError(message);
        return;
      }
      setIsSuccess(true);

      toast.success('Password updated successfully.');
      window.setTimeout(() => {
        router.replace('/login');
      }, 2000);
    } catch {
      setSubmitError('Unable to connect. Please try again.');
    }
  };

  return (
    <section className="bg-surface flex w-full max-w-[512px] flex-col gap-6 rounded-md border border-[rgba(195,198,214,0.3)] px-[33px] pt-[33px] pb-[49px] shadow-[0_24px_24px_rgba(4,27,60,0.06)] sm:p-12 sm:shadow-[0_24px_48px_-12px_rgba(4,27,60,0.06)]">
      <header className="text-center">
        <h1 className="text-foreground text-2xl leading-[30px] font-semibold tracking-[-0.6px]">
          Create a New Password
        </h1>

        <p className="text-foreground-secondary mt-2 text-[14px] leading-5">
          Create a new, strong password to secure your workstation access.
        </p>
      </header>

      <form noValidate className="flex flex-col gap-6" onSubmit={handleSubmit(onSubmit)}>
        <div className="flex flex-col gap-4 sm:gap-6">
          <div className="flex flex-col gap-2">
            <FieldLabel htmlFor="password" className={labelClassName}>
              New Password
            </FieldLabel>

            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your new password"
                aria-invalid={Boolean(errors.password)}
                className={passwordInputClassName}
                {...register('password')}
              />

              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                className="absolute top-1/2 right-[7px] flex size-10 -translate-y-1/2 cursor-pointer items-center justify-center sm:right-[3px]"
              >
                {showPassword ? (
                  <EyeOffIcon aria-hidden="true" className="size-5" />
                ) : (
                  <EyeOnIcon aria-hidden="true" className="h-[15px] w-[22px]" />
                )}
              </button>
            </div>

            {errors.password && (
              <p className="text-error text-[11px] leading-[16.5px]">{errors.password.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <FieldLabel htmlFor="confirmPassword" className={labelClassName}>
              Confirm Password
            </FieldLabel>

            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Repeat your new password"
                aria-invalid={Boolean(errors.confirmPassword)}
                className={passwordInputClassName}
                {...register('confirmPassword')}
              />

              <button
                type="button"
                onClick={() => setShowConfirmPassword((current) => !current)}
                aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                aria-pressed={showConfirmPassword}
                className="absolute top-1/2 right-[7px] flex size-10 -translate-y-1/2 cursor-pointer items-center justify-center sm:right-[3px]"
              >
                {showConfirmPassword ? (
                  <EyeOffIcon aria-hidden="true" className="size-5" />
                ) : (
                  <EyeOnIcon aria-hidden="true" className="h-[15px] w-[22px]" />
                )}
              </button>
            </div>

            {errors.confirmPassword && (
              <p className="text-error text-[11px] leading-[16.5px]">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>
        </div>

        <div className="bg-surface-icon flex flex-col gap-3 rounded-sm p-5 sm:gap-4 sm:border sm:border-[rgba(195,198,214,0.1)] sm:bg-[rgba(241,243,255,0.5)] sm:p-[21px]">
          <div className="pb-1 sm:border-b sm:border-[rgba(195,198,214,0.2)] sm:pb-[9px]">
            <p className="text-foreground-secondary text-[11px] leading-[16.5px] font-bold tracking-[0.55px] uppercase">
              Security Requirements
            </p>
          </div>

          <div className="grid grid-cols-1 gap-[10px] sm:grid-cols-2 sm:gap-3">
            <div className="order-1 flex items-center gap-2 sm:order-none">
              {passwordChecks.validLength ? (
                <ValidationPassedIcon aria-hidden="true" className="size-[15px] shrink-0" />
              ) : (
                <ValidationPendingIcon aria-hidden="true" className="size-[15px] shrink-0" />
              )}

              <span className="text-foreground text-[13px] leading-[19.5px]">8-64 characters</span>
            </div>

            <div className="order-3 flex items-center gap-2 sm:order-none">
              {passwordChecks.hasUppercase ? (
                <ValidationPassedIcon aria-hidden="true" className="size-[15px] shrink-0" />
              ) : (
                <ValidationPendingIcon aria-hidden="true" className="size-[15px] shrink-0" />
              )}

              <span className="text-foreground text-[13px] leading-[19.5px]">Uppercase letter</span>
            </div>

            <div className="order-2 flex items-center gap-2 sm:order-none">
              {passwordChecks.hasLowercase ? (
                <ValidationPassedIcon aria-hidden="true" className="size-[15px] shrink-0" />
              ) : (
                <ValidationPendingIcon aria-hidden="true" className="size-[15px] shrink-0" />
              )}

              <span className="text-foreground text-[13px] leading-[19.5px]">Lowercase letter</span>
            </div>

            <div className="order-4 flex items-center gap-2 sm:order-none">
              {passwordChecks.hasDigit ? (
                <ValidationPassedIcon aria-hidden="true" className="size-[15px] shrink-0" />
              ) : (
                <ValidationPendingIcon aria-hidden="true" className="size-[15px] shrink-0" />
              )}

              <span className="text-foreground text-[13px] leading-[19.5px]">
                At least one digit
              </span>
            </div>

            <div className="order-5 flex items-center gap-2 sm:order-none">
              {passwordChecks.hasSpecialCharacter ? (
                <ValidationPassedIcon aria-hidden="true" className="size-[15px] shrink-0" />
              ) : (
                <ValidationPendingIcon aria-hidden="true" className="size-[15px] shrink-0" />
              )}

              <span className="text-foreground text-[13px] leading-[19.5px] sm:whitespace-nowrap">
                Special character (e.g. !@#$)
              </span>
            </div>
          </div>
        </div>

        {submitError && (
          <p role="alert" className="text-error text-[12px] leading-[18px]">
            {submitError}
          </p>
        )}

        <Button
          type="submit"
          disabled={isSubmitting || isSuccess}
          className="h-12 w-full cursor-pointer text-[16px] leading-6 sm:h-14"
        >
          {isSubmitting ? 'Updating Password...' : 'Update Password'}
        </Button>

        <div className="flex justify-center">
          <Link
            href="/login"
            className="text-primary flex items-center gap-2 text-[14px] leading-5 font-medium"
          >
            <ArrowLeftIcon aria-hidden="true" className="h-4 w-4 shrink-0" />
            Back to log in
          </Link>
        </div>
      </form>
    </section>
  );
}
