import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";

import sendResponse from "../../../shared/sendResponse";
import { adminService } from "./admin.service";
import Api from "twilio/lib/rest/Api";
import ApiError from "../../../errors/ApiErrors";
import httpStatus from "http-status";
import uploadToDigitalOcean from "../../../helpers/uploadToDigitalOcean";
import { deleteFromDigitalOcean } from "../../../helpers/deleteFromDigitalOccean";

const loginAdmin = catchAsync(async (req: Request, res: Response) => {
  const result = await adminService.loginAdmin(req.body);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "admin successfully logged in",
    data: result,
  });
});
const createArticle = catchAsync(async (req: Request, res: Response) => {
  let uploadedFileUrl: string | null = null;
  try {
    const file = req.file;
    if (!file) {
      throw new ApiError(httpStatus.NOT_FOUND, "article image is required");
    }
    uploadedFileUrl = await uploadToDigitalOcean(file);
    req.body.articleImage = uploadedFileUrl;
    const result = await adminService.createArticle(req.body);

    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "article  create successfully",
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
});
const getAllArticle = catchAsync(async (req: Request, res: Response) => {
  const result = await adminService.getAllArticle();

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "all Article get Successfully",
    data: result,
  });
});
const updateSingleArticle = catchAsync(async (req: Request, res: Response) => {
  let uploadedFileUrl: string | null = null;
  try {
    const file = req.file;
    console.log(req.file, "check file");
    if (file) {
      console.log("file logic");
      uploadedFileUrl = await uploadToDigitalOcean(file);
      req.body.articleImage = uploadedFileUrl;
    }
    const result = await adminService.updateSingleArticle(
      req.params.id,
      req.body
    );
    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "article  updated  successfully",
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
});

const deleteSingleArticle = catchAsync(async (req: Request, res: Response) => {
  const result = await adminService.deleteSingleArticle(req.params.id);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: " Article delete  Successfully",
    data: result,
  });
});

const createGroundingSound = catchAsync(async (req: Request, res: Response) => {
  const files = req.files as {
    [fieldname: string]: Express.Multer.File[];
  };

  const fileFields = ["soundAudioFile", "soundImage"];
  const uploadedUrls: { [key: string]: string } = {};

  try {
    for (const field of fileFields) {
      const file = files?.[field]?.[0];
      if (!file) {
        throw new Error(`${field} file is required`);
      }

      const uploadedUrl = await uploadToDigitalOcean(file);
      uploadedUrls[field] = uploadedUrl;
      req.body[field] = uploadedUrl;
    }

    const result = await adminService.createGroundingSound(req.body);

    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "ground sound create successfully",
      data: result,
    });
  } catch (error) {
    await Promise.all(
      Object.values(uploadedUrls).map((url) =>
        deleteFromDigitalOcean(url).catch((err) =>
          console.error(
            `❌ Failed to delete file from DigitalOcean: ${url}`,
            err
          )
        )
      )
    );

    throw error;
  }
});
const getAllGroundingSound = catchAsync(async (req: Request, res: Response) => {
  const result = await adminService.getAllGroundingSound();

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "all grounding sound get Successfully",
    data: result,
  });
});
const updateSingleGroundSound = catchAsync(
  async (req: Request, res: Response) => {
    const files = req.files as {
      [fieldname: string]: Express.Multer.File[];
    };

    const fileFields = ["soundAudioFile", "soundImage"];
    const uploadedUrls: { [key: string]: string } = {};

    try {
      for (const field of fileFields) {
        const file = files?.[field]?.[0];
        if (file) {
          const uploadedUrl = await uploadToDigitalOcean(file);
          uploadedUrls[field] = uploadedUrl;
          req.body[field] = uploadedUrl;
        }
      }

      const result = await adminService.updateSingleGroundSound(req.params.id,req.body);

      sendResponse(res, {
        statusCode: 201,
        success: true,
        message: "ground sound upodate successfully",
        data: result,
      });
    } catch (error) {
      await Promise.all(
        Object.values(uploadedUrls).map((url) =>
          deleteFromDigitalOcean(url).catch((err) =>
            console.error(
              `❌ Failed to delete file from DigitalOcean: ${url}`,
              err
            )
          )
        )
      );

      throw error;
    }
  }
);

const deleteSingleGroundSound = catchAsync(
  async (req: Request, res: Response) => {
    const result = await adminService.deleteSingleGroundSound(req.params.id);

    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: " Article delete  Successfully",
      data: result,
    });
  }
);

const createGoal = catchAsync(async (req: Request, res: Response) => {
  let uploadedFileUrl: string | null = null;
  try {
    const file = req.file;
    if (!file) {
      throw new ApiError(httpStatus.NOT_FOUND, "goal image is required");
    }
    uploadedFileUrl = await uploadToDigitalOcean(file);
    console.log(uploadedFileUrl,"check url")
    req.body.goalImage = uploadedFileUrl;
    const result = await adminService.createGoal(req.body);

    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "goal  create successfully",
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
});

const getAllGoal = catchAsync(async (req: Request, res: Response) => {
  const result = await adminService.getAllGoal();

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "all goal get Successfully",
    data: result,
  });
});
const updateSingGoal = catchAsync(async (req: Request, res: Response) => {
  let uploadedFileUrl: string | null = null;
  try {
    const file = req.file;
   
    if (file) {
      console.log("file logic");
      uploadedFileUrl = await uploadToDigitalOcean(file);
      req.body.articleImage = uploadedFileUrl;
    }
    const result = await adminService.updateSingGoal(
      req.params.id,
      req.body
    );
    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "goal  updated  successfully",
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
});

const deleteSingleGoal = catchAsync(async (req: Request, res: Response) => {
  const result = await adminService.deleteSingleGoal(req.params.id);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: " goal delete  Successfully",
    data: result,
  });
});
export const adminController = {
  loginAdmin,
  createArticle,
  getAllArticle,
  updateSingleArticle,
  deleteSingleArticle,
  createGroundingSound,
  getAllGroundingSound,
  updateSingleGroundSound,
  deleteSingleGroundSound,
  getAllGoal,
  updateSingGoal,
  deleteSingleGoal,
  createGoal
};
