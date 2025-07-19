// import { Worker, Queue } from "bullmq";
// import Redis, { RedisOptions } from "ioredis";
// import { sendMessage } from "./sendaMessage";
// import sendEmail from "./sendEmailNodemailer";
// import { otpVerifyHtmlFormat } from "../utlits/html";
// import { chatService } from "../app/modules/chat/chat.service";
// import { activeUsers } from "../socket";
// import { MessageTypes } from "../utlits/socket.helpers";
// import { emailTemplate } from "./emailTemplate";

// import prisma from "../shared/prisma";


// // Redis Configuration
// const redisOptions: RedisOptions = {
//   host: process.env.REDIS_HOST || "127.0.0.1",
//   port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : 6379,
//   retryStrategy: (times: number) => {
//     if (times > 5) return undefined;
//     return Math.min(times * 100, 3000);
//   },
//   connectTimeout: 10000,
//   keepAlive: 30000,
//   maxRetriesPerRequest: null,
// };

// const redis = new Redis(redisOptions);

// redis.on("connect", () => console.log("✅ Redis connected successfully"));
// redis.on("error", (err: any) => console.error("❌ Redis error:", err));

// const otpQueuePhone = new Queue("otp-queue-phone", { connection: redis });
// const otpQueueEmail = new Queue("otp-queue-email", { connection: redis });

// const conversationListQueue = new Queue("conversationList", {
//   connection: redis,
// });
// const assignJobQueue = new Queue("assign-job-queue", { connection: redis });


// const otpPhoneWorker = new Worker(
//   "otp-queue-phone",
//   async (job) => {
//     const { phoneNumber, otpCode } = job.data;
//     const message = `Hi! your otp code is ${otpCode}. It’s valid for 5 minutes. Keep it safe and private!`;
//     await sendMessage(phoneNumber, message);
//     return "Otp end job completed";
//   },
//   { connection: redis }
// );

// const otpEmailWorker = new Worker(
//   "otp-queue-email",
//   async (job) => {
//     const { email, otpCode } = job.data;

//     await emailTemplate.forgetPasswordOtpTemplate(email, otpCode);

//     return "Otp end job completed";
//   },
//   { connection: redis }
// );

// const conversationListWorker = new Worker(
//   "conversationList",
//   async (job) => {
//     const { user1Id, user2Id } = job.data;
//     const [senderResult, receiverResult] = await Promise.all([
//       chatService.getConversationListIntoDB(user1Id, 1, 10),
//       chatService.getConversationListIntoDB(user2Id, 1, 10),
//     ]);

//     const senderSocket = activeUsers.get(user1Id);
//     if (senderSocket) {
//       senderSocket.send(
//         JSON.stringify({
//           type: MessageTypes.CONVERSATION_LIST,
//           senderResult,
//         })
//       );
//     }
//     const receiverSocket = activeUsers.get(user2Id);
//     if (receiverSocket) {
//       receiverSocket.send(
//         JSON.stringify({
//           type: MessageTypes.CONVERSATION_LIST,
//           receiverResult,
//         })
//       );
//     }

//     return "Conversation list";
//   },
//   { connection: redis }
// );

// otpPhoneWorker.on("completed", (job) => {
//   console.log(`✅ OTP job completed: ${job.id}`);
// });

// otpEmailWorker.on("failed", (job, err) => {
//   console.log(`❌ OTP job failed: ${job?.id}`, err);
// });

// otpEmailWorker.on("completed", (job) => {
//   console.log(`✅ OTP job completed: ${job.id}`);
// });

// otpPhoneWorker.on("failed", (job, err) => {
//   console.log(`❌ OTP job failed: ${job?.id}`, err);
// });

// conversationListWorker.on("completed", (job) => {
//   console.log(`✅ ConversationList job completed: ${job.id}`);
// });

// conversationListWorker.on("failed", (job, err) => {
//   console.error(`❌ ConversationList job failed: ${job?.id}`, err);
// });

// export async function cleanQueues() {
//   await Promise.all([
//     otpQueueEmail.clean(0, 1000, "completed"),
//     otpQueueEmail.clean(0, 1000, "failed"),
//     otpQueueEmail.clean(0, 1000, "delayed"),
//     otpQueueEmail.clean(0, 1000, "wait"),

//     conversationListQueue.clean(0, 1000, "completed"),
//     conversationListQueue.clean(0, 1000, "failed"),
//     conversationListQueue.clean(0, 1000, "delayed"),
//     conversationListQueue.clean(0, 1000, "wait"),

//     otpQueuePhone.clean(0, 1000, "completed"),
//     otpQueuePhone.clean(0, 1000, "failed"),
//     otpQueuePhone.clean(0, 1000, "delayed"),
//     otpQueuePhone.clean(0, 1000, "wait"),
//     assignJobQueue.clean(0, 1000, "completed"),
//     assignJobQueue.clean(0, 1000, "failed"),
//     assignJobQueue.clean(0, 1000, "delayed"),
//     assignJobQueue.clean(0, 1000, "wait"),
//   ]);
// }
// async function handleJobFailure(job: any, err: any) {
//   console.error(`❌ Job ${job.id} failed:`, err);
//   try {
//     await job.remove();
//   } catch (removeErr) {
//     console.error(`Failed to remove job ${job.id}:`, removeErr);
//   }
// }
// otpPhoneWorker.on("failed", handleJobFailure);

// otpEmailWorker.on("failed", handleJobFailure);

// conversationListWorker.on("failed", handleJobFailure);

// // Run cleanup at startup
// cleanQueues().catch((err) => console.error("❌ Error cleaning queues:", err));
// // Graceful shutdown
// process.on("SIGINT", async () => {
//   console.log("🚨 Gracefully shutting down...");
//   await otpQueuePhone.close();
//   await otpPhoneWorker.close();
//   await otpEmailWorker.close();
//   await conversationListQueue.close();
//   await conversationListWorker.close();

//   console.log("✅ Workers and Queues closed gracefully");
//   process.exit(0);
// });
// export {
//   redis,
//   otpQueuePhone,
//   otpQueueEmail,
//   otpPhoneWorker,
//   otpEmailWorker,
//   conversationListQueue,
//   assignJobQueue,
// };
