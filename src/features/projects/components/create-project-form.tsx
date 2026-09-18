'use client';

import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import FormErrorIcon from '@/assets/icons/projects/create/form-error.svg';
import InitializeProjectIcon from '@/assets/icons/projects/create/initialize-project.svg';
import ProTipIcon from '@/assets/icons/projects/create/pro-tip.svg';
import { Button } from '@/components/ui/button';
import { FieldLabel } from '@/components/ui/field-label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

import {
  createProjectSchema,
  type CreateProjectFormValues,
} from '../schemas/create-project-schema';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

const descriptionPlaceholder =
  "Provide a high-level overview of the project's architectural objectives and key milestones...";

export function CreateProjectForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateProjectFormValues>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      title: '',
      description: '',
    },
  });

  const description =
    useWatch({
      control,
      name: 'description',
    }) ?? '';

  async function onSubmit(values: CreateProjectFormValues) {
    setServerError(null);

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (response.status === 401) {
        router.replace('/login');
        router.refresh();
        return;
      }

      const data: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        const message =
          typeof data === 'object' &&
          data !== null &&
          'message' in data &&
          typeof data.message === 'string'
            ? data.message
            : 'Failed To Add New Project, Try Again Later';

        setServerError(message);
        return;
      }

      reset();
      toast.success('Project created successfully.');
    } catch {
      setServerError('Failed To Add New Project, Try Again Later');
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1280px] px-6 pt-8 pb-12 lg:px-8">
      <header className="hidden lg:block">
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2 text-xs leading-4 font-bold tracking-[1.2px] uppercase"
        >
          <Link href="/project" className="text-foreground-secondary/60">
            Projects
          </Link>

          <span aria-hidden="true" className="text-foreground-secondary/60">
            ›
          </span>

          <span className="text-primary">Add New Project</span>
        </nav>

        <h1 className="text-foreground mt-4 text-[36px] leading-10 font-semibold tracking-[-0.9px]">
          Add New Project
        </h1>
      </header>

      <div className="lg:mt-10 lg:flex lg:justify-center">
        <section className="lg:bg-surface mx-auto w-full max-w-[512px] lg:max-w-[672px] lg:overflow-hidden lg:rounded-md lg:shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
          <header className="lg:border-surface-low pb-8 lg:border-b lg:px-8 lg:pt-8 lg:pb-[41px]">
            <div className="flex items-center gap-4">
              <InitializeProjectIcon
                aria-hidden="true"
                className="hidden h-11 w-[46px] shrink-0 lg:block"
              />

              <div>
                <h2 className="text-foreground text-2xl leading-8 font-semibold">
                  Initialize New Project
                </h2>

                <p className="text-foreground-muted mt-1 text-sm leading-5 lg:mt-0">
                  Define the scope and foundational details of your project.
                </p>
              </div>
            </div>
          </header>

          <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            className="flex flex-col gap-8 lg:px-8 lg:pt-8 lg:pb-12"
          >
            <div className="flex flex-col gap-6 lg:gap-8">
              <div className="flex flex-col gap-2">
                <FieldLabel
                  htmlFor="project-title"
                  invalid={Boolean(errors.title)}
                  className="text-[11px] leading-[16.5px] tracking-[0.55px]"
                >
                  Project Title{' '}
                  <span className="text-error" aria-hidden="true">
                    *
                  </span>
                </FieldLabel>

                <Input
                  id="project-title"
                  type="text"
                  autoComplete="off"
                  aria-invalid={Boolean(errors.title)}
                  aria-describedby={errors.title ? 'project-title-error' : undefined}
                  className="aria-invalid:bg-surface-highest aria-invalid:text-foreground h-14 rounded-md px-4 text-base leading-6 aria-invalid:border-transparent lg:h-[52px] lg:rounded-sm lg:px-[18px]"
                  {...register('title')}
                />

                {errors.title && (
                  <p
                    id="project-title-error"
                    role="alert"
                    className="text-error flex items-center gap-2 text-xs leading-[18px] font-medium lg:gap-1.5 lg:leading-4"
                  >
                    <FormErrorIcon aria-hidden="true" className="size-[14px] shrink-0" />

                    {errors.title.message}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <FieldLabel
                    htmlFor="project-description"
                    invalid={Boolean(errors.description)}
                    className="text-[11px] leading-[16.5px] tracking-[0.55px]"
                  >
                    Description
                  </FieldLabel>

                  <span className="text-foreground-muted/60 hidden text-[11px] leading-[16.5px] lg:block">
                    Optional
                  </span>
                </div>

                <Textarea
                  id="project-description"
                  maxLength={500}
                  placeholder={descriptionPlaceholder}
                  aria-invalid={Boolean(errors.description)}
                  aria-describedby={
                    errors.description ? 'project-description-error' : 'project-description-count'
                  }
                  className="aria-invalid:bg-surface-highest aria-invalid:text-foreground min-h-[128px] rounded-md p-4 text-base leading-6 aria-invalid:border-transparent lg:min-h-[124px] lg:rounded-sm lg:px-[18px] lg:py-[14px]"
                  {...register('description')}
                />

                {errors.description ? (
                  <p
                    id="project-description-error"
                    role="alert"
                    className="text-error flex items-center gap-2 text-xs leading-[18px] font-medium"
                  >
                    <FormErrorIcon aria-hidden="true" className="size-[14px] shrink-0" />

                    {errors.description.message}
                  </p>
                ) : (
                  <p
                    id="project-description-count"
                    className="text-foreground-muted text-right text-[11px] leading-[16.5px] font-medium"
                  >
                    <span className="lg:hidden">{description.length} / 500</span>

                    <span className="hidden lg:inline">{description.length} / 500 characters</span>
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-4 pt-4 lg:flex-row lg:items-center lg:justify-between lg:gap-0">
              <Link
                href="/project"
                className="text-primary lg:text-foreground-muted order-2 flex w-full items-center justify-center rounded-md px-6 py-3 text-base leading-6 font-medium lg:order-1 lg:w-auto lg:rounded-sm lg:text-sm lg:leading-5 lg:font-bold"
              >
                Back
              </Link>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="order-1 w-full cursor-pointer rounded-md px-6 py-4 text-base leading-6 font-bold shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1),0_4px_6px_-4px_rgba(0,0,0,0.1)] disabled:cursor-not-allowed disabled:opacity-60 lg:order-2 lg:w-auto lg:rounded-sm lg:px-8 lg:py-3 lg:text-sm lg:leading-5 lg:shadow-[0_10px_15px_-3px_rgba(0,61,155,0.2),0_4px_6px_-4px_rgba(0,61,155,0.2)]"
              >
                Create Project
              </Button>
            </div>

            {serverError && (
              <p role="alert" className="text-error text-center text-xs leading-4 font-medium">
                {serverError}
              </p>
            )}
          </form>

          <aside className="bg-surface-low mt-12 rounded-md p-6 lg:mt-0 lg:rounded-none">
            <div className="flex items-start gap-3">
              <ProTipIcon
                aria-hidden="true"
                className="mt-0.5 hidden h-[15px] w-[12px] shrink-0 lg:block"
              />

              <div className="text-foreground-muted text-xs">
                <p className="leading-[19.5px] font-bold">Pro Tip</p>

                <p className="mt-2 leading-normal lg:mt-0 lg:inline">
                  <span className="hidden lg:inline">: </span>
                  You can invite project members and assign epics immediately after the initial
                  creation process.
                </p>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </div>
  );
}
