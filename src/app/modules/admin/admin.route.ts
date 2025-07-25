import express from "express";

import validateRequest from "../../middlewares/validateRequest";

import { adminController } from "./admin.controller";
import { authValidation } from "../auth/auth.validation";
import { UserRole } from "@prisma/client";
import auth from "../../middlewares/auth";
import { fileUploader } from "../../../helpers/fileUploader";
import { parseBodyData } from "../../middlewares/parseBodyData";
import { adminValidation } from "./admin.validation";

const router = express.Router();

router.post(
  "/admin-login",
  validateRequest(authValidation.authLoginSchema),
  adminController.loginAdmin
);
router.post(
  "/create-article",
  auth(UserRole.ADMIN),
  fileUploader.articleImage,
  parseBodyData,

  validateRequest(adminValidation.createArticle),
  adminController.createArticle
);
router.get(
  "/get-all-article",
  auth(UserRole.ADMIN),
  adminController.getAllArticle
);
router.patch(
  "/update-single-article/:id",

  auth(UserRole.ADMIN),
  fileUploader.articleImage,
  parseBodyData,
  adminController.updateSingleArticle
);
router.delete(
  "/delete-single-article/:id",
  adminController.deleteSingleArticle
);
router.post(
  "/create-ground-sound",
  auth(UserRole.ADMIN),
  fileUploader.uploadGroundSound,
  parseBodyData,

  validateRequest(adminValidation.createGroundingSound),
  adminController.createGroundingSound
);
router.patch(
  "/update-single-ground-sound/:id",
  auth(UserRole.ADMIN),
  fileUploader.uploadGroundSound,
  parseBodyData,
  adminController.updateSingleGroundSound
);

router.delete(
  "/delete-single-ground/:id",
  auth(UserRole.ADMIN),
  adminController.deleteSingleGroundSound
);
router.post(
  "/create-goal",
  auth(UserRole.ADMIN),
  fileUploader.goalImage,
  parseBodyData,

  validateRequest(adminValidation.createGoal),
  adminController.createGoal
);
export const adminRoute = router;
