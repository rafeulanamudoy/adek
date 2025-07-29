import { redis } from "../helpers/redis";
import prisma from "../shared/prisma";

const MAX_CONVERSATIONS = 15;

const storeUserConnection = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      profileImage: true,
      id: true,
      fullName: true,
    },
  });
  if (!user) return;
  const image = user?.profileImage || " ";
  const username = user?.fullName || " ";
  await redis.hset(`user:${userId}`, {
    id: user.id,
    username,
    image,
  });
};

const getUserDetails = async (userId: string) => {
  let userDetails = await redis.hgetall(`user:${userId}`);

  if (!userDetails || Object.keys(userDetails).length === 0) {
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, fullName: true, profileImage: true },
    });

    if (!dbUser) return null;

    userDetails = {
      id: dbUser.id,
      username: dbUser.fullName,
      image: dbUser.profileImage,
    };
  }

  return userDetails;
};

const removeUserConnection = async (userId: string) => {
  await redis.del(`user:${userId}`);
  await redis.zremrangebyrank(`conversation:list:${userId}`, 0, -1);
};

const updateConversationList = async (
  user1Id: string,
  user2Id: string,
  conversationId: string,
  lastMessage: string
) => {
  const messagePreview = lastMessage?.slice(0, 50) || "📷 Image";
  const timestamp = Date.now();

  await Promise.all([
    redis.zadd(`conversation:list:${user1Id}`, timestamp, conversationId),
    redis.zadd(`conversation:list:${user2Id}`, timestamp, conversationId),
    redis.zremrangebyrank(
      `conversation:list:${user1Id}`,
      0,
      -MAX_CONVERSATIONS - 1
    ),
    redis.zremrangebyrank(
      `conversation:list:${user2Id}`,
      0,
      -MAX_CONVERSATIONS - 1
    ),
    redis.hset(
      `conversation:details:${conversationId}`,
      "lastMessage",
      messagePreview,
      "timestamp",
      timestamp.toString(),
      "user1Id",
      user1Id,
      "user2Id",
      user2Id
    ),
  ]);
};

const getConversationListFromRedis = async (
  userId: string,
  page = 1,
  limit = 10
) => {
  const start = (page - 1) * limit;
  const end = start + limit - 1;

  const conversationIds = await redis.zrevrange(
    `conversation:list:${userId}`,
    start,
    end
  );

  if (!conversationIds.length) return null;

  const conversations = await Promise.all(
    conversationIds.map(async (cid: any) => {
      const details = await redis.hgetall(`conversation:details:${cid}`);

      const otherUserId =
        details.user1Id === userId ? details.user2Id : details.user1Id;

      const userDetails = await redisSocketService.getUserDetails(otherUserId);

      const unseenCount = await redis.hget(
        `conversation:unseen:${cid}`,
        userId
      );

      return {
        conversationId: cid,
        type: "private",
        participants: userDetails,
        lastMessage: details.lastMessage,
        lastMessageTime: new Date(Number(details.timestamp)),
        unseen: Number(unseenCount || 0),
      };
    })
  );

  return {
    conversations,
    meta: {
      page,
      limit,
      total: await redis.zcard(`conversation:list:${userId}`),
    },
  };
};

export const redisSocketService = {
  storeUserConnection,
  getUserDetails,
  removeUserConnection,
  getConversationListFromRedis,
  updateConversationList,
};
