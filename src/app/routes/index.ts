import express from "express";

import { authRoute } from "../modules/auth/auth.routes";
import { chatRoute } from "../modules/chat/chat.routes";

import { userRoute } from "../modules/user/user.routes";
import { adminRoute } from "../modules/admin/admin.route";

import { groupRoute } from "../modules/group/group.route";
import path from "path";
import { notificationRoute } from "../modules/notifications/notification.route";

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
    path: "/admin",
    route: adminRoute,
  },

  {
    path: "/group",
    route: groupRoute,
  },

  {
    path: "/notification",
    route: notificationRoute,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
