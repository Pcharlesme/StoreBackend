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
