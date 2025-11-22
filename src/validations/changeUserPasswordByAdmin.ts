import { z } from "zod";

export const changeUserPasswordByAdminSchema = z
  .object({
    userId: z
      .string({ required_error: "User ID is required" })
      .min(1, "User ID is required"),
    password: z
      .string({ required_error: "Password is required" })
      .min(1, "Password is required"),
    confirmPassword: z
      .string({ required_error: "New password is required" })
      .min(1, "New password is required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Password and confirm password must match",
    path: ["confirmPassword"],
  });
