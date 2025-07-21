import {
  CaseType,
  CaseTypePreference,
  Certification,
  EhrSystem,
  FacilityType,
  HrRole,
  MD_DO,
  Provider,
  StateLicence,
  TimeSlot,
  UserRole,
} from "@prisma/client";
import { z } from "zod";

const userRegisterValidationSchema = z.object({
  fullName: z.string({ required_error: "full name is required" }),
  role: z.nativeEnum(UserRole),
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const updateProviderProfile = z.object({
  provider: z
    .array(
      z.nativeEnum(Provider, {
        errorMap: () => ({ message: "Invalid provider type" }),
      })
    )
    .min(1, "At least one case type must be selected"),
  npiNumber: z.string().min(1, "NPI Number is required"),
  licenceNumber: z.string().min(1, "Licence Number is required"),
  state: z.string().min(1, "State is required"),
  certification: z.array(
    z.nativeEnum(Certification, {
      errorMap: () => ({ message: "Invalid certificate  type" }),
    })
  ),

  radius: z.number().min(0, "Radius must be a positive number"),
  callRequest: z.boolean(),

  stateLicenced: z.array(
    z.nativeEnum(StateLicence, {
      errorMap: () => ({ message: "Invalid state licence type" }),
    })
  ),

  providerAvailability: z
    .array(
      z.object({
        date: z.string().refine((val) => !isNaN(Date.parse(val)), {
          message: "Invalid date format",
        }),
      
        startTime: z.string().refine((val) => !isNaN(Date.parse(val)), {
          message: "Invalid start time",
        }),
        endTime: z.string().refine((val) => !isNaN(Date.parse(val)), {
          message: "Invalid end time",
        }),
      })
    )
    .min(1, "At least one availability slot is required"),
  caseTypePreference: z
    .array(
      z.nativeEnum(CaseTypePreference, {
        errorMap: () => ({ message: "Invalid case type" }),
      })
    )
    .min(1, "At least one case type must be selected"),
});
const updateFacilityProfile = z.object({
  facilityName: z.string().min(1, "Facility Name is required"),
  address: z.string().min(1, "Address is required"),
  caseType: z.nativeEnum(CaseType),
  credentialDetails: z.nativeEnum(Certification),
  ehrSystem: z.nativeEnum(EhrSystem),

  md_do: z.nativeEnum(MD_DO),
  facilityType: z.nativeEnum(FacilityType),
  orLoad: z.string(),
  email: z.string().email(),
  name: z.string().min(1),
  phoneNumber: z.string(),
  role: z.nativeEnum(HrRole),
});
export const userValidation = {
  userRegisterValidationSchema,
  updateProviderProfile,
  updateFacilityProfile,
};
