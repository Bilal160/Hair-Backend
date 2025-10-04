import { z } from "zod";

export const createReviewSchema = z.object({
  businessId: z.string().min(1, "Business ID is required"),
  rating: z.string().min(1, "Rating is required"),
  comment: z.string().min(1, "Comment is required"),
});

export const updateReviewSchema = z.object({
  rating: z.string().min(1, "Rating is required"),
  comment: z.string().min(1, "Comment is required"),
});
