import { z } from "zod";

export const createSetupIntentSchema = z.object({
  stripeCustomerId: z
    .string({ required_error: "Stripe customer id is required" })
    .min(1, { message: "Stripe customer id is required" }),
});
