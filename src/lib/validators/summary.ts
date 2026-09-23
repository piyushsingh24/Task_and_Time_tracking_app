import { z } from "zod";
import { isValidTimezone } from "@/lib/day";

export const summaryQuerySchema = z.object({
  tz: z
    .string()
    .trim()
    .max(100)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : "UTC"))
    .refine((v) => isValidTimezone(v), { message: "Invalid timezone." }),
});

export type SummaryQuery = z.infer<typeof summaryQuerySchema>;
