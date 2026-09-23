import { z } from "zod";

export const suggestInputSchema = z.object({
  input: z
    .string()
    .trim()
    .min(3, "Please describe your task in at least 3 characters.")
    .max(500, "Input must be at most 500 characters."),
});

export type SuggestInput = z.infer<typeof suggestInputSchema>;

/** The structured suggestion we accept back from Groq (validated, never trusted raw). */
export const suggestionSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(1000),
});

export type Suggestion = z.infer<typeof suggestionSchema>;
