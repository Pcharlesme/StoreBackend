import z from "zod";

export const authSchemaType = z.object({
  email: z.string().trim().email("Invalid email"),
  password: z
    .string()
    .trim()
    .min(8)
    .regex(/[A-Z]/, "Must contain uppercase")
    .regex(/[0-9]/, "Mustcontain number"),
});

const locationSchema = z.object({
  city: z.string().trim(),
  country: z.string().trim().optional(),
  postcode: z.string().trim().optional(),
});

export const profileSchemaType = z.object({
  fullname: z.string().trim(),
  contactno: z.string().trim(),
  gender: z.enum(["male", "female"]),
  address: z.string().trim().optional(),
  location: locationSchema.optional(),
});
export const updateProfileSchema = profileSchemaType.partial();
