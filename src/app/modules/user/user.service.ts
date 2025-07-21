import { Provider, ProviderProfile, User } from "@prisma/client";
import prisma from "../../../shared/prisma";
import ApiError from "../../../errors/ApiErrors";
import httpStatus from "http-status";
import bcrypt from "bcrypt";

import { jwtHelpers } from "../../../helpers/jwtHelpers";
import config from "../../../config";
import { Secret } from "jsonwebtoken";
import { sendOtpToGmail } from "../../../helpers/sendOtpToEmail";
import generateOTP from "../../../helpers/generateOtp";

const createUser = async (payload: User) => {
  const hashPassword = await bcrypt.hash(payload?.password as string, 10);
  try {
    const result = await prisma.user.create({
      data: {
        fullName: payload.fullName,
        email: payload.email.toLowerCase(),
        password: hashPassword,
        role: payload.role,
      },
    });

    sendOtpToGmail(result);

    const token = jwtHelpers.generateToken(
      { id: result.id },
      config.otpSecret.signup_otp_secret as Secret
    );
    return {
      token,
    };
  } catch (error: any) {
    if (error.code === "P2002") {
      throw new ApiError(httpStatus.CONFLICT, "Email  already exists");
    }
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const updateProviderProfile = async (payload: any, userId: string) => {
  console.log(payload,"chekc payload")
  await prisma.providerAvailability.deleteMany({
    where: {
      provider: {
        userId: userId,
      },
    },
  });

  const result = await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      providerProfile: {
        upsert: {
          create: {
            document: payload.document,
            certification: payload.certification,
            licenceNumber: payload.licenceNumber,
            npiNumber: payload.npiNumber,
            radius: payload.radius,
            callRequest: payload.callRequest,
            state: payload.state,
            stateLicenced: payload.stateLicenced,
            caseTypePreference: payload.caseTypePreference,
            providerAvailability: {
              createMany: {
                data: payload.providerAvailability.map((item: any) => ({
                  date: new Date(item.date),
               
                  startTime: new Date(item.startTime),
                  endTime: new Date(item.endTime),
                })),
              },
            },
            provider: payload.provider,
          },
          update: {
            document: payload.document,
            certification: payload.certification,
            licenceNumber: payload.licenceNumber,
            npiNumber: payload.npiNumber,
            radius: payload.radius,
            callRequest: payload.callRequest,
            state: payload.state,
            stateLicenced: payload.stateLicenced,
            caseTypePreference: payload.caseTypePreference,
            providerAvailability: {
              createMany: {
                data: payload.providerAvailability.map((item: any) => ({
                  date: new Date(item.date),
                 
                  startTime: new Date(item.startTime),
                  endTime: new Date(item.endTime),
                })),
              },
            },
            provider: payload.provider,
          },
        },
      },
      profileDetails: true,
    },
  });

  return result;
};

const updateFaciltyProfile = async (payload: any, userId: string) => {
  const result = await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      facilityProfile: {
        upsert: {
          create: {
            address: payload.address,
            caseType: payload.caseType,
            credentialDetails: payload.credentialDetails,
            ehrSystem: payload.ehrSystem,
            facilityName: payload.facilityName,
            md_do: payload.md_do,
            facilityType: payload.facilityType,
            orLoad: payload.orLoad,
            HrDetails: {
              create: {
                email: payload.email,
                name: payload.name,
                phoneNumber: payload.phoneNumber,
                role: payload.role,
              },
            },
          },
          update: {
            address: payload.address,
            caseType: payload.caseType,
            credentialDetails: payload.credentialDetails,
            ehrSystem: payload.ehrSystem,
            facilityName: payload.facilityName,
            md_do: payload.md_do,
            facilityType: payload.facilityType,
            orLoad: payload.orLoad,
          },
        },
      },
      profileDetails: true,
    },
  });
  return result;
};

export const userService = {
  createUser,
  updateProviderProfile,
  updateFaciltyProfile,
};
