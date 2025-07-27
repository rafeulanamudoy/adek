import prisma from "../../../shared/prisma";
import bcrypt from "bcryptjs";
import ApiError from "../../../errors/ApiErrors";
import { jwtHelpers } from "../../../helpers/jwtHelpers";
import config from "../../../config";

import { Article, Goal, GroundSound, Prisma, User } from "@prisma/client";
import { searchAndPaginate } from "../../../helpers/searchAndPaginate";


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
  const user = await searchAndPaginate<typeof prisma.user,Prisma.UserWhereInput,Prisma.UserSelect>(
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
        Profile:true,
         
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

const getAllArticle = async (page: number = 1, limit: number = 10) => {
  let additionalFilter:Prisma.ArticleWhereInput = {};
  const result = await searchAndPaginate<typeof prisma.article,Prisma.ArticleWhereInput,Prisma.ArticleSelect>(
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
  return result;
};

const updateSingleArticle = async (id: string, data: any) => {
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
const getArticleById = async (id: string) => {
  const result = await prisma.article.findUniqueOrThrow({
    where: {
      id: id,
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
const getAllGroundingSound = async (page: number = 1, limit: number = 10) => {
  const result = await searchAndPaginate<typeof prisma.groundSound,Prisma.GroundSoundWhereInput,Prisma.GroundSoundSelect>(
    prisma.groundSound,
    [],
    page,
    limit,
    "",
    {},
    {
      select: {
        id: true,
        emotionalReason: true,
        cause: true,
        goal: true,
        mood: true,
       soundName:true,
        soundImage: true,
        soundAudioFile: true,
        time: true,
        authority: true,

      },
    }
  );
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
const getSingleGroundSoundById = async (id: string) => {
  const result = await prisma.groundSound.findUnique({
    where: {
      id: id,
    },
  });
  return result;
};
const createGoal = async (payload: any) => {
  console.log(payload, "check payload from service file");
  const result = await prisma.goalModel.create({
    data: {
      ...payload,
    },
  });

  return result;
};
const getAllGoal = async (page: number = 1, limit: number = 10) => {

  const result = await searchAndPaginate<typeof prisma.goalModel,Prisma.GoalModelWhereInput,Prisma.GoalModelSelect>(
    prisma.goalModel,
    [],
    page,
    limit,
    "",
    {},
    {
      select: {
        id: true,
        title: true,
        subtitle: true,
        emotionalReason: true,
        cause: true,
        goal: true,
        mood: true,
        goalImage: true,
      },
    }
  );
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

const geGoalById = async (id: string) => {
  const result = await prisma.goalModel.findUniqueOrThrow({
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
  getAllGoal,
  geGoalById,
  getArticleById,
  getSingleGroundSoundById,
};
