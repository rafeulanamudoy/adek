import express, { Application, NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import cors from "cors";
import router from "./app/routes";
import GlobalErrorHandler from "./app/middlewares/globalErrorHandler";
import { PrismaClient } from "@prisma/client";
import path from "path";
import handleWebHook from "./helpers/stripe.webhook";

import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ExpressAdapter } from "@bull-board/express";
import { createBullBoard } from "@bull-board/api";
import { communityPostFileQueue, otpQueueEmail } from "./helpers/redis";
// import {
//   assignJobQueue,
//   conversationListQueue,
//   otpQueueEmail,
//   otpQueuePhone,
// } from "./helpers/redis";

const app: Application = express();
const prisma = new PrismaClient();
const corsOptions = {
  origin: [
    "https://sericiosmans-dashboard.vercel.app",
    "http://localhost:3000",
    "http://admin.serviciosremans.com",
    "https://kamodoc-frontend.vercel.app",
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

// Middleware setup
prisma
  .$connect()
  .then(() => {
    console.log("✅ Database connected successfully!");
  })
  .catch((error) => {
    console.error("Failed to connect to the database:", error);
  });
app.use(
  "/api/v1/stripe/payment-webhook",
  express.raw({ type: "application/json" }),
  handleWebHook
);

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const uploadDir = path.join(process.cwd(), "uploads");

// Route handler for root endpoint
app.get("/", (req: Request, res: Response) => {
  res.send({
    Message: "Welcome to api main route",
  });
});

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../src/views"));

app.get("/payment", (req: Request, res: Response) => {
  res.render("stripe");
});

// Router setup
app.use("/api/v1", router);

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath("/admin/queues");
createBullBoard({
  queues: [
    new BullMQAdapter(otpQueueEmail),
    new BullMQAdapter(communityPostFileQueue),
  ],
  serverAdapter,
});

// Mount the dashboard
app.use("/admin/queues", serverAdapter.getRouter());

// Global Error Handler
app.use(GlobalErrorHandler);

// API Not found handler
app.use((req: Request, res: Response, next: NextFunction) => {
  res.status(httpStatus.NOT_FOUND).json({
    success: false,
    message: "API NOT FOUND!",
    error: {
      path: req.originalUrl,
      message: "Your requested path is not found!",
    },
  });
});

export default app;
