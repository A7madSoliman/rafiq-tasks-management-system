'use client';

import { useState } from 'react';
import Link from 'next/link';

import EyeOffIcon from '@/assets/icons/eye-off.svg';
import EyeOnIcon from '@/assets/icons/eye-on.svg';
import { Button } from '@/components/ui/button';
import { FieldLabel } from '@/components/ui/field-label';
import { Input } from '@/components/ui/input';

const inputClassName =
  'h-14 rounded-md px-md py-[1.125rem] text-[1rem] text-foreground placeholder:text-foreground-subtle sm:h-12 sm:rounded-sm sm:py-[0.875rem]';

const labelClassName =
  'pl-2xs text-[0.6875rem] leading-[1.03125rem] tracking-[0.034375rem] text-foreground-secondary sm:text-foreground-muted';

export function SignupForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <section
      aria-labelledby="signup-title"
      className="sm:bg-surface sm:p-2xl w-full sm:max-w-[36rem] sm:rounded-md sm:shadow-[0_24px_48px_rgba(4,27,60,0.06)]"
    >
      <header className="pb-xl sm:pb-[2.5rem]">
        <div className="sm:gap-xs flex flex-col gap-[0.4296875rem]">
          <h1
            id="signup-title"
            className="text-foreground text-[1.75rem] leading-[2.5rem] font-semibold tracking-[-0.05rem] sm:text-center sm:text-[1.875rem] sm:leading-[2.25rem] sm:tracking-[-0.046875rem]"
          >
            Create your workspace
          </h1>

          <p className="text-body-md text-foreground-secondary sm:hidden">
            Join the curated environment for institutional trust and task precision.
          </p>

          <p className="text-foreground-muted hidden text-center text-[0.875rem] leading-[1.25rem] sm:block">
            Join the editorial approach to task management.
          </p>
        </div>
      </header>

      <form className="gap-lg flex flex-col">
        <div>
          <div className="flex flex-col gap-[0.375rem]">
            <FieldLabel
              htmlFor="name"
              className="text-foreground-secondary sm:pl-2xs sm:text-foreground-muted text-[0.6875rem] leading-[1.03125rem] tracking-[0.034375rem]"
            >
              Name
            </FieldLabel>

            <Input
              id="name"
              name="name"
              placeholder="Enter your full name"
              className={inputClassName}
            />
          </div>

          <p className="text-outline sm:pl-2xs mt-[0.375rem] text-[0.6875rem] leading-[1.03125rem]">
            3-50 characters, letters only.
          </p>
        </div>

        <div className="flex flex-col gap-[0.375rem]">
          <FieldLabel htmlFor="email" className={labelClassName}>
            Email
          </FieldLabel>

          <Input
            id="email"
            name="email"
            type="email"
            placeholder="yourname@company.com"
            className={inputClassName}
          />
        </div>

        <div className="flex flex-col gap-[0.375rem]">
          <FieldLabel htmlFor="jobTitle" className={labelClassName}>
            Job Title{' '}
            <span className="text-foreground-subtle hidden font-normal tracking-normal normal-case sm:inline">
              (Optional)
            </span>
          </FieldLabel>

          <Input
            id="jobTitle"
            name="jobTitle"
            placeholder="e.g. Project Manager"
            className={inputClassName}
          />
        </div>

        <div className="gap-lg sm:gap-md grid grid-cols-1 sm:grid-cols-2">
          <div className="flex flex-col gap-[0.375rem]">
            <FieldLabel htmlFor="password" className={labelClassName}>
              Password
            </FieldLabel>

            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                className={`${inputClassName} pr-12`}
              />

              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                className="right-md sm:right-sm absolute top-1/2 flex -translate-y-1/2 items-center justify-center"
              >
                {showPassword ? (
                  <EyeOffIcon aria-hidden="true" className="size-icon-md cursor-pointer" />
                ) : (
                  <EyeOnIcon
                    aria-hidden="true"
                    className="size-icon-md cursor-pointer sm:h-[0.9375rem] sm:w-[1.375rem]"
                  />
                )}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-[0.375rem]">
            <FieldLabel htmlFor="confirmPassword" className={labelClassName}>
              Confirm Password
            </FieldLabel>

            <div className="relative">
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Repeat your password"
                className={`${inputClassName} pr-12`}
              />

              <button
                type="button"
                onClick={() => setShowConfirmPassword((current) => !current)}
                aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                aria-pressed={showConfirmPassword}
                className="right-md sm:right-sm absolute top-1/2 flex -translate-y-1/2 items-center justify-center"
              >
                {showConfirmPassword ? (
                  <EyeOffIcon aria-hidden="true" className="size-icon-md cursor-pointer" />
                ) : (
                  <EyeOnIcon
                    aria-hidden="true"
                    className="size-icon-md cursor-pointer sm:h-[0.9375rem] sm:w-[1.375rem]"
                  />
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="bg-surface-icon p-md hidden flex-col gap-[0.46875rem] rounded-md sm:flex">
          <div className="gap-xs flex items-center">
            <span
              aria-hidden="true"
              className="border-foreground-secondary size-[0.7291875rem] rounded-full border"
            />

            <span className="text-foreground-secondary text-[0.6875rem] leading-[1.03125rem]">
              At least 8 characters
            </span>
          </div>

          <div className="gap-xs flex items-center">
            <span
              aria-hidden="true"
              className="border-foreground-secondary size-[0.7291875rem] rounded-full border"
            />

            <span className="text-foreground-secondary text-[0.6875rem] leading-[1.03125rem]">
              One uppercase, lowercase, and digit
            </span>
          </div>

          <div className="gap-xs flex items-center">
            <span
              aria-hidden="true"
              className="border-foreground-secondary size-[0.7291875rem] rounded-full border"
            />

            <span className="text-foreground-secondary text-[0.6875rem] leading-[1.03125rem]">
              One special character
            </span>
          </div>
        </div>

        <Button
          type="submit"
          className="h-14 w-full rounded-md bg-[linear-gradient(135deg,var(--color-primary)_0%,var(--color-primary-container)_100%)] px-0 py-0 text-[1rem] leading-[1.5rem] sm:h-12"
        >
          Create Account
        </Button>
      </form>

      <div className="pb-xl sm:pt-xl pt-[2.96875rem] sm:pb-0">
        <p className="text-foreground-secondary sm:text-foreground-muted text-center text-[0.875rem] leading-[1.25rem]">
          Already have an account?{' '}
          <Link href="/login" className="text-primary font-semibold">
            Log in
          </Link>
        </p>
      </div>
    </section>
  );
}
