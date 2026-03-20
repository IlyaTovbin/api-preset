import { z } from "zod";

export const signInSchema = z.object({
  email: z.email().trim().toLowerCase(),
  password: z.string().min(6).max(128),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(10),
});
