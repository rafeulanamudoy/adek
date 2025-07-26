import {
  Branch,
  Cause,
  EmotionalReason,
  Goal,
  ServiceYear,
} from "@prisma/client";
import { z } from "zod";

const userRegisterValidationSchema = z.object({
  fullName: z.string({ required_error: "full name is required" }),

  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const createProfileSchema = z
  .object({
    branch: z.nativeEnum(Branch),
    serviceYear: z.nativeEnum(ServiceYear),
    desc: z.string(),
    goal: z
      .array(z.nativeEnum(Goal), {
        required_error: "Goal is required",
      })
      .min(1, "Select at least one goal"),

    cause: z
      .array(z.nativeEnum(Cause), {
        required_error: "Cause is required",
      })
      .min(1, "Select at least one cause"),

    emotionalReason: z
      .array(z.nativeEnum(EmotionalReason), {
        required_error: "Emotional reason is required",
      })
      .min(1, "Select at least one emotional reason"),
  })
  .strict();

export const userValidation = {
  userRegisterValidationSchema,
  createProfileSchema,
};
