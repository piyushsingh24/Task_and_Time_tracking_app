import { z } from "zod";

export const timeLogsQuerySchema = z.object({
  taskId: z.string().min(1).max(100).optional(),
  limit: z
    .string()
    .optional()
    .transform((v) => (v === undefined ? undefined : Number(v)))
    .refine((v) => v === undefined || (Number.isInteger(v) && v >= 1 && v <= 100), {
      message: "limit must be an integer between 1 and 100",
    })
    .transform((v) => v ?? 50),
});

export type TimeLogsQuery = z.infer<typeof timeLogsQuerySchema>;
