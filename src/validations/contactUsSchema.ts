import { z } from "zod";

export const contactUsSchema = z.object({
  name: z.string({ required_error: "Name is required" }).min(1),
  email: z.string({ required_error: "Email is required" }).email(),
  description: z.string({ required_error: "Description is required" }).min(1),
});

export type IContactUs = z.infer<typeof contactUsSchema>;
