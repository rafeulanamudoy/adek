import { UserRole } from "@prisma/client";
import { z } from "zod";

const userRegisterValidationSchema = z.object({
  fullName: z.string({ required_error: "full name is required" }),

  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
  phoneNumber: z.string({ required_error: "phonbe number is required" }),
  companyName: z.string().optional(),
  role:z.nativeEnum(UserRole)
});

export const userValidation = {
  userRegisterValidationSchema,
};
