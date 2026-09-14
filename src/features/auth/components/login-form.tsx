'use client';

import { useState } from 'react';
import Link from 'next/link';

import EyeOffIcon from '@/assets/icons/eye-off.svg';
import EyeOnIcon from '@/assets/icons/eye-on.svg';
import { Button } from '@/components/ui/button';
import { FieldLabel } from '@/components/ui/field-label';
import { Input } from '@/components/ui/input';

const inputClassName =
  'h-14 rounded-md bg-surface-highest px-md py-[18px] text-[16px] text-foreground placeholder:text-foreground-subtle sm:h-12 sm:rounded-xs sm:py-[14px]';

const labelClassName =
  'pl-2xs text-[11px] leading-[16.5px] font-bold tracking-[0.55px] text-foreground-secondary uppercase sm:pl-0 sm:text-foreground-muted';

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <section
      aria-labelledby="login-title"
      className="sm:bg-surface sm:p-2xl w-full sm:h-[586px] sm:w-[480px] sm:rounded-md sm:shadow-[0_24px_24px_rgba(4,27,60,0.06)]"
    >
      <header className="mx-auto flex h-[188px] w-[232.14px] flex-col items-center pt-[88px] text-center sm:h-16 sm:w-full sm:pt-0">
        <h1
          id="login-title"
          className="text-foreground text-[24px] leading-8 font-semibold tracking-[-0.6px] sm:text-[30px] sm:leading-9 sm:tracking-[-0.75px]"
        >
          Welcome Back
        </h1>

        <p className="mt-xs text-foreground-muted text-[14px] leading-5">
          Please enter your details to access your workspace
        </p>
      </header>

      <div className="pb-md sm:mt-10 sm:pb-0">
        <form className="gap-lg flex flex-col" onSubmit={(event) => event.preventDefault()}>
          <div className="gap-xs flex flex-col">
            <FieldLabel htmlFor="email" className={labelClassName}>
              Email
            </FieldLabel>

            <Input
              id="email"
              type="email"
              placeholder="yourname@company.com"
              className={inputClassName}
            />
          </div>

          <div className="gap-xs flex flex-col">
            <div className="flex items-center justify-between">
              <FieldLabel htmlFor="password" className={labelClassName}>
                Password
              </FieldLabel>

              <button
                type="button"
                className="text-primary text-[11px] leading-[16.5px] font-bold sm:hidden"
              >
                Forget?
              </button>
            </div>

            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                className={`${inputClassName} pr-[53px]`}
              />

              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                className="absolute top-1/2 right-[2px] flex size-10 -translate-y-1/2 items-center justify-center sm:right-[7px]"
              >
                {showPassword ? (
                  <EyeOffIcon aria-hidden="true" className="size-5 cursor-pointer" />
                ) : (
                  <EyeOnIcon aria-hidden="true" className="h-[15px] w-[22px] cursor-pointer" />
                )}
              </button>
            </div>
          </div>

          <div className="px-2xs pb-xs sm:py-xs flex h-7 items-start sm:h-9 sm:items-center sm:justify-between sm:px-0">
            <label htmlFor="rememberMe" className="gap-sm flex cursor-pointer items-center">
              <input
                id="rememberMe"
                type="checkbox"
                className="accent-primary size-5 shrink-0 sm:size-4"
              />

              <span className="text-foreground-secondary text-[14px] leading-5 font-medium">
                Remember Me
              </span>
            </label>

            <button
              type="button"
              className="text-primary hidden cursor-pointer text-[14px] leading-5 font-medium sm:block"
            >
              Forget Password?
            </button>
          </div>

          <Button
            type="submit"
            className="h-14 w-full cursor-pointer rounded-md bg-[linear-gradient(135deg,var(--color-primary)_0%,var(--color-primary-container)_100%)] px-0 py-0 text-[16px] leading-6 font-semibold shadow-[0_10px_15px_-3px_rgba(0,61,155,0.1),0_4px_6px_-4px_rgba(0,61,155,0.1)] sm:h-12 sm:shadow-[0_1px_1px_rgba(0,0,0,0.05)]"
          >
            Log In
          </Button>
        </form>
      </div>

      <footer className="flex h-[235px] items-end justify-center sm:mt-[31px] sm:h-[53px] sm:border-t sm:border-[rgba(195,198,214,0.15)] sm:pt-[33px]">
        <p className="text-foreground-muted text-center text-[14px] leading-5">
          Don&apos;t have an account?{' '}
          <Link href="/sign-up" className="text-primary font-semibold">
            Sign Up
          </Link>
        </p>
      </footer>
    </section>
  );
}
