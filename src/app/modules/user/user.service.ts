import { Article, User } from "@prisma/client";
import prisma from "../../../shared/prisma";
import ApiError from "../../../errors/ApiErrors";
import httpStatus from "http-status";
import bcrypt from "bcrypt";

import { jwtHelpers } from "../../../helpers/jwtHelpers";
import config from "../../../config";
import { Secret } from "jsonwebtoken";
import { sendOtpToGmail } from "../../../helpers/sendOtpToEmail";
import searchAndPaginate from "../../../helpers/searchAndPaginate";

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
      profileImage:payload.profileImage,
      Profile: {
        upsert: {
          create: {
            branch: payload.branch,
            desc: payload.desc,
            serviceYear: payload.serviceYear,
            cause: payload.cause,
            emotionalReason: payload.emotionalReason,
            goal: payload.goal,
          },
          update: {
            branch: payload.branch,
            desc: payload.desc,
            serviceYear: payload.serviceYear,
            cause: payload.cause,
            emotionalReason: payload.emotionalReason,
            goal: payload.goal,
          },
        },
      },
    },
    select:{
      id:true,
    }
  });

  return result;
};

const getUserProfile = async (userId: string) => {
  const result = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id:true,
      fullName:true,
      Profile:true,
      profileImage:true,
      
    },
  });

  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, "User profile not found");
  }

  return result;
};

const getUserArticlePreference=async(userId:string,page:number,limit:number)=>{

  const user=await prisma.user.findUniqueOrThrow({
    where:{
      id:userId
    },
    include:{
      Profile:true
    }
  })
  let additionalFilter={
        
  }
  const result=await searchAndPaginate<Article>(
    prisma.article,
    [],
    page,
    limit,
    "",
    additionalFilter,
    {
      select: {
        id: true,
        articleImage: true,
        content: true,
        time: true,
        title: true,
        emotionalReason: true,
        cause: true,
        goal: true,
        mood: true,
      },
    }
  );

  return result

 



}

export const userService = {
  createUser,
  updateProfile,

  getUserProfile,
  getUserArticlePreference
};
