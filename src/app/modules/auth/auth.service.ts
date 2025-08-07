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
import { constructFromSymbol } from "date-fns/constants";

const loginUserIntoDB = async (payload: any) => {
  payload.email = payload.email.toLowerCase();
  const user = await prisma.user.findUniqueOrThrow({
    where: {
      email: payload.email,
    },
  });
  if (!user.password) {
    throw new ApiError(
      400,
      "User signed up with social login. Please login with Google"
    );
  }
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

  const isPasswordValid = await bcrypt.compare(
    payload.password,
    user.password as string
  );

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
  const {
    password,
    status,
    createdAt,
    updatedAt,
    socialLoginType,
    ...userInfo
  } = user;

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

export const changePassword = async (
  userId: string,
  oldPassword: string,
  newPassword: string
) => {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
  });

  // ✅ If user signed in via social login and doesn't have a password
  if (!user.password) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Password change is not available for social login accounts."
    );
  }

  const isMatch = await bcrypt.compare(oldPassword, user.password);
  if (!isMatch) {
    throw new ApiError(httpStatus.CONFLICT, "Old password is incorrect.");
  }

  const isSamePassword = await bcrypt.compare(newPassword, user.password);
  if (isSamePassword) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "New password must be different from the old password."
    );
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });

  return { message: "Password changed successfully." };
};

const socialLoginIntoDb = async (payload: any) => {
  const email = payload.email.toLowerCase();
  let accessToken;

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    if (existingUser.socialLoginType !== payload.socialLoginType) {
      throw new ApiError(
        httpStatus.NOT_ACCEPTABLE,
        `You have already signed up using ${existingUser.socialLoginType}. Please continue using the same method.`
      );
    }

    accessToken = jwtHelpers.generateToken(
      existingUser,
      config.jwt.jwt_secret as string,
      config.jwt.expires_in as string
    );

    const {
      password,
      createdAt,
      updatedAt,
      socialLoginType,
      status,
      ...userInfo
    } = existingUser;

    switch (existingUser.status) {
      case UserStatus.PENDING:
      case UserStatus.BLOCKED:
        return { accessToken: null, userInfo };

      case UserStatus.ACTIVE:
        return {
          accessToken,
          userInfo: {
            userId: existingUser.id,
            isProfile: existingUser.isProfile,
          },
        };

      default:
        throw new ApiError(
          httpStatus.INTERNAL_SERVER_ERROR,
          "Unexpected user status."
        );
    }
  }

  const userData: any = {
    email,
    fullName: payload.fullName,
    socialLoginType: payload.socialLoginType,
    fcmToken: payload.fcmToken || "",
    profileImage: payload.profileImage || "",
    role: payload.role,
    status: UserStatus.ACTIVE,
  };

  const newUser = await prisma.user.create({
    data: userData,
  });

  accessToken = jwtHelpers.generateToken(
    newUser,
    config.jwt.jwt_secret as string,
    config.jwt.expires_in as string
  );

  return {
    accessToken,
    userInfo: { userId: newUser.id, isProfile: newUser.isProfile },
  };
};

export const authService = {
  loginUserIntoDB,

  forgetPasswordToGmail,

  verifyOtp,
  resetPassword,
  resendOtp,
  changePassword,
  socialLoginIntoDb,
};
