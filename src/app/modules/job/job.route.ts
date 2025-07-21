import express from "express";

import validateRequest from "../../middlewares/validateRequest";
import { jobController } from "./job.controller";
import { jobValidation } from "./job.validation";
import { UserRole } from "@prisma/client";
import auth from "../../middlewares/auth";

const router = express.Router();

router.post(
  "/create",
  auth(UserRole.FACILITY),
  validateRequest(jobValidation.createJobSchema),
  jobController.createJob
);
router.get("/", auth(UserRole.FACILITY), jobController.getJobpost);
export const jobRoute = router;
