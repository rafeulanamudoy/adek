import { Prisma, User } from "@prisma/client";
import prisma from "../../../shared/prisma";
import ApiError from "../../../errors/ApiErrors";
import httpStatus from "http-status";
import bcrypt from "bcrypt";

import { jwtHelpers } from "../../../helpers/jwtHelpers";
import config from "../../../config";
import { Secret } from "jsonwebtoken";
import { sendOtpToGmail } from "../../../helpers/sendOtpToEmail";
import { searchAndPaginate } from "../../../helpers/searchAndPaginate";
import { MongoClient, ObjectId } from "mongodb";
import { getMongoCollection } from "../../../helpers/mongo";

const createUser = async (payload: User) => {
  const hashPassword = await bcrypt.hash(payload?.password as string, 10);
  try {
    const isExist = await prisma.user.findUnique({
      where: {
        email: payload.email,
      },
    });
    if (isExist && !isExist.isOtpVerify) {
      sendOtpToGmail(isExist);
      const token = jwtHelpers.generateToken(
        { id: isExist?.id },
        config.otpSecret.signup_otp_secret as Secret
      );
      return {
        token,
      };
    }
    const result = await prisma.user.create({
      data: {
        fullName: payload.fullName,
        email: payload.email.toLowerCase(),
        password: hashPassword,
        phoneNumber: payload.phoneNumber,
        companyName: payload.companyName || "",
        role: payload.role,
      },
    });

    const token = jwtHelpers.generateToken(
      { id: result.id },
      config.otpSecret.signup_otp_secret as Secret
    );
    sendOtpToGmail(result);
    return {
      token,
    };
  } catch (error: any) {
    console.log(error, "check error");
    if (error.code === "P2002") {
      throw new ApiError(httpStatus.CONFLICT, "Email  already exists");
    }
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const updateProfile = async (payload: any, userId: string) => {
  const result = await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      isProfile: true,
      profileImage: payload.profileImage,
      coverPhoto: payload.coverPhoto,
      Profile: {},
    },
    select: {
      id: true,
    },
  });

  return result;
};

const getUserProfile = async (userId: string) => {
  const result = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      fullName: true,
      Profile: true,
      profileImage: true,
      coverPhoto: true,
    },
  });

  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, "User profile not found");
  }

  return result;
};

const searchUser = async (
  page: number = 1,
  limit: number = 10,
  searchQuery: string = "",
  filter: { branch?: string; serviceYear?: string } = {}
) => {
  const profileFilter: Prisma.ProfileWhereInput = {};

  const additionalFilter: Prisma.UserWhereInput = {
    NOT: {
      role: "ADMIN",
    },
    Profile: Object.keys(profileFilter).length ? profileFilter : undefined,
  };

  const users = await searchAndPaginate<
    typeof prisma.user,
    Prisma.UserWhereInput,
    Prisma.UserSelect
  >(
    prisma.user,
    ["fullName", "email"],
    page || 1,
    limit || 10,
    searchQuery,
    additionalFilter,
    {
      select: {
        id: true,
        fullName: true,
        email: true,
        profileImage: true,
        user1Convarsion: true,
        user2Convarsion: true,
        Profile: true,
      },
    }
  );

  return { users };
};

const getOtherUserProfile = async (userId: string) => {
  const result = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      fullName: true,

      Profile: {},
      profileImage: true,
      coverPhoto: true,
    },
  });

  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, "User profile not found");
  }

  return result;
};

export const userService = {
  createUser,
  updateProfile,

  getUserProfile,

  searchUser,
  getOtherUserProfile,
};
