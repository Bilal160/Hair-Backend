import { z } from "zod";

export const createServiceSchema = z.object({
  userId: z.string({ required_error: "UserId is required" }),
  businessId: z.string({ required_error: "BusinessId is required" }),
  name: z
    .string({ required_error: "Name is required" })
    .min(2, { message: "Service name must be at least 2 characters." }),
  description: z
    .string({ required_error: "Description is required" })
    .min(5, { message: "Service description must be at least 5 characters." }),
  price: z.string({ required_error: "Price Required For Service " }),
  servicePhotoId: z.string().optional().nullable(),
});

export const updateServiceSchema = z.object({
  businessId: z.string({ required_error: "BusinessId is required" }),
  userId: z.string({ required_error: "UserId is required" }),
  name: z
    .string({ required_error: "Name is required" })
    .min(2, { message: "Service name must be at least 2 characters." })
    .optional(),
  description: z
    .string({ required_error: "Description is required" })
    .min(5, { message: "Service description must be at least 5 characters." })
    .optional(),
  price: z.string({ required_error: "Price Required For Service " }),
  servicePhotoId: z.string().optional().nullable(),
  removePhoto: z.string().optional(),
});
