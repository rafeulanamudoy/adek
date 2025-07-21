import express from "express";

import { authRoute } from "../modules/auth/auth.routes";
import { chatRoute } from "../modules/chat/chat.routes";

import { userRoute } from "../modules/user/user.routes";
import { jobRoute } from "../modules/job/job.route";

const router = express.Router();

const moduleRoutes = [
  {
    path: "/auth",
    route: authRoute,
  },
  {
    path: "/user",
    route: userRoute,
  },
  {
    path: "/chat",
    route: chatRoute,
  },
  {
    path: "/job",
    route: jobRoute,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
