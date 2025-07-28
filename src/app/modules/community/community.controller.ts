import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { communityService } from "./community.service";
import { communityPostFileQueue } from "../../../helpers/redis";


const createPost = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  req.body.userId = userId;

  const files = req.files as {
    [fieldname: string]: Express.Multer.File[];
  };

  const result = await communityService.createPost({
    ...req.body,
  });

  const postId = result.id;

  if (files?.imageUrl || files?.videoUrl) {

    const imageFile = files?.imageUrl?.[0];
    const videoFile = files?.videoUrl?.[0];
  
    communityPostFileQueue.add("upload-community-media", {
      postId,
      image:imageFile,
      video:videoFile,
    });
  }

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Post created successfully",
    data: result,
  });
});
const getAllPost=catchAsync(
  async (req: Request, res: Response) => {
  
    const response = await communityService.getAllPost(req.user.id);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "all post get successfully",
      data: response,
    });
  }
);
export const communityController = {
  createPost,
  getAllPost
};
