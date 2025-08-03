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
  const fileFields = ["coverPhoto", "profileImage"];
  const uploadedUrls: { [key: string]: string } = {};
  const files = req.files as {
    [fieldname: string]: Express.Multer.File[];
  };

  try {
    for (const field of fileFields) {
      const file = files?.[field]?.[0];
      if (file) {
        
        const uploadedUrl = await uploadToDigitalOcean(file);
        uploadedUrls[field] = uploadedUrl;
        req.body[field] = uploadedUrl;
      }
    }

    const result = await userService.updateProfile(req.body, req.user.id);

    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: " profile updated successfully",
      data: result,
    });
  } catch (error) {
    await Promise.all(
      Object.values(uploadedUrls).map((url) =>
        deleteFromDigitalOcean(url).catch((err) =>
          console.error(
            ` Failed to delete file from DigitalOcean: ${url}`,
            err
          )
        )
      )
    );
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




const getOtherUserProfile=catchAsync(async (req: Request, res: Response) => {
  
  const result = await userService.getOtherUserProfile(req.params.id);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "user profile get successfully",
    data: result,
  });
});

export const userController = {
  createUser,
  updateProfile,
  getUserProfile,
 
  getOtherUserProfile
};
