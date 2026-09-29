'use client';

import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { FieldLabel } from '@/components/ui/field-label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { createEpicSchema, type CreateEpicFormValues } from '../schemas/create-epic-schema';
import { getTodayLocalDate } from '../utils/get-today-local-date';
import { useCreateEpic } from '../hooks/use-create-epic';
import { EpicAssigneeField } from './epic-assignee-field';
import { useCurrentProject } from '@/features/projects/context/current-project-context';
import ValidationErrorIcon from '@/assets/icons/forms/validation-error.svg';
import Link from 'next/link';

type CreateEpicFormProps = {
  projectId: string;
};

export function CreateEpicForm({ projectId }: CreateEpicFormProps) {
  const router = useRouter();
  const today = getTodayLocalDate();
  const { createEpic, submitError } = useCreateEpic(projectId);
  const { project } = useCurrentProject();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CreateEpicFormValues>({
    resolver: zodResolver(createEpicSchema),
    mode: 'onTouched',
    reValidateMode: 'onChange',
    defaultValues: {
      title: '',
      description: '',
      assigneeId: '',
      deadline: '',
    },
  });

  const descriptionValue = useWatch({
    control,
    name: 'description',
    defaultValue: '',
  });

  const descriptionLength = descriptionValue?.length ?? 0;

  const onSubmit = async (values: CreateEpicFormValues) => {
    await createEpic(values);
  };

  const handleCancel = () => {
    router.push(`/project/${encodeURIComponent(projectId)}/epics`);
  };

  return (
    <section className="mx-auto w-full max-w-[896px] px-6 pt-8 pb-12 lg:py-10">
      <nav
        aria-label="Breadcrumb"
        className="hidden items-center gap-2 text-xs leading-4 font-semibold tracking-[0.3px] uppercase lg:flex"
      >
        <Link href="/project" className="text-foreground-secondary/60">
          Projects
        </Link>

        <span aria-hidden="true" className="text-foreground-secondary/60">
          ›
        </span>

        <span className="text-foreground-secondary/60">{project?.name ?? 'Project'}</span>

        <span aria-hidden="true" className="text-foreground-secondary/60">
          ›
        </span>

        <Link
          href={`/project/${encodeURIComponent(projectId)}/epics`}
          className="text-foreground-secondary/60"
        >
          Epics
        </Link>

        <span aria-hidden="true" className="text-foreground-secondary/60">
          ›
        </span>

        <span className="text-foreground">New Epic</span>
      </nav>

      <header className="mt-0 lg:mt-8">
        <h1 className="text-foreground text-2xl leading-8 font-semibold tracking-[-0.6px] lg:text-[36px] lg:leading-10 lg:font-bold lg:tracking-[-0.9px]">
          Create New Epic
        </h1>

        <p className="text-foreground-secondary mt-1.5 max-w-[512px] text-base leading-6 lg:mt-2">
          Define a major project phase or high-level milestone to group related tasks and track
          architectural progress.
        </p>
      </header>

      <form
        noValidate
        onSubmit={handleSubmit(onSubmit)}
        className="lg:bg-surface mt-8 flex flex-col gap-6 lg:rounded-md lg:border lg:border-[rgba(195,198,214,0.1)] lg:p-8 lg:shadow-[0_24px_48px_-12px_rgba(4,27,60,0.06)]"
      >
        <div className="grid gap-2 lg:grid-cols-4 lg:gap-6">
          <div className="lg:pt-2">
            <FieldLabel
              htmlFor="title"
              className="text-foreground-secondary text-[11px] leading-[16.5px] font-bold tracking-[1.1px] uppercase"
            >
              Title <span className="text-error">*</span>
            </FieldLabel>
          </div>

          <div className="flex flex-col gap-2 lg:col-span-3">
            <Input
              id="title"
              placeholder="e.g. Structural Foundation Phase"
              aria-invalid={Boolean(errors.title)}
              className="h-12 rounded-xs px-4 text-base"
              {...register('title')}
            />

            {errors.title ? (
              <div className="flex items-center gap-1.5">
                <ValidationErrorIcon aria-hidden="true" className="size-[11.67px] shrink-0" />

                <p className="text-error text-[11px] leading-[16.5px] font-medium tracking-[0.55px] uppercase">
                  {errors.title.message}
                </p>
              </div>
            ) : (
              <p className="text-foreground-secondary/60 text-[10px] leading-[15px] lg:hidden">
                Minimum 3 characters required.
              </p>
            )}
          </div>
        </div>

        <div className="grid gap-2 lg:grid-cols-4 lg:gap-6">
          <div className="lg:pt-2">
            <FieldLabel
              htmlFor="description"
              className="text-foreground-secondary text-[11px] leading-[16.5px] font-bold tracking-[1.1px] uppercase"
            >
              Description
            </FieldLabel>

            <p className="text-foreground-secondary/50 mt-0.5 hidden text-[10px] leading-[15px] lg:block">
              Optional
            </p>
          </div>

          <div className="flex flex-col gap-1 lg:col-span-3">
            <Textarea
              id="description"
              maxLength={500}
              placeholder="Describe the scope and objectives of this epic..."
              aria-invalid={Boolean(errors.description)}
              className="h-[120px] rounded-xs px-4 py-3 text-base leading-6"
              {...register('description')}
            />

            <div className="hidden justify-end lg:flex">
              <span className="text-foreground-secondary/60 text-[10px] leading-[15px]">
                {descriptionLength} / 500 characters
              </span>
            </div>

            {errors.description && (
              <p className="text-error text-[11px] leading-[16.5px]">
                {errors.description.message}
              </p>
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
          <EpicAssigneeField
            projectId={projectId}
            register={register}
            errorMessage={errors.assigneeId?.message}
            disabled={isSubmitting}
          />

          <div className="flex flex-col gap-2 lg:gap-4">
            <FieldLabel
              htmlFor="deadline"
              className="text-foreground-secondary text-[11px] leading-[16.5px] font-bold tracking-[1.1px] uppercase"
            >
              Deadline
            </FieldLabel>

            <Input
              id="deadline"
              type="date"
              min={today}
              aria-invalid={Boolean(errors.deadline)}
              className="h-12 rounded-xs px-4 text-base"
              {...register('deadline')}
            />

            {errors.deadline && (
              <p className="text-error text-[11px] leading-[16.5px]">{errors.deadline.message}</p>
            )}
          </div>
        </div>

        {submitError && (
          <p role="alert" className="text-error text-sm">
            {submitError}
          </p>
        )}

        <div className="lg:border-outline/10 flex flex-col gap-3 pt-6 lg:flex-row lg:items-center lg:justify-end lg:gap-4 lg:border-t lg:pt-8">
          <Button
            type="button"
            variant="ghost"
            onClick={handleCancel}
            disabled={isSubmitting}
            className="text-foreground-muted order-2 h-14 w-full cursor-pointer py-0 text-base font-medium opacity-100 lg:order-1 lg:h-11 lg:w-[111px] lg:px-0 lg:text-sm lg:font-semibold"
          >
            Cancel
          </Button>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="order-1 h-14 w-full cursor-pointer py-0 text-base font-semibold lg:order-2 lg:h-11 lg:w-[158px] lg:px-0 lg:text-sm lg:font-bold"
          >
            {isSubmitting ? 'Creating...' : 'Create Epic'}
          </Button>
        </div>
      </form>
    </section>
  );
}
