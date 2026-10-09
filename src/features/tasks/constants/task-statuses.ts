export const TASK_STATUSES = [
  {
    value: 'TO_DO',
    label: 'TO DO',
    boardLabel: 'TO DO',
  },
  {
    value: 'IN_PROGRESS',
    label: 'IN PROGRESS',
    boardLabel: 'IN PROGRESS',
  },
  {
    value: 'BLOCKED',
    label: 'BLOCKED',
    boardLabel: 'BLOCKED',
  },
  {
    value: 'IN_REVIEW',
    label: 'IN REVIEW',
    boardLabel: 'IN REVIEW',
  },
  {
    value: 'READY_FOR_QA',
    label: 'READY FOR QA',
    boardLabel: 'READY FOR QA',
  },
  {
    value: 'REOPENED',
    label: 'REOPENED',
    boardLabel: 'REOPENED',
  },
  {
    value: 'READY_FOR_PRODUCTION',
    label: 'READY FOR PRODUCTION',
    boardLabel: 'READY FOR PROD',
  },
  {
    value: 'DONE',
    label: 'DONE',
    boardLabel: 'DONE',
  },
] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number]['value'];
