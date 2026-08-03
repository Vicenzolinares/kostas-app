import { z } from "zod";

export const userRoleValues = [
  "admin",
  "manager",
  "sales",
  "designer",
  "shop_floor",
  "employee",
] as const;
export const userRoleSchema = z.enum(userRoleValues);
export type UserRole = z.infer<typeof userRoleSchema>;

export const signUpSchema = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().email(),
  password: z.string().min(8).max(200),
  role: userRoleSchema.default("employee"),
});
export type SignUpInput = z.infer<typeof signUpSchema>;

export const signInSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});
export type SignInInput = z.infer<typeof signInSchema>;
