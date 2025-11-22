import { z } from "zod";

export const userCreateSchema = z
  .object({
    email: z
      .string({ required_error: "Email is required" })
      .email({ message: "Invalid email format" }),
    name: z
      .string({ required_error: "Name is required" })
      .min(1, { message: "Name must be at least 1 character" }),
    password: z
      .string({ required_error: "Password is required" })
      .min(8, { message: "Password must be at least 8 characters" }),
    confirmPassword: z.string({
      required_error: "Confirm password is required",
    }),
    phone: z
      .string()
      .optional(),
    roleType: z
      .number({ required_error: "Role type is required" })
      .min(0, { message: "Role type must be 0 or 1" })
      .max(1, { message: "Role type must be 0 or 1" })
      .optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
export const changePasswordSchema = z.object({
  password: z
    .string({ required_error: "Password is required" })
    .min(8, { message: "Password must be at least 8 characters" }),
  newPassword: z
    .string({ required_error: "New password is required" })
    .min(8, { message: "New password must be at least 8 characters" }),
  confirmPassword: z
    .string({ required_error: "Confirm password is required" })
    .min(8, { message: "Confirm password must be at least 8 characters" }),
});

export const resetPasswordSchema = z
  .object({
    verificationCode: z.string({ required_error: "Token is required" }),
    password: z
      .string({ required_error: "Password is required" })
      .min(8, { message: "Password must be at least 8 characters" }),
    confirmPassword: z
      .string({ required_error: "Confirm password is required" })
      .min(8, { message: "Confirm password must be at least 8 characters" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Password and confirm password must be same",
    path: ["confirmPassword"],
  });
export const forgotPasswordSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .email({ message: "Invalid email format" }),
});

export const verifyCodeSchema = z.object({
  verificationCode: z.string({ required_error: "Email Verification Code  is required" }),
});


export const usersQuerySchema = z.object({
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().optional(),
  searchParam: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  roleType: z.number().int().optional(), // optional role filter
});


export const addRoleBaseUser = z
  .object({
    email: z
      .string({ required_error: "Email is required" })
      .email({ message: "Invalid email format" }),
    name: z
      .string({ required_error: "Name is required" })
      .min(1, { message: "Name must be at least 1 character" }),
    password: z
      .string({ required_error: "Password is required" })
      .min(8, { message: "Password must be at least 8 characters" }),
    confirmPassword: z.string({
      required_error: "Confirm password is required",
    }),
    roleType: z
      .number({ required_error: "Role type is required" })
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"], // set the error path to `confirmPassword` field
  });
