import express from "express";

import { userController } from "./user.controller";
import { userValidation } from "./user.validation";
import validateRequest from "../../middlewares/validateRequest";

import { parseBodyData } from "../../middlewares/parseBodyData";

import auth from "../../middlewares/auth";


import { fileUploader } from "../../../helpers/fileUploader";



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

router.get(
  "/get-other-user-profile/:id",
  auth(),
  userController.getOtherUserProfile
);

export const userRoute = router;
