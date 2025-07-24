import {  User } from "@prisma/client";
import prisma from "../../../shared/prisma";
import ApiError from "../../../errors/ApiErrors";
import httpStatus from "http-status";
import bcrypt from "bcrypt";

import { jwtHelpers } from "../../../helpers/jwtHelpers";
import config from "../../../config";
import { Secret } from "jsonwebtoken";
import { sendOtpToGmail } from "../../../helpers/sendOtpToEmail";


const createUser = async (payload: User) => {
  const hashPassword = await bcrypt.hash(payload?.password as string, 10);
  try {
    const result = await prisma.user.create({
      data: {
        fullName: payload.fullName,
        email: payload.email.toLowerCase(),
        password: hashPassword,
        
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

const updateProfile = async (payload: any, userId: string) => {
  console.log(payload,"chekc payload")

  const result = await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
     
    },
  });

  return result;
};



const getUserProfile = async (userId: string) => {
  const result = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    include: {
      
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
};
