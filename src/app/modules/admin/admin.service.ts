import prisma from "../../../shared/prisma";
import bcrypt from "bcryptjs";
import ApiError from "../../../errors/ApiErrors";
import { jwtHelpers } from "../../../helpers/jwtHelpers";
import config from "../../../config";


import { searchAndPaginate } from "../../../helpers/searchAndPaginate";
import { Prisma } from "@prisma/client";

const loginAdmin = async (payload: any) => {
  const user = await prisma.admin.findUnique({
    where: {
      email: payload.email.toLowerCase(),
    },
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const isPasswordValid = await bcrypt.compare(
    payload.password.trim() as string,
    user?.password?.trim() as string
  );

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid password");
  }
  const accessToken = jwtHelpers.generateToken(
    user,
    config.jwt.jwt_secret as string,
    config.jwt.expires_in
  );
  const { password, createdAt, updatedAt, ...userInfo } = user;

  return {
    accessToken,
  };
};

const getAllUser = async (
  page: number = 1,
  limit: number = 10,
  searchQuery: string = ""
) => {
  const additionalFilter: Prisma.UserWhereInput = {
    NOT: {
      role: "ADMIN",
    },
  };
  const user = await searchAndPaginate<
    typeof prisma.user,
    Prisma.UserWhereInput,
    Prisma.UserSelect
  >(
    prisma.user,
    ["fullName", "email"],
    page,
    limit,
    searchQuery,
    additionalFilter,
    {
      select: {
        fullName: true,
        id: true,
        email: true,

        status: true,
        Profile: true,
      },
    }
  );

  return user;
};























export const adminService = {
  loginAdmin,
  getAllUser,
  
};
