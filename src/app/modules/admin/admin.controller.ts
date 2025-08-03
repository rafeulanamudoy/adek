import { NextFunction, Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";

import sendResponse from "../../../shared/sendResponse";
import { adminService } from "./admin.service";
import Api from "twilio/lib/rest/Api";
import ApiError from "../../../errors/ApiErrors";
import httpStatus from "http-status";
import uploadToDigitalOcean from "../../../helpers/uploadToDigitalOcean";
import { deleteFromDigitalOcean } from "../../../helpers/deleteFromDigitalOccean";
import { ConnectionCheckOutStartedEvent } from "mongodb";

const loginAdmin = catchAsync(async (req: Request, res: Response) => {
  const result = await adminService.loginAdmin(req.body);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "admin successfully logged in",
    data: result,
  });
});
const getAllUser = catchAsync(async (req: Request, res: Response) => {
  const { page, limit } = req.query;
  const result = await adminService.getAllUser(
    Number(page) || 1,
    Number(limit) || 10
  );

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "all user get successfully",
    data: result,
  });
});


export const adminController = {
  loginAdmin,
  
  getAllUser,
 
}