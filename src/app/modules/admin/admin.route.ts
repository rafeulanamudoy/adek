import express from "express";

import validateRequest from "../../middlewares/validateRequest";

import { adminController } from "./admin.controller";
import { authValidation } from "../auth/auth.validation";
import { UserRole } from "@prisma/client";
import auth from "../../middlewares/auth";
import { fileUploader } from "../../../helpers/fileUploader";
import { parseBodyData } from "../../middlewares/parseBodyData";


const router = express.Router();

router.post(
  "/admin-login",
  validateRequest(authValidation.authLoginSchema),
  adminController.loginAdmin
);

//user route
router.get("/get-all-user", auth(UserRole.ADMIN), adminController.getAllUser);
//article route
router.post(
  "/create-article",
  auth(UserRole.ADMIN),
  fileUploader.articleImage,
  parseBodyData,


  
);

export const adminRoute = router;
