import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";

import sendResponse from "../../../shared/sendResponse";
import { jobService } from "./job.service";

const createJob = catchAsync(async (req: Request, res: Response) => {
  const response = await jobService.createJob(req.body, req.user.id);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "job post create successfully",
    data: response,
  });
});

const getJobpost = catchAsync(async (req: Request, res: Response) => {
  const { status, page, limit } = req.query;
  const response = await jobService.getJobpost(
    req.user.id,
    Number(page),
    Number(limit)
  );

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "job post get successfully",
    data: response,
  });
});

const searchJob = catchAsync(async (req: Request, res: Response) => {
  const { searchTerm } = req.query;
  const response = await jobService.searchJob(
    req.user.id,
    searchTerm as string
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "job search results",
    data: response,
  });
});

const getAllJobPosts = catchAsync(async (req: Request, res: Response) => {
  const response = await jobService.getAllJobPosts();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "All job posts retrieved successfully",
    data: response,
  });
});

const getJobById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user.id;
  const response = await jobService.getJobById(id, userId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Job post retrieved successfully",
    data: response,
  });
});

export const jobController = {
  createJob,
  getJobpost,
  searchJob,
  getAllJobPosts,
  getJobById,
};
