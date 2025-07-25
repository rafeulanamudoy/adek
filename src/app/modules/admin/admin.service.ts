import prisma from "../../../shared/prisma";
import bcrypt from "bcryptjs";
import ApiError from "../../../errors/ApiErrors";
import { jwtHelpers } from "../../../helpers/jwtHelpers";
import config from "../../../config";
import searchAndPaginate from "../../../helpers/searchAndPaginate";
import { Article, User } from "@prisma/client";

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
  const additionalFilter: any = {
    NOT: {
      role: "ADMIN",
    },
  };
  const user = await searchAndPaginate<User>(
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
      },
    }
  );

  return user;
};

const createArticle = async (payload: any) => {
  const result = await prisma.article.create({
    data: {
      ...payload,
    },
  });

  return result;
};

const getAllArticle = async () => {
  const result = await prisma.article.findMany({});
  return result;
};

const updateSingleArticle = async (id: string, data: any) => {
  console.log(data, "check data");

  const result = await prisma.article.update({
    where: {
      id: id,
    },
    data: {
      ...data,
    },
  });
  return result;
};

const deleteSingleArticle = async (id: string) => {
  const result = await prisma.article.delete({
    where: {
      id: id,
    },
  });
  return result;
};
const createGroundingSound = async (payload: any) => {
  const result = await prisma.groundSound.create({
    data: {
      ...payload,
    },
  });  

  return result;
};
const getAllGroundingSound = async () => {
  const result = await prisma.groundSound.findMany({});
  return result;
};
const updateSingleGroundSound = async (id: string, data: any) => {


  const result = await prisma.groundSound.update({
    where: {
      id: id,
    },
    data: {
      ...data,
    },
  });
  return result;
};

const deleteSingleGroundSound = async (id: string) => {
  const result = await prisma.groundSound.delete({
    where: {
      id: id,
    },
  });
  return result;
};

const createGoal = async (payload: any) => {
  console.log(payload,"check payload from service file")
  const result = await prisma.goalModel.create({
    data: {
      ...payload,
    },
  });  

  return result;
};
const getAllGoal = async () => {
  const result = await prisma.goalModel.findMany({});
  return result;
};
const updateSingGoal = async (id: string, data: any) => {


  const result = await prisma.goalModel.update({
    where: {
      id: id,
    },
    data: {
      ...data,
    },
  });
  return result;
};

const deleteSingleGoal = async (id: string) => {
  const result = await prisma.goalModel.delete({
    where: {
      id: id,
    },
  });
  return result;
};


export const adminService = {
  loginAdmin,
  getAllUser,
  createArticle,
  getAllArticle,
  updateSingleArticle,
  deleteSingleArticle,
  createGroundingSound,
  updateSingleGroundSound,
  deleteSingleGroundSound,
getAllGroundingSound,
deleteSingleGoal,
createGoal,
 updateSingGoal,
 getAllGoal
};
