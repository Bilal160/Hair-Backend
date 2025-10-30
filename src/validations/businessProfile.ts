import { z } from "zod";

export const updateBusinessProfileSchema = z.object({
  businessName: z.string().optional(),
  businessDescription: z.string().optional(),

  businessLocation: z.object({
    type: z.literal("Point").optional(),
    coordinates: z
      .array(z.number())
      .length(2, "Coordinates must be [longitude, latitude]"),
    state: z.string().optional(),
    city: z.string().optional(),
    postalCode: z.string().optional(),
    streetAddress: z.string().optional(),
  }),

  telegramLink: z.string().optional(),
  phone: z.string().optional(),
  instagramId: z.string().optional(),

  operatingHours: z.string().optional(),
  operatingDays: z.string().optional(),

  userId: z.string().optional(), // required in DB, optional here for update

  averageRating: z.array(z.any()).optional(),
  totalReviews: z.number().optional(),
  reviews: z.array(z.any()).optional(),

  businessSlug: z.string().optional(),
  slug: z.string().optional(),

  dealIds: z.array(z.string()).optional(), // assuming array of ObjectId strings

  bannerImageId: z.string().optional(),

  subscriptionType: z.string().optional(),
  websiteLink: z.string().optional(),
  googleBusinessLink: z.string().optional(),
  lunchSpecialTime: z.string().optional(),
  dailySpecialTime: z.string().optional(),
  logoImageId: z.string().optional(),
  removeLogo: z.boolean().optional(),
  removeBanner: z.boolean().optional(),
  instagramToken: z.string().optional().default(""),
});
