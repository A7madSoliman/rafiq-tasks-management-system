import type { UseFormRegisterReturn } from 'react-hook-form';

import FormErrorIcon from '@/assets/icons/projects/create/form-error.svg';
import { FieldLabel } from '@/components/ui/field-label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

type ProjectFormFieldsProps = {
  nameRegistration: UseFormRegisterReturn;
  descriptionRegistration: UseFormRegisterReturn;
  nameError?: string;
  descriptionError?: string;
  descriptionLength: number;
};

const descriptionPlaceholder =
  "Provide a high-level overview of the project's architectural objectives and key milestones...";

export function ProjectFormFields({
  nameRegistration,
  descriptionRegistration,
  nameError,
  descriptionError,
  descriptionLength,
}: ProjectFormFieldsProps) {
  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      <div className="flex flex-col gap-2">
        <FieldLabel
          htmlFor="project-name"
          invalid={Boolean(nameError)}
          className="text-[11px] leading-[16.5px] tracking-[0.55px]"
        >
          Project Title{' '}
          <span className="text-error" aria-hidden="true">
            *
          </span>
        </FieldLabel>

        <Input
          id="project-name"
          type="text"
          autoComplete="off"
          aria-invalid={Boolean(nameError)}
          aria-describedby={nameError ? 'project-name-error' : undefined}
          className="aria-invalid:bg-surface-highest aria-invalid:text-foreground h-14 rounded-md px-4 text-base leading-6 aria-invalid:border-transparent lg:h-[52px] lg:rounded-sm lg:px-[18px]"
          {...nameRegistration}
        />

        {nameError && (
          <p
            id="project-name-error"
            role="alert"
            className="text-error flex items-center gap-2 text-xs leading-[18px] font-medium lg:gap-1.5 lg:leading-4"
          >
            <FormErrorIcon aria-hidden="true" className="size-[14px] shrink-0" />

            {nameError}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <FieldLabel
            htmlFor="project-description"
            invalid={Boolean(descriptionError)}
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
          aria-invalid={Boolean(descriptionError)}
          aria-describedby={
            descriptionError ? 'project-description-error' : 'project-description-count'
          }
          className="aria-invalid:bg-surface-highest aria-invalid:text-foreground min-h-[128px] rounded-md p-4 text-base leading-6 aria-invalid:border-transparent lg:min-h-[148px] lg:rounded-sm lg:px-[18px] lg:py-[14px]"
          {...descriptionRegistration}
        />

        {descriptionError ? (
          <p
            id="project-description-error"
            role="alert"
            className="text-error flex items-center gap-2 text-xs leading-[18px] font-medium"
          >
            <FormErrorIcon aria-hidden="true" className="size-[14px] shrink-0" />

            {descriptionError}
          </p>
        ) : (
          <p
            id="project-description-count"
            className="text-foreground-muted text-right text-[11px] leading-[16.5px] font-medium"
          >
            <span className="lg:hidden">{descriptionLength} / 500</span>

            <span className="hidden lg:inline">{descriptionLength} / 500 characters</span>
          </p>
        )}
      </div>
    </div>
  );
}
