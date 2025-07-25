import { z } from "zod";
import { Mood, Goal, Cause, EmotionalReason } from "@prisma/client"; 

const createArticle = z.object({
  mood: z
    .array(z.nativeEnum(Mood), {
      required_error: "Mood is required",
    })
    .min(1, "Select at least one mood"),

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

  title: z.string().min(1, "Title is required"),
  time: z.string().min(1, "Time is required"),
  content: z.any(), 
 
});



export const createGroundingSound = z.object({
  mood: z.nativeEnum(Mood, {
    required_error: "mood is required",
  }),

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

  soundName: z.string().min(1, "Sound name is required"),
  authority: z.string().min(1, "Authority is required"),
  time: z.string().min(1, "Time is required"),
 
});



export const adminValidation = {
  createArticle,
  createGroundingSound
};
