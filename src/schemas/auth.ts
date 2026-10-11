import { z } from "zod";

export const signupSchema = z.object({
  email: z.string().trim().max(254).pipe(z.email("Invalid email")),
  // Passwords are never trimmed: whitespace is a legitimate character.
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password cannot exceed 72 characters") // bcrypt ignores bytes beyond 72
    .regex(/[A-Z]/, "Password must contain an uppercase letter")
    .regex(/[0-9]/, "Password must contain a number"),
});

// Login deliberately skips the strength rules so older accounts can still sign in.
// Validating types here also blocks operator injection like { "email": { "$ne": null } }.
export const loginSchema = z.object({
  email: z.string().trim().min(1).max(254),
  password: z.string().min(1).max(72),
});

const locationSchema = z.object({
  city: z.string().trim().min(1).max(100),
  country: z.string().trim().max(100).optional(),
  postcode: z.string().trim().max(20).optional(),
});

export const profileSchema = z.object({
  fullname: z.string().trim().min(1).max(100),
  contactno: z.string().trim().max(30),
  gender: z.enum(["male", "female"]),
  address: z.string().trim().max(200).optional(),
  location: locationSchema.optional(),
});

export const updateProfileSchema = profileSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, "Provide at least one field to update");
