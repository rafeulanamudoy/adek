import { Article, Branch, Prisma, ServiceYear, User } from "@prisma/client";
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

const getUserPreference = async (
  userId: string,
  queryParams: {
    articlePage?: number;
    goalPage?: number;
    soundPage?: number;
    articleLimit?: number;
    goalLimit?: number;
    soundLimit?: number;
    mood?: string;
    userPage?: number;
    userLimit?: number;

    includeArticle?: boolean;
    includeGoal?: boolean;
    includeGroundSound?: boolean;
    includeUser?: boolean;
  }
) => {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    include: { Profile: true },
  });

  const {
    articlePage = 1,
    goalPage = 1,
    soundPage = 1,
    articleLimit = 5,
    goalLimit = 3,
    soundLimit = 5,
    userPage = 1,
    userLimit = 7,
    mood,
    includeArticle = true,
    includeGoal = true,
    includeGroundSound = true,
    includeUser = true,
  } = {
    ...queryParams,
    articleLimit: Number(queryParams.articleLimit ?? 5),
    goalLimit: Number(queryParams.goalLimit ?? 5),
    soundLimit: Number(queryParams.soundLimit ?? 5),
    articlePage: Number(queryParams.articlePage ?? 1),
    goalPage: Number(queryParams.goalPage ?? 1),
    soundPage: Number(queryParams.userPage ?? 1),
    userPage: Number(queryParams.soundPage ?? 1),
    userLimit: Number(queryParams.userLimit ?? 5),
    includeUser: JSON.parse(
      (queryParams.includeUser as unknown as string) ?? true
    ),
    includeArticle: JSON.parse(
      (queryParams.includeArticle as unknown as string) ?? true
    ),
    includeGoal: JSON.parse(
      (queryParams.includeGoal as unknown as string) ?? true
    ),
    includeGroundSound: JSON.parse(
      (queryParams.includeGroundSound as unknown as string) ?? true
    ),
  };

  const moodFilter: any = {
    mood: {
      has: mood || user.Profile?.mood,
    },
  };

  const userFilter: any = {
    Profile: {
      OR: [
        mood
          ? { mood: { has: mood } }
          : user.Profile?.mood
          ? { mood: { has: user.Profile.mood[0] } }
          : undefined,
        user.Profile?.branch ? { branch: user.Profile.branch } : undefined,
      ].filter(Boolean),
    },
    id: {
      not: userId,
    },
  };
  const promises: Promise<any>[] = [];
  const keys: string[] = [];

  if (includeArticle) {
    promises.push(
      searchAndPaginate<
        typeof prisma.article,
        Prisma.ArticleWhereInput,
        Prisma.ArticleSelect
      >(prisma.article, [], articlePage, articleLimit, "", moodFilter, {
        select: {
          id: true,
          emotionalReason: true,
          cause: true,
          goal: true,
          mood: true,
          articleImage: true,
          content: true,
          time: true,
          title: true,
        },
      })
    );
    keys.push("article");
  }
  if (includeUser) {
    promises.push(
      searchAndPaginate<
        typeof prisma.user,
        Prisma.UserWhereInput,
        Prisma.UserSelect
      >(prisma.user, [], userPage, userLimit, "", userFilter, {
        select: {
          id: true,
          profileImage: true,
          fullName: true,
          Profile: {
            select: {
              branch: true,
            },
          },
        },
      })
    );
    keys.push("users");
  }
  if (includeGoal) {
    promises.push(
      searchAndPaginate<
        typeof prisma.goalModel,
        Prisma.GoalModelWhereInput,
        Prisma.GoalModelSelect
      >(prisma.goalModel, [], goalPage, goalLimit, "", moodFilter, {
        select: {
          id: true,

          emotionalReason: true,
          cause: true,
          goal: true,
          mood: true,
          title: true,
          subtitle: true,
          goalImage: true,
          // TrackGoal: {
          //   where: {
          //     userId: userId,
          //   },
          // },

          _count: {
            select: {
              TrackGoal: {
                where: {
                  userId: userId,
                },
              },
            },
          },
        },
      })
    );
    keys.push("goal");
  }

  if (includeGroundSound) {
    promises.push(
      searchAndPaginate<
        typeof prisma.groundSound,
        Prisma.GroundSoundWhereInput,
        Prisma.GroundSoundSelect
      >(prisma.groundSound, [], soundPage, soundLimit, "", moodFilter, {
        select: {
          id: true,
          emotionalReason: true,
          cause: true,
          goal: true,
          mood: true,
          soundImage: true,
          soundName: true,
          soundAudioFile: true,
          time: true,
          authority: true,
        },
      })
    );
    keys.push("groundSound");
  }

  const results = await Promise.all(promises);

  const finalResult: Record<string, any> = {};
  keys.forEach((key, index) => {
    finalResult[key] = results[index];
  });

  return finalResult;
};

//  const getUserPreference2 = async (
//   userId: string,
//   queryParams: {
//     articlePage?: number;
//     goalPage?: number;
//     soundPage?: number;
//     limit?: number;
//     mood?: string;
//   }
// ) => {
//   const user = await prisma.user.findUniqueOrThrow({
//     where: { id: userId },
//     include: { Profile: true },
//   });

//   const {
//     articlePage = 1,
//     goalPage = 1,
//     soundPage = 1,
//     limit = 10,
//     mood,
//   } = queryParams;

//   const moodFilter = {
//     mood: {
//       has: mood || user.Profile?.mood,
//     },
//   };

//   const articleResult = await searchAndPaginate(
//     prisma.article,
//     ["title", "content"],
//     articlePage,
//     limit,
//     "",
//     moodFilter,
//     {
//       select: {
//         id: true,
//         articleImage: true,
//         content: true,
//         time: true,
//         title: true,
//         emotionalReason: true,
//         cause: true,
//         goal: true,
//         mood: true,
//       },
//     }
//   );

//   const goalResult = await searchAndPaginate(
//     prisma.goalModel,
//     ["title", "subtitle"],
//     goalPage,
//     limit,
//     "",
//     moodFilter,
//     {
//       select: {
//         id: true,
//         title: true,
//         subtitle: true,
//         mood: true,
//         cause: true,
//         emotionalReason: true,
//       },
//     }
//   );

//   const groundSoundResult = await searchAndPaginate(
//     prisma.groundSound,
//     ["title"],
//     soundPage,
//     limit,
//     "",
//     moodFilter,
//     {
//       select: {
//         id: true,
//         title: true,
//         audio: true,
//         mood: true,
//       },
//     }
//   );

//   return {
//     article: articleResult,
//     goal: goalResult,
//     groundSound: groundSoundResult,
//   };
// };

const searchAll = async (
  page: number = 1,
  limit: number = 10,
  searchQuery: string = "",
  filter: { branch?: string; serviceYear?: string } = {}
) => {
  const profileFilter: Prisma.ProfileWhereInput = {};

  if (filter.branch) {
    profileFilter.branch = filter.branch as Branch;
  }

  if (filter.serviceYear) {
    profileFilter.serviceYear = filter.serviceYear as ServiceYear;
  }

  const additionalFilter: Prisma.UserWhereInput = {
    NOT: {
      role: "ADMIN",
    },
    Profile: Object.keys(profileFilter).length ? profileFilter : undefined,
  };

  const users = searchAndPaginate<
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
        profileImage: true,
        fullName: true,
        Profile: {
          select: {
            branch: true,
          },
        },
      },
    }
  );

  const group = prisma.group.findMany({
    select: {
      name: true,
      groupImage: true,
      _count: {
        select: {
          members: true,
        },
      },
    },
  });

  const [userData, groupData] = await Promise.all([users, group]);

  return { users: userData, group: groupData };
};
const searchUser = async (
  page: number = 1,
  limit: number = 10,
  searchQuery: string = "",
  filter: { branch?: string; serviceYear?: string } = {}
) => {
  const profileFilter: Prisma.ProfileWhereInput = {};

  if (filter.branch) {
    profileFilter.branch = filter.branch as Branch;
  }

  if (filter.serviceYear) {
    profileFilter.serviceYear = filter.serviceYear as ServiceYear;
  }

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
const addJournal = async (payload: {
  userId: string;
  content: string;
  entryDate: Date;
}) => {
  const result = await prisma.journal.create({
    data: {
      userId: payload.userId,
      content: payload.content,
      entryDate: new Date(payload.entryDate),
    },
  });
  return result;
};

const getUserJournal = async (userId: string, start: Date, end: Date) => {
  const journalCollection = await getMongoCollection("journals");

  const pipeline = [
    {
      $match: {
        userId: new ObjectId(userId),
        entryDate: { $gte: start, $lte: end },
      },
    },
    {
      $group: {
        _id: "$entryDate",
        entries: {
          $push: {
            id: "$_id",
            content: "$content",
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        entryDate: "$_id",
        entries: 1,
      },
    },
    {
      $sort: { entryDate: 1 },
    },
  ];

  return await journalCollection.aggregate(pipeline).toArray();
};

const updateTrackGoal = async (payload: any) => {
  const result = await prisma.trackGoal.upsert({
    where: {
      userId_goalId: {
        userId: payload.userId,
        goalId: payload.goalId,
      },
    },
    update: {
      isCompleted: true,
      completedAt: new Date(),
    },
    create: {
      userId: payload.userId,
      goalId: payload.goalId,
      isCompleted: true,
      completedAt: new Date(),
    },
  });

  return result;
};

const getOtherUserProfile = async (userId: string) => {
  const result = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      fullName: true,
      
      Profile: {
        select: {
          branch: true,
          desc:true
        },
      },
      profileImage: true,
      coverPhoto: true,
      CommunityPost: {
        select: {
          id: true,
          content: true,
          likes: {
            select: {
              id: true,
              user: {
                select: {
                  fullName: true,
                  profileImage: true,
                },
              },
            },
          },
          imageUrl: true,
          videoUrl: true,
          createdAt: true,
          user: {
            select: {
              fullName: true,
              profileImage: true,
            },
          },

          comments: {
            where: {
              parentCommentId: null,
            },
            select: {
              id: true,
              content: true,
              createdAt: true,
              user: {
                select: {
                  id: true,
                  fullName: true,
                  profileImage: true,
                },
              },

              replies: {
                select: {
                  id: true,
                  content: true,
                  createdAt: true,
                  user: {
                    select: {
                      id: true,
                      fullName: true,
                      profileImage: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
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
  getUserPreference,
  searchAll,
  addJournal,
  getUserJournal,
  updateTrackGoal,
  searchUser,
  getOtherUserProfile,
};
