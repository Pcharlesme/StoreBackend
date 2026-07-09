import z from "zod";

export const listingSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Title must be at least 3 characters")
    .max(100, "Title cannot exceed 100 characters"),
  description: z
    .string()
    .trim()
    .min(10, "Description must be at least 10 characters")
    .max(600, "Description cannot exceed 600 characters"),
  type: z.enum(["FREE", "SELL", "SWAP"]),
  price: z.number().min(0, "Price cannot be negative"),
  category: z.string().trim(),
  expiryDate: z.coerce.date(),
  location: z.object({
    city: z.string().trim().min(1, "City is required"),
  }),
  images: z
    .array(z.string().trim())
    .min(1, "At least one image is required")
    .max(10, "Maximum 10 images")
    .optional(),
});

export const listingStatusSchema = z.object({
  status: z.enum(["ACTIVE", "SOLD", "EXPIRED", "DELETED"]),
});
