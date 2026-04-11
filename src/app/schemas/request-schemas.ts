import { z } from "zod";

export const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  passwordHash: z.string(),
  role: z.enum(["admin", "editor", "reporter", "user"]),
  createdAt: z.number(),
  lastLoginAt: z.number().optional()
});

export const loginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export const registerRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});
