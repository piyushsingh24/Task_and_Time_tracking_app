import { z } from "zod";

export const taskStatusSchema = z.enum(["PENDING", "IN_PROGRESS", "COMPLETED"]);
export type TaskStatusInput = z.infer<typeof taskStatusSchema>;

const titleSchema = z
  .string()
  .trim()
  .min(1, "Title is required")
  .max(200, "Title must be at most 200 characters");

const descriptionSchema = z
  .string()
  .trim()
  .max(5000, "Description must be at most 5000 characters")
  .optional()
  .transform((v) => (v && v.length > 0 ? v : undefined));

/**
 * Due day as calendar date (YYYY-MM-DD) -> UTC midnight Date.
 * Date-only semantics: no time-of-day, no timezone shift.
 */
const dueDateString = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid due date. Use YYYY-MM-DD format.")
  .refine(
    (s) => {
      const [y, m, d] = s.split("-").map(Number);
      const dt = new Date(Date.UTC(y, m - 1, d));
      return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
    },
    "Invalid due date.",
  )
  .transform((s) => new Date(`${s}T00:00:00Z`));

export const createTaskSchema = z.object({
  title: titleSchema,
  description: descriptionSchema,
  status: taskStatusSchema.optional().default("PENDING"),
  dueDate: dueDateString.optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;

export const updateTaskSchema = z
  .object({
    title: titleSchema.optional(),
    description: z
      .string()
      .trim()
      .max(5000, "Description must be at most 5000 characters")
      .nullable()
      .optional()
      .transform((v) => {
        if (v === undefined) return undefined;
        if (v === null) return null;
        return v.length > 0 ? v : null;
      }),
    status: taskStatusSchema.optional(),
    // null clears the due date.
    dueDate: dueDateString.nullable().optional(),
  })
  .refine(
    (v) =>
      v.title !== undefined ||
      v.description !== undefined ||
      v.status !== undefined ||
      v.dueDate !== undefined,
    {
      message: "At least one field must be provided.",
    },
  );

export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

export const taskQuerySchema = z.object({
  status: taskStatusSchema.optional(),
  search: z.string().trim().max(100).optional(),
});

export type TaskQuery = z.infer<typeof taskQuerySchema>;

export const taskIdSchema = z.string().min(1, "Task id is required").max(100);
