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

type CreateEpicFormProps = {
  projectId: string;
};

export function CreateEpicForm({ projectId }: CreateEpicFormProps) {
  const router = useRouter();
  const today = getTodayLocalDate();
  const { createEpic, submitError } = useCreateEpic(projectId);

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
    <form noValidate onSubmit={handleSubmit(onSubmit)}>
      <div>
        <FieldLabel htmlFor="title">Title</FieldLabel>

        <Input
          id="title"
          placeholder="e.g. Structural Foundation Phase"
          aria-invalid={Boolean(errors.title)}
          {...register('title')}
        />

        {errors.title && <p className="text-error text-xs">{errors.title.message}</p>}
      </div>

      <div>
        <FieldLabel htmlFor="description">Description</FieldLabel>

        <Textarea
          id="description"
          maxLength={500}
          placeholder="Describe the scope and objectives of this epic..."
          aria-invalid={Boolean(errors.description)}
          {...register('description')}
        />

        <div className="flex justify-end">
          <span className="text-foreground-secondary text-[10px] leading-[15px]">
            {descriptionLength} / 500 characters
          </span>
        </div>

        {errors.description && <p className="text-error text-xs">{errors.description.message}</p>}
      </div>

      <div>
        <FieldLabel htmlFor="assigneeId">Assignee</FieldLabel>

        <EpicAssigneeField
          projectId={projectId}
          register={register}
          errorMessage={errors.assigneeId?.message}
          disabled={isSubmitting}
        />

        {errors.assigneeId && <p className="text-error text-xs">{errors.assigneeId.message}</p>}
      </div>

      <div>
        <FieldLabel htmlFor="deadline">Deadline</FieldLabel>

        <Input
          id="deadline"
          type="date"
          min={today}
          aria-invalid={Boolean(errors.deadline)}
          {...register('deadline')}
        />

        {errors.deadline && <p className="text-error text-xs">{errors.deadline.message}</p>}
      </div>

      {submitError && (
        <p role="alert" className="text-error text-sm">
          {submitError}
        </p>
      )}

      <div>
        <Button type="button" variant="secondary" onClick={handleCancel} disabled={isSubmitting}>
          Cancel
        </Button>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating...' : 'Create Epic'}
        </Button>
      </div>
    </form>
  );
}
