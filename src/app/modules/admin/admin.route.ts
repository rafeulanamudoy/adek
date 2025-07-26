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

router.get(
  "/get-single-article/:id",
  auth(UserRole.ADMIN),
  adminController.getArticleById
);

router.get(
  "/get-single-goal/:id",
  auth(UserRole.ADMIN),
  adminController.getGoalById
);
router.get(
  "/get-single-sound/:id",
  auth(UserRole.ADMIN),
  adminController.getSingleGroundSoundById
);
router.get("/get-all-goal", auth(UserRole.ADMIN), adminController.getAllGoal);
router.get("/get-all-user", auth(UserRole.ADMIN), adminController.getAllUser);
router.get(
  "/get-all-ground",
  auth(UserRole.ADMIN),
  adminController.getAllGroundingSound
);
router.post(
  "/create-goal",
  auth(UserRole.ADMIN),
  fileUploader.goalImage,
  parseBodyData,

  validateRequest(adminValidation.createGoal),
  adminController.createGoal
);
router.patch(
  "/update-single-goal/:id",
  auth(UserRole.ADMIN),
  fileUploader.goalImage,
  parseBodyData,
  adminController.updateSingGoal
);
router.delete(
  "/delete-single-goal/:id",
  auth(UserRole.ADMIN),
  adminController.deleteSingleGoal
);
router.get(
  "/get-sinlge-goal/:id",
  auth(UserRole.ADMIN),
  adminController.getGoalById
);

export const adminRoute = router;
