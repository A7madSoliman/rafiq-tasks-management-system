'use client';

import { useState } from 'react';
import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import EyeOffIcon from '@/assets/icons/eye-off.svg';
import EyeOnIcon from '@/assets/icons/eye-on.svg';
import ValidationPassedIcon from '@/assets/icons/validation-passed.svg';
import ValidationPendingIcon from '@/assets/icons/validation-pending.svg';
import { Button } from '@/components/ui/button';
import { FieldLabel } from '@/components/ui/field-label';
import { Input } from '@/components/ui/input';
import { signupSchema, type SignupFormValues } from '@/features/auth/schemas/signup-schema';
import { getPasswordChecks } from '../validation/password-rules';
import { useRouter } from 'next/navigation';
import { SignupErrorResponse } from '../types/signup-api';

const inputClassName =
  'h-14 rounded-md px-md py-[18px] text-[15px] text-foreground placeholder:text-foreground-subtle sm:h-12 sm:rounded-sm sm:py-[14px]';

const passwordInputClassName = `${inputClassName} pr-[53px] sm:pr-12`;

const labelClassName =
  'pl-2xs text-[11px] leading-[16.5px] tracking-[0.55px] text-foreground-secondary sm:text-foreground-muted';

function isSignupErrorResponse(value: unknown): value is SignupErrorResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    'message' in value &&
    typeof value.message === 'string'
  );
}

export function SignupForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const onSubmit = async (values: SignupFormValues) => {
    setSubmitError(null);

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Context-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      const data: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        setSubmitError(
          isSignupErrorResponse(data) ? data.message : 'Something went wrong. Please try again.',
        );
        return;
      }

      router.replace('/login');
    } catch {
      setSubmitError('Unable to connect. Please try again.');
    }
  };

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    mode: 'onTouched',
    reValidateMode: 'onChange',
    defaultValues: {
      name: '',
      email: '',
      jobTitle: '',
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

  return (
    <section
      aria-labelledby="signup-title"
      className="sm:bg-surface sm:p-2xl w-full sm:max-w-144 sm:overflow-hidden sm:rounded-md sm:shadow-[0_24px_48px_rgba(4,27,60,0.06)]"
    >
      <header className="pb-xl sm:pb-6">
        <div className="sm:gap-xs flex flex-col gap-[6.875px]">
          <h1
            id="signup-title"
            className="text-foreground text-center text-[28px] leading-10 font-semibold tracking-[-0.8px] sm:text-[30px] sm:leading-9 sm:tracking-[-0.75px]"
          >
            Create your workspace
          </h1>

          <p className="text-body-md text-foreground-secondary text-center sm:hidden">
            Join the curated environment for institutional trust and task precision.
          </p>

          <p className="text-foreground-muted hidden text-center text-[14px] leading-[20px] sm:block">
            Join the editorial approach to task management.
          </p>
        </div>
      </header>

      <form noValidate className="gap-lg flex flex-col" onSubmit={handleSubmit(onSubmit)}>
        <div>
          <div className="flex flex-col gap-1.5">
            <FieldLabel
              htmlFor="name"
              className="text-foreground-secondary sm:pl-2xs sm:text-foreground-muted text-[11px] leading-[16.5px] tracking-[0.55px]"
            >
              Name
            </FieldLabel>

            <Input
              id="name"
              placeholder="Enter your full name"
              aria-invalid={Boolean(errors.name)}
              className={inputClassName}
              {...register('name')}
            />
          </div>

          {errors.name ? (
            <p className="text-error sm:pl-2xs mt-1.5 text-[11px] leading-[16.5px]">
              {errors.name.message}
            </p>
          ) : (
            <p className="text-outline sm:pl-2xs mt-1.5 text-[11px] leading-[16.5px]">
              3-50 characters, letters only.
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <FieldLabel htmlFor="email" className={labelClassName}>
            Email
          </FieldLabel>

          <Input
            id="email"
            type="email"
            placeholder="yourname@company.com"
            aria-invalid={Boolean(errors.email)}
            className={inputClassName}
            {...register('email')}
          />

          {errors.email && (
            <p className="text-error sm:pl-2xs text-[11px] leading-[16.5px]">
              {errors.email.message}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <FieldLabel htmlFor="jobTitle" className={labelClassName}>
            Job Title{' '}
            <span className="text-foreground-subtle hidden font-normal tracking-normal normal-case sm:inline">
              (Optional)
            </span>
          </FieldLabel>

          <Input
            id="jobTitle"
            placeholder="e.g. Project Manager"
            className={inputClassName}
            {...register('jobTitle')}
          />
        </div>

        <div className="gap-lg sm:gap-md grid grid-cols-1 items-start sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <FieldLabel htmlFor="password" className={labelClassName}>
              Password
            </FieldLabel>

            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                aria-invalid={Boolean(errors.password)}
                className={passwordInputClassName}
                {...register('password')}
              />

              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                className="absolute top-1/2 right-[6px] flex size-10 -translate-y-1/2 cursor-pointer items-center justify-center sm:right-[3px]"
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

          <div className="flex flex-col gap-1.5">
            <FieldLabel htmlFor="confirmPassword" className={labelClassName}>
              Confirm Password
            </FieldLabel>

            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Repeat your password"
                aria-invalid={Boolean(errors.confirmPassword)}
                className={passwordInputClassName}
                {...register('confirmPassword')}
              />

              <button
                type="button"
                onClick={() => setShowConfirmPassword((current) => !current)}
                aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                aria-pressed={showConfirmPassword}
                className="absolute top-1/2 right-[6px] flex size-10 -translate-y-1/2 cursor-pointer items-center justify-center sm:right-[3px]"
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

        <div className="bg-surface-icon p-md hidden flex-col gap-[7.5px] rounded-md sm:flex">
          <div className="gap-xs flex items-center">
            {passwordChecks.validLength ? (
              <ValidationPassedIcon aria-hidden="true" className="size-[11.667px] shrink-0" />
            ) : (
              <ValidationPendingIcon aria-hidden="true" className="size-[11.667px] shrink-0" />
            )}

            <span className="text-foreground-secondary text-[11px] leading-[16.5px]">
              At least 8-64 characters
            </span>
          </div>

          <div className="gap-xs flex items-center">
            {passwordChecks.hasUpperLowerDigit ? (
              <ValidationPassedIcon aria-hidden="true" className="size-[11.667px] shrink-0" />
            ) : (
              <ValidationPendingIcon aria-hidden="true" className="size-[11.667px] shrink-0" />
            )}

            <span className="text-foreground-secondary text-[11px] leading-[16.5px]">
              One uppercase, lowercase, and digit
            </span>
          </div>

          <div className="gap-xs flex items-center">
            {passwordChecks.hasSpecialCharacter ? (
              <ValidationPassedIcon aria-hidden="true" className="size-[11.667px] shrink-0" />
            ) : (
              <ValidationPendingIcon aria-hidden="true" className="size-[11.667px] shrink-0" />
            )}

            <span className="text-foreground-secondary text-[11px] leading-[16.5px]">
              One special character
            </span>
          </div>
        </div>

        {submitError && (
          <p role="alert" className="text-error text-[12px] leading-[18px]">
            {submitError}
          </p>
        )}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="h-14 w-full cursor-pointer rounded-md bg-[linear-gradient(135deg,var(--color-primary)_0%,var(--color-primary-container)_100%)] px-0 py-0 text-[16px] leading-[24px] sm:h-12"
        >
          {isSubmitting ? 'Creating Account...' : 'Create Account'}
        </Button>
      </form>

      <div className="mt-md pb-xl sm:pt-xl pt-[47.5px] sm:pb-0">
        <p className="text-foreground-secondary sm:text-foreground-muted text-center text-[14px] leading-[20px]">
          Already have an account?{' '}
          <Link href="/login" className="text-primary font-semibold">
            Log in
          </Link>
        </p>
      </div>
    </section>
  );
}
