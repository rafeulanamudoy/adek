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
  "/update-provider-profile",
  auth(UserRole.PROVIDER),
  fileUploader.providerDocument,
  parseBodyData,
  validateRequest(userValidation.updateProviderProfile),
  userController.updateProviderProfile
);
router.patch(
  "/update-facility-profile",
  auth(UserRole.FACILITY),
  validateRequest(userValidation.updateFacilityProfile),
  userController.updateFaciltyProfile
);

router.get(
  "/get-profile",
  auth(UserRole.PROVIDER, UserRole.FACILITY),
  userController.getUserProfile
);

export const userRoute = router;
