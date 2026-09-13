'use client';

import { useState } from 'react';
import Link from 'next/link';

import EyeOffIcon from '@/assets/icons/eye-off.svg';
import EyeOnIcon from '@/assets/icons/eye-on.svg';
import { Button } from '@/components/ui/button';
import { FieldLabel } from '@/components/ui/field-label';
import { Input } from '@/components/ui/input';

const inputClassName =
  'h-14 rounded-md px-md py-[18px] text-[16px] text-foreground placeholder:text-foreground-subtle sm:h-12 sm:rounded-sm sm:py-[14px]';

const labelClassName =
  'pl-2xs text-[11px] leading-[16.5px] tracking-[0.55px] text-foreground-secondary sm:text-foreground-muted';

export function SignupForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <section
      aria-labelledby="signup-title"
      className="sm:bg-surface sm:p-2xl w-full sm:max-w-144 sm:rounded-md sm:shadow-[0_24px_48px_rgba(4,27,60,0.06)]"
    >
      <header className="pb-xl sm:pb-10">
        <div className="sm:gap-xs flex flex-col gap-[6.875px]">
          <h1
            id="signup-title"
            className="text-foreground text-[28px] leading-10 font-semibold tracking-[-0.8px] sm:text-center sm:text-[30px] sm:leading-9 sm:tracking-[-0.75px]"
          >
            Create your workspace
          </h1>

          <p className="text-body-md text-foreground-secondary sm:hidden">
            Join the curated environment for institutional trust and task precision.
          </p>

          <p className="text-foreground-muted hidden text-center text-[14px] leading-[20px] sm:block">
            Join the editorial approach to task management.
          </p>
        </div>
      </header>

      <form className="gap-lg flex flex-col">
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
              name="name"
              placeholder="Enter your full name"
              className={inputClassName}
            />
          </div>

          <p className="text-outline sm:pl-2xs mt-1.5 text-[11px] leading-[16.5px]">
            3-50 characters, letters only.
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
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

        <div className="flex flex-col gap-1.5">
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
          <div className="flex flex-col gap-1.5">
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
                className="right-md sm:right-sm absolute top-1/2 flex h-[24px] w-[24px] -translate-y-1/2 items-center justify-center sm:h-auto sm:w-auto"
              >
                {showPassword ? (
                  <EyeOffIcon aria-hidden="true" className="size-icon-md cursor-pointer" />
                ) : (
                  <EyeOnIcon
                    aria-hidden="true"
                    className="size-icon-md cursor-pointer sm:h-3.75 sm:w-5.5"
                  />
                )}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
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
                className="right-md sm:right-sm absolute top-1/2 flex h-[24px] w-[24px] -translate-y-1/2 items-center justify-center sm:h-auto sm:w-auto"
              >
                {showConfirmPassword ? (
                  <EyeOffIcon aria-hidden="true" className="size-icon-md cursor-pointer" />
                ) : (
                  <EyeOnIcon
                    aria-hidden="true"
                    className="size-icon-md cursor-pointer sm:h-3.75 sm:w-5.5"
                  />
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="bg-surface-icon p-md hidden flex-col gap-[7.5px] rounded-md sm:flex">
          <div className="gap-xs flex items-center">
            <span
              aria-hidden="true"
              className="border-foreground-secondary size-[11.667px] rounded-full border"
            />

            <span className="text-foreground-secondary text-[11px] leading-[16.5px]">
              At least 8 characters
            </span>
          </div>

          <div className="gap-xs flex items-center">
            <span
              aria-hidden="true"
              className="border-foreground-secondary size-[11.667px] rounded-full border"
            />

            <span className="text-foreground-secondary text-[11px] leading-[16.5px]">
              One uppercase, lowercase, and digit
            </span>
          </div>

          <div className="gap-xs flex items-center">
            <span
              aria-hidden="true"
              className="border-foreground-secondary size-[11.667px] rounded-full border"
            />

            <span className="text-foreground-secondary text-[11px] leading-[16.5px]">
              One special character
            </span>
          </div>
        </div>

        <Button
          type="submit"
          className="h-14 w-full rounded-md bg-[linear-gradient(135deg,var(--color-primary)_0%,var(--color-primary-container)_100%)] px-0 py-0 text-[16px] leading-[24px] sm:h-12"
        >
          Create Account
        </Button>
      </form>

      <div className="pb-xl sm:pt-xl pt-[47.5px] sm:pb-0">
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
