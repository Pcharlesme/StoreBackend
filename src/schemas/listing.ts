import { z } from "zod";

export const ListingStatuses = ["ACTIVE", "SOLD", "EXPIRED", "DELETED"] as const;
export const ListingTypes = ["FREE", "SELL", "SWAP"] as const;

const title = z
  .string()
  .trim()
  .min(3, "Title must be at least 3 characters")
  .max(100, "Title cannot exceed 100 characters");

const description = z
  .string()
  .trim()
  .min(10, "Description must be at least 10 characters")
  .max(600, "Description cannot exceed 600 characters");

const price = z.coerce.number().min(0, "Price cannot be negative");

const expiryDate = z.coerce
  .date()
  .refine((date) => date.getTime() > Date.now(), "Expiry date must be in the future");

const location = z.object({
  city: z.string().trim().min(1, "City is required").max(100),
});

// Multipart forms send every field as a string, so `location` arrives as JSON text.
const jsonLocation = z.preprocess((value) => {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return value; // let the object schema report a readable error
  }
}, location);

/** POST /listings (multipart/form-data). Images come from multer, not the body. */
export const createListingSchema = z.object({
  title,
  description,
  type: z.enum(ListingTypes),
  price,
  category: z.string().trim().min(1, "Category is required").max(50),
  expiryDate,
  location: jsonLocation,
});

/** PATCH /listings/:id (JSON). */
export const updateListingSchema = z
  .object({
    title,
    description,
    price,
    type: z.enum(ListingTypes),
    category: z.string().trim().min(1).max(50),
    expiryDate,
    location,
    status: z.enum(["SOLD"]),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, "Provide at least one field to update");

export const listingStatusSchema = z.object({
  status: z.enum(ListingStatuses),
});

export const listingQuerySchema = z.object({
  page: z.coerce.number().int().min(1).catch(1),
  limit: z.coerce
    .number()
    .int()
    .catch(10)
    .transform((n) => Math.min(Math.max(n, 1), 50)),
  search: z.string().trim().max(100).optional().catch(undefined),
});
