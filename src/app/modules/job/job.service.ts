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
      minPriceRange:payload.minPriceRange,
      maxPriceRange:payload.maxPriceRange,
      schedule: {
        create: scheduleEntries,
      },
    },
  });

  return result;
};

const getJobpost = async (  userId: string,
  page: number = 1,
  limit: number = 10,
 ) => {
 let additionalFilter={}
 const  data = await searchAndPaginate<JobPost>(
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

export const jobService = {
  createJob,
  getJobpost,
};
