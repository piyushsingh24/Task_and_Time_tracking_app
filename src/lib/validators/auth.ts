import { z } from "zod";

// Password floor: 8 chars (tested: weak input rejected).
// Ceiling 72 chars: bcrypt input limit.
const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password must be at most 72 characters");

const emailSchema = z
  .string()
  .trim()
  .min(1, "Email is required")
  .max(254, "Email is too long")
  .email("Invalid email address");

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .max(100, "Name is too long")
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
  email: emailSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  // Login accepts any non-empty password; strength rules apply at registration.
  password: z.string().min(1, "Password is required").max(72),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

/** Normalize email before storage/lookup: trim + lowercase. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
