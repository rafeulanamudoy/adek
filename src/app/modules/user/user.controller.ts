//

import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import { userService } from "./user.service";
import sendResponse from "../../../shared/sendResponse";
import ApiError from "../../../errors/ApiErrors";
import httpStatus from "http-status";
import uploadToDigitalOcean from "../../../helpers/uploadToDigitalOcean";
import { deleteFromDigitalOcean } from "../../../helpers/deleteFromDigitalOccean";

const createUser = catchAsync(async (req: Request, res: Response) => {
  const result = await userService.createUser(req.body);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "A Otp has been send to your gmail",
    data: result,
  });
});
const updateProviderProfile = catchAsync(
  async (req: Request, res: Response) => {
    let uploadedFileUrl: string | null = null;

    try {
      const file = req.file;
      if (!file) {
        throw new ApiError(httpStatus.NOT_FOUND, "File not found");
      }

      uploadedFileUrl = await uploadToDigitalOcean(file);

      req.body.document = uploadedFileUrl;

      const result = await userService.updateProfile(
        req.body,
        req.user.id
      );

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
    }
  }
);


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

export const userController = {
  createUser,
  updateProviderProfile,
 
  getUserProfile,
};
