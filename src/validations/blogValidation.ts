import { z } from "zod";

export const createBlogSchema = z.object({
  title: z
    .string({ required_error: "Title is required" })
    .min(1, { message: "Title must be at least 1 character" })

    .trim(),
  description: z
    .string({ required_error: "Description is required" })
    .min(1, { message: "Description must be at least 1 character" })
    .trim(),
  content: z
    .string({ required_error: "Content is required" })
    .min(1, { message: "Content must be at least 1 character" }),
  featuredImageId: z
    .string()
    .optional()
    .nullable(),
});

export const updateBlogSchema = z.object({
  title: z
    .string()
    .min(1, { message: "Title must be at least 1 character" })
    .max(200, { message: "Title must not exceed 200 characters" })
    .trim()
    .optional(),
  description: z
    .string()
    .min(1, { message: "Description must be at least 1 character" })
    .trim()
    .optional(),
  content: z
    .string()
    .min(1, { message: "Content must be at least 1 character" })
    .optional(),
  featuredImageId: z
    .string()
    .optional()
    .nullable(),
  removeFeaturedImage: z
    .boolean()
    .optional(),
});

export const blogQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .refine((val) => val > 0, { message: "Page must be greater than 0" }),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 10))
    .refine((val) => val > 0 && val <= 100, {
      message: "Limit must be between 1 and 100"
    }),
  search: z
    .string()
    .optional()
    .transform((val) => val?.trim()),
  sortBy: z
    .enum(["createdAt", "updatedAt", "title"])
    .optional()
    .default("createdAt"),
  sortOrder: z
    .enum(["asc", "desc"])
    .optional()
    .default("desc"),
});
