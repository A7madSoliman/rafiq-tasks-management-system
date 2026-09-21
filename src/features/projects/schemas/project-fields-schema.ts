import { z } from 'zod';

export const projectNameSchema = z
  .string()
  .trim()
  .min(1, 'Project name is required.')
  .min(3, 'Project name must be at least 3 characters.')
  .max(100, 'Project name must not exceed 100 characters.');

export const projectDescriptionSchema = z
  .string()
  .max(500, 'Description must not exceed 500 characters.')
  .optional();
