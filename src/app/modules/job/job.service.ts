import { JobPost } from "@prisma/client";
import searchAndPaginate from "../../../helpers/searchAndPaginate";
import prisma from "../../../shared/prisma";

const createJob = async (payload: any, userId: string) => {
  const [startHour, startMinute] = payload.startTime.split(":").map(Number);
  const [endHour, endMinute] = payload.endTime.split(":").map(Number);

  const scheduleEntries = payload.date.map((isoString: string) => {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) throw new Error("Invalid date from payload");

    const startTime = new Date(date);
    startTime.setUTCHours(startHour, startMinute, 0, 0);

    const endTime = new Date(date);
    endTime.setUTCHours(endHour, endMinute, 0, 0);

    return {
      date,
      startTime,
      endTime,
    };
  });

  const result = await prisma.jobPost.create({
    data: {
      about: payload.about,
      experience: payload.experience,
      userId: userId,
      jobRole: payload.jobRole,
      qualification: payload.qualification,
      totalCandidate: payload.totalCandidate,
      minPriceRange: payload.minPriceRange,
      maxPriceRange: payload.maxPriceRange,
      schedule: {
        create: scheduleEntries,
      },
    },
  });

  return result;
};

const getJobpost = async (
  userId: string,
  page: number = 1,
  limit: number = 10
) => {
  let additionalFilter = {};
  const data = await searchAndPaginate<JobPost>(
    prisma.jobPost,
    [],
    page,
    limit,
    "",
    additionalFilter,
    {
      select: {
        id: true,
      },
    }
  );
  return data;
};

const searchJob = async (userId: string, searchTerm: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      role: true,
      providerProfile: {
        select: {
          provider: true,
          providerAvailability: true,
        },
      },
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const { providerProfile } = user;

  let whereClause: any = {};

  //  const cleanedSearchTerm = searchTerm?.trim().replace(/^"|"$/g, '');
  const cleanedSearchTerm = searchTerm?.trim().replace(/^"|"$/g, "");

  if (cleanedSearchTerm && cleanedSearchTerm.length > 0) {
    whereClause = {
      OR: [
        { about: { contains: cleanedSearchTerm, mode: "insensitive" } },
        { qualification: { contains: cleanedSearchTerm, mode: "insensitive" } },
      ],
    };
  } else {
    if (!providerProfile) {
      throw new Error("Provider profile not found");
    }

    if (!providerProfile.provider?.length) {
      throw new Error("Provider role not set");
    }

    const availability = providerProfile.providerAvailability;

    if (!availability?.length) {
      return [];
    }

    const availabilityConditions = availability.map((slot) => ({
      schedule: {
        some: {
          AND: [
            { date: slot.date },
            { startTime: { gte: slot.startTime } },
            { endTime: { lte: slot.endTime } },
          ],
        },
      },
    }));

    whereClause = {
      jobRole: { in: providerProfile.provider },
      // OR: availabilityConditions,
    };
  }

  const jobs = await prisma.jobPost.findMany({
    where: whereClause,
    include: {
      schedule: true,
    },
  });

  return jobs;
};

const getAllJobPosts = async () => {
  const jobs = await prisma.jobPost.findMany({
    include: {
      schedule: true,
    },
  });
  return jobs;
};

export const jobService = {
  createJob,
  getJobpost,
  getAllJobPosts,
  searchJob,
};
