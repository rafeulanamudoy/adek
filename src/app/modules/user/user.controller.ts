//

import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import { userService } from "./user.service";
import sendResponse from "../../../shared/sendResponse";
import ApiError from "../../../errors/ApiErrors";
import httpStatus from "http-status";
import uploadToDigitalOcean from "../../../helpers/uploadToDigitalOcean";
import { deleteFromDigitalOcean } from "../../../helpers/deleteFromDigitalOccean";
import { ConnectionCheckOutStartedEvent } from "mongodb";

const createUser = catchAsync(async (req: Request, res: Response) => {
  const result = await userService.createUser(req.body);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "A Otp has been send to your gmail",
    data: result,
  });
});
const updateProfile = catchAsync(async (req: Request, res: Response) => {
  let uploadedFileUrl: string | null = null;

  try {
    const file = req.file;

    if (file) {
      uploadedFileUrl = await uploadToDigitalOcean(file);

      req.body.profileImage = uploadedFileUrl;
    }

    const result = await userService.updateProfile(req.body, req.user.id);

    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: " profile updated successfully",
      data: result,
    });
  } catch (error) {
    if (uploadedFileUrl) {
      try {
        await deleteFromDigitalOcean(uploadedFileUrl);
      } catch (deleteErr) {
        console.error("Failed to delete uploaded file:", deleteErr);
      }
    }
    throw error;
  }
});

const getUserProfile = catchAsync(async (req: Request, res: Response) => {
  const result = await userService.getUserProfile(req.user.id);
  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, "User profile not found");
  }

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "User profile retrieved successfully",
    data: result,
  });
});
const getUserPreference = catchAsync(async (req: Request, res: Response) => {
  const result = await userService.getUserPreference(req.user.id, req.query);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "User preference retrieved successfully",
    data: result,
  });
});
const searchUser = catchAsync(async (req: Request, res: Response) => {
  const { page, limit, searchQuery, branch, serviceYear } = req.query;
  const result = await userService.searchUser(
    Number(page),
    Number(limit),
    searchQuery as string,
    { branch, serviceYear } as any
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "User  retrieved successfully",
    data: result,
  });
});

const addJournal = catchAsync(async (req: Request, res: Response) => {
  req.body.userId = req.user.id;
  const result = await userService.addJournal(req.body);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "journal add  successfully",
    data: result,
  });
});
const getUserJournal = catchAsync(async (req: Request, res: Response) => {
  const { month, year } = req.query;

  if (!month || !year) {
    return res.status(400).json({
      success: false,
      message: "Missing 'month' or 'year' in query params",
    });
  }

  const numericMonth = parseInt(month as string); 
  const numericYear = parseInt(year as string);

  const start = new Date(Date.UTC(numericYear, numericMonth - 1, 1));
  const end = new Date(Date.UTC(numericYear, numericMonth, 0, 23, 59, 59, 999));

  const result = await userService.getUserJournal(req.user.id, start, end);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Journal retrieved successfully",
    data: result,
  });
});
export const userController = {
  createUser,
  updateProfile,
  getUserProfile,
  getUserPreference,
  searchUser,
  addJournal,
  getUserJournal
};
