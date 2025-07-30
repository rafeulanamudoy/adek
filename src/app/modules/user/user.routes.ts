import express from "express";

import { userController } from "./user.controller";
import { userValidation } from "./user.validation";
import validateRequest from "../../middlewares/validateRequest";
import { localFileUploader } from "../../../helpers/localFileUploader";
import { parseBodyData } from "../../middlewares/parseBodyData";
import { injectFileIntoBody } from "../../middlewares/injectFile";
import auth from "../../middlewares/auth";
import religiousDetialsVerify from "../../middlewares/religiousDetialsVerify";
import partnerPreference from "../../middlewares/partnerPreference";
import { fileUploader } from "../../../helpers/fileUploader";
import { UserRole } from "@prisma/client";
// import { injectFileIntoBody } from "../../middlewares/injectFile";

const router = express.Router();

router.post(
  "/create",

  validateRequest(userValidation.userRegisterValidationSchema),
  userController.createUser
);
router.patch(
  "/update-profile",
  auth(),

  fileUploader.userImage,
  parseBodyData,

  userController.updateProfile
);

router.get("/get-profile", auth(), userController.getUserProfile);
router.get("/get-user-preference", auth(), userController.getUserPreference);
router.get("/search-all", auth(), userController.searchAll);
router.post("/add-journal", auth(), userController.addJournal);
router.get("/get-user-journal", auth(), userController.getUserJournal);
router.patch(
  "/update-track-goal/:goalId",
  auth(),
  userController.updateTrackGoal
);
router.get(
  "/get-other-user-profile/:id",
  auth(),
  userController.getOtherUserProfile
);

export const userRoute = router;
