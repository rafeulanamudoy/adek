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

export const jobController = {
  createJob,
  getJobpost,
};
