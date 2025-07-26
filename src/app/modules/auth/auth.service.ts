import prisma from "../../../shared/prisma";
import bcrypt from "bcryptjs";
import ApiError from "../../../errors/ApiErrors";
import { jwtHelpers } from "../../../helpers/jwtHelpers";
import config from "../../../config";
import { UserStatus } from "@prisma/client";

import httpStatus from "http-status";

import { Secret } from "jsonwebtoken";

import { sendOtpToGmail } from "../../../helpers/sendOtpToEmail";
import { OtpReason } from "../../../enum/verifyEnum";

const loginUserIntoDB = async (payload: any) => {
  payload.email = payload.email.toLowerCase();
  const user = await prisma.user.findUniqueOrThrow({
    where: {
      email: payload.email,
    },
  });

  if (!user.isOtpVerify) {
    sendOtpToGmail(user);

    const token = jwtHelpers.generateToken(
      { id: user.id },
      config.otpSecret.login_otp_secret as Secret
    );

    throw new ApiError(
      httpStatus.UNAUTHORIZED,
      "OTP sent to your Gmail. Please verify.",
      {
        token,
        reason: "LOGIN_OTP_SECRET",
      }
    );
  }
  if (user.status === UserStatus.PENDING) {
    throw new ApiError(
      httpStatus.METHOD_NOT_ALLOWED,
      "your account is under reveiw"
    );
  }

  if (user.status === UserStatus.BLOCKED) {
    throw new ApiError(
      httpStatus.METHOD_NOT_ALLOWED,
      "your account is disabled.please contact with admin"
    );
  }

  const isPasswordValid = await bcrypt.compare(payload.password, user.password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid credentials");
  }

  await prisma.user.update({
    where: {
      email: payload.email,
    },
    data: {
      fcmToken: payload.fcmToken,
    },
  });
  const accessToken = jwtHelpers.generateToken(
    user,
    config.jwt.jwt_secret as string,
    config.jwt.expires_in as string
  );
  const { password, status, createdAt, updatedAt, ...userInfo } = user;

  return {
    accessToken,
    userInfo,
  };
};
const forgetPasswordToGmail = async (email: string) => {
  const existingUser = await prisma.user.findUniqueOrThrow({
    where: {
      email: email,
    },
  });

  sendOtpToGmail(existingUser);

  const token = jwtHelpers.generateToken(
    { id: existingUser.id },
    config.otpSecret.forget_password_secret as Secret
  );
  return {
    token,
  };
};

const verifyOtp = async (
  otp: string,
  userId: string,
  fcmToken: string,
  reason: OtpReason
) => {
  const existingOtp = await prisma.otp.findUnique({
    where: {
      userId: userId,
    },
    include: {
      user: true,
    },
  });

  if (existingOtp?.otpCode !== otp) {
    throw new ApiError(httpStatus.NOT_FOUND, "Wrong OTP");
  }

  if (existingOtp.expiresAt && new Date() > existingOtp.expiresAt) {
    await prisma.otp.deleteMany({ where: { userId: userId } });
    throw new ApiError(
      httpStatus.UNAUTHORIZED,
      "Your OTP has expired. Please request a new one."
    );
  }

  if (reason !== OtpReason.FORGET_PASSWORD) {
    await prisma.user.update({
      where: {
        id: existingOtp.userId,
      },
      data: {
        fcmToken: fcmToken,
        status: UserStatus.ACTIVE,
        isOtpVerify: true,
      },
    });
  }

  switch (reason) {
    case OtpReason.RESET_PASSWORD:
      return {
        token: jwtHelpers.generateToken(
          { id: userId },
          config.jwt.jwt_secret as Secret,
          config.jwt.expires_in
        ),
        isProfile: existingOtp.user.isProfile,
      };
    case OtpReason.FORGET_PASSWORD:
      return {
        token: jwtHelpers.generateToken(
          { id: userId },
          config.otpSecret.reset_password_secret as Secret,
          config.jwt.expires_in
        ),
        isProfile: existingOtp.user.isProfile,
      };
    case OtpReason.SIGNUP_OTP_SECRET:
      return {
        token: jwtHelpers.generateToken(
          { id: userId },

          config.jwt.jwt_secret as Secret
        ),
        isProfile: existingOtp.user.isProfile,
      };
    case OtpReason.LOGIN:
      return {
        token: jwtHelpers.generateToken(
          { id: userId },
          config.jwt.jwt_secret as Secret
        ),
        isProfile: existingOtp.user.isProfile,
      };
    default:
      throw new ApiError(httpStatus.BAD_REQUEST, "Invalid OTP reason");
  }
};

const resetPassword = async (newPassword: string, userId: string) => {
  const existingUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!existingUser) {
    throw new ApiError(404, "user not found");
  }

  const hashedPassword = await bcrypt.hash(
    newPassword,
    Number(config.jwt.gen_salt)
  );

  const result = await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      password: hashedPassword,
    },
  });
  const token = jwtHelpers.generateToken(
    { id: userId },
    config.jwt.jwt_secret as Secret,
    config.jwt.expires_in as string
  );

  return token;
};
const resendOtp = async (email: string, reason: string) => {
  const user = await prisma.user.findUnique({
    where: {
      email: email,
    },
  });
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "user not found");
  }
  sendOtpToGmail(user);
  let token;
  switch (reason) {
    case "SIGNUP_OTP_SECRET":
      token = jwtHelpers.generateToken(
        { id: user.id },
        config.otpSecret.signup_otp_secret as Secret
      );
      break;
    case "RESET_PASSWORD_SECRET":
      token = jwtHelpers.generateToken(
        { id: user.id },
        config.otpSecret.reset_password_secret as Secret
      );
      break;
    case "LOGIN_OTP_SECRET":
      token = jwtHelpers.generateToken(
        { id: user.id },
        config.otpSecret.login_otp_secret as Secret
      );
      break;
    case "FORGET_PASSWORD_SECRET":
      token = jwtHelpers.generateToken(
        { id: user.id },
        config.otpSecret.forget_password_secret as Secret
      );
      break;
    default:
      throw new ApiError(httpStatus.BAD_REQUEST, "Invalid reason provided");
  }

  return {
    token,
  };
};
export const authService = {
  loginUserIntoDB,

  forgetPasswordToGmail,
  // forgetPasswordToPhone,
  verifyOtp,
  resetPassword,
  resendOtp,
};
