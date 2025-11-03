import { z } from "zod";

export const signUpBusinessUser = z.object({
  email: z.string({ required_error: "Email is required" }).email({ message: "Invalid email format" }),
  name: z.string({ required_error: "Name is required" }).min(1, { message: "Name must be at least 1 character" }),
  password: z.string({ required_error: "Password is required" }).min(8, { message: "Password must be at least 8 characters" }),
  confirmPassword: z.string({ required_error: "Confirm password is required" }),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, { message: "Invalid phone number format" }).optional(),

  businessInfo: z.object({
    businessName: z.string({ required_error: "Business name is required" }).min(1),
    businessDescription: z.string({ required_error: "Business description is required" }).min(1),
    operatingHours: z.string({ required_error: "Operating hours is required" }).min(1),
    phone: z.string({ required_error: "Business phone is required" }),
    businessLocation: z.object({
      type: z.literal("Point"),
      coordinates: z.tuple([z.number(), z.number()]), // [longitude, latitude]
      state: z.string({ required_error: "State is required" }).optional(),
      city: z.string({ required_error: "City is required" }).optional(),
      postalCode: z.string({ required_error: "Postal code is required" }).optional(),
      streetAddress: z.string({ required_error: "Street address is required" }).optional(),
    }),
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});