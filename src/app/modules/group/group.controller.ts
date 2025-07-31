import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import { Group } from "@prisma/client";
import { groupService } from "./group.service";
import sendResponse from "../../../shared/sendResponse";

const createGroup = catchAsync(async (req: Request, res: Response) => {
  const file = req.file as Express.Multer.File;
  const userId = req.user.id as string;
  const payload = req.body as Group;
  const result = await groupService.createGroupIntoDB(payload, userId, file);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Group created successfully",
    data: result,
  });
});

const deleteGroup = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id as string;
  const groupId = req.params.groupId;
  const result = await groupService.deleteGroupFromDB(groupId, userId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Group deleted successfully",
    data: result,
  });
});

const updateGroup = catchAsync(async (req: Request, res: Response) => {
  const file = req.file as Express.Multer.File;
  const userId = req.user.id as string;
  const groupId = req.params.id as string;
  const payload = req.body as Group;
  const result = await groupService.updateGroupInDB(
    groupId,
    userId,
    file,
    payload
  );

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Group created successfully",
    data: result,
  });
});
const joinGroup=catchAsync(async (req: Request, res: Response) => {
  

  const userId = req.user.id as string;
  const groupId = req.params.groupId as string;

  
  
  const result = await groupService.joinGroup(
    
    userId,
    groupId
    
  );

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Group joined successfully",
    data: result,
  });
});

const getUserGroup=catchAsync(async (req: Request, res: Response) => {
  


  
  
  const result = await groupService.getUserGroup(
    
    req.user.id,
  
    
  );

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Group retrived successfully",
    data: result,
  });
});
export const groupController = {
  createGroup,
  deleteGroup,
  updateGroup,
  joinGroup,
  getUserGroup
};
