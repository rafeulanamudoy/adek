import ApiError from "../../../errors/ApiErrors";
import admin from "../../../helpers/firebaseAdmin";

import prisma from "../../../shared/prisma";

// Send notification to a single user
const sendSingleNotification = async ({ userId, body, title }: any) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return;
  }
  await prisma.notifications.create({
    data: {
      receiverId: user.id,
      title: title,
      body,
    },
  });
  if (!user?.fcmToken) {
    return;
  }

  const message = {
    notification: {
      body: body,
      title: title,
    },
    token: user.fcmToken,
  };

  try {
    const response = await admin.messaging().send(message);

    return response;
  } catch (error: any) {
    if (error.code === "messaging/invalid-registration-token") {
      throw new ApiError(400, "Invalid FCM registration token");
    } else if (error.code === "messaging/registration-token-not-registered") {
      throw new ApiError(404, "FCM token is no longer registered");
    } else {
      throw new ApiError(500, "Failed to send notification");
    }
  }
};

const sendMultipulNotifications = async (
  body: string,
  title: string,
  receiverIds?: string[]
) => {
  const users = await prisma.user.findMany({
    where: {
      AND: [
        { fcmToken: { not: null } },
        ...(receiverIds ? [{ id: { in: receiverIds } }] : []),
      ],
    },
    select: {
      id: true,
      fcmToken: true,
    },
  });

  if (users.length === 0) {
    return;
  }

  const fcmTokens = users.map((user) => user.fcmToken);

  const message = {
    notification: {
      body: body,
      title: title,
    },
    tokens: fcmTokens,
  };
  await prisma.notifications.createMany({
    data: users.map((user) => ({
      receiverId: user.id,
      title: title,
      body: body,
    })),
  });
  const response = await admin.messaging().sendEachForMulticast(message as any);

  // Save notifications for all users regardless of success or failure

  // Optionally handle failed tokens if needed
  const failedTokens = response.responses
    .map((res, idx) => (!res.success ? fcmTokens[idx] : null))
    .filter((token): token is string => token !== null);

  return {
    successCount: response.successCount,
    failureCount: response.failureCount,
    failedTokens,
  };
};

const sendNotifications = async (body: string, title: string) => {
  try {
    const users = await prisma.user.findMany({
      where: { fcmToken: { not: null } },
      select: { id: true, fcmToken: true },
    });

    if (users.length === 0) {
      throw new ApiError(404, "No users found with valid FCM tokens.");
    }

    const fcmTokens = users.map((user) => user.fcmToken);

    const message = {
      notification: {
        title: title || "Notification",
        body: body,
      },
      tokens: fcmTokens,
    };
    const response = await admin
      .messaging()
      .sendEachForMulticast(message as any);
    const successIndices = response.responses
      .map((res, idx) => (res.success ? idx : null))
      .filter((idx) => idx !== null) as number[];

    const successfulUsers = successIndices.map((idx) => users[idx]);
    if (successfulUsers.length > 0) {
      await prisma.notifications.createMany({
        data: successfulUsers.map((user) => ({
          receiverId: user.id,
          title: title || "Notification",
          body: body,
        })),
      });
    }
    const failedTokens = response.responses
      .map((res, idx) => (!res.success ? fcmTokens[idx] : null))
      .filter((token) => token !== null);

    return {
      successCount: response.successCount,
      failureCount: response.failureCount,
      failedTokens,
    };
  } catch (error) {
    throw new ApiError(500, "Failed to send notifications.");
  }
};

const getNotificationsFromDB = async (receiverId: string) => {
  const notifications = await prisma.notifications.findMany({
    where: { receiverId: receiverId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  // if (notifications.length === 0) {
  //   throw new ApiError(404, "No notifications found for the user");
  // }

  return notifications;
};

export const notificationServices = {
  sendSingleNotification,
  sendMultipulNotifications,
  getNotificationsFromDB,
  sendNotifications,
};
