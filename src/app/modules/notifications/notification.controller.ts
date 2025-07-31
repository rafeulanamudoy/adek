import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import { notificationServices } from "./notification.service";
import sendResponse from "../../../shared/sendResponse";

const getNotificationsFrom = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id as string;
  const result = await notificationServices.getNotificationsFromDB(userId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Notification retrieved successfully",
    data: result,
  });
});

export const notificationController = {
  getNotificationsFrom,
};
