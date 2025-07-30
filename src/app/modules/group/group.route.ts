import { Router } from "express";
import { groupController } from "./group.controller";
import auth from "../../middlewares/auth";
import { fileUploader } from "../../../helpers/fileUploader";
import { parseBodyData } from "../../middlewares/parseBodyData";

const router = Router();

router.post(
  "/create",
  auth(),
  // groupCreateAccess,
  fileUploader.groupImage,
  parseBodyData,
  groupController.createGroup
);

router.patch(
  "/update/:groupId",
  auth(),
  fileUploader.groupImage,
  parseBodyData,
  groupController.updateGroup
);
router.delete("/delete/:groupId", auth(), groupController.deleteGroup);
router.patch("/join-group/:groupId", auth(), groupController.joinGroup);

export const groupRoute = router;
