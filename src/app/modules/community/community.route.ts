import express from "express";
import { communityController } from "./community.controller";
import auth from "../../middlewares/auth";
import { fileUploader } from "../../../helpers/fileUploader";
import { parseBodyData } from "../../middlewares/parseBodyData";

const router = express.Router();

router.post(
  "/create-post",
  auth(),
  fileUploader.communityPostDoc,
  parseBodyData,
  communityController.createPost
);

router.get("/get-all-post",auth(),communityController.getAllPost)

export const communityRoute = router;
