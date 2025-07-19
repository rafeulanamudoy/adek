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
// import { injectFileIntoBody } from "../../middlewares/injectFile";

const router = express.Router();

router.post(
  "/create",

  validateRequest(userValidation.userRegisterValidationSchema),
  userController.createUser
);

export const userRoute = router;
