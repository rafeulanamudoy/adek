import { Request } from "express";
import config from "../../../config";
import prisma from "../../../shared/prisma";
import { conversationPrivateFields } from "../../../utlits/prisma.common.field";
import { redis } from "../../../helpers/redis";

const createConversationIntoDB = async (user1Id: string, user2Id: string) => {
  try {
    const existingConversation = await prisma.conversation.findFirst({
      where: {
        OR: [
          { user1Id, user2Id },
          { user1Id: user2Id, user2Id: user1Id },
        ],
      },
      select: {
        id: true,
      },
    });

    if (existingConversation) {
      return existingConversation;
    }
    const newConversation = await prisma.conversation.create({
      data: {
        user1Id,
        user2Id,
      },
      select: {
        id: true,
      },
    });
    return newConversation;
  } catch (error) {
    console.error("Error creating or finding conversation:", error);
  }
};

const chatImageUploadIntoDB = async (file: Express.Multer.File) => {
  const imageurl = `${config.backend_base_url}/uploads/${file.filename}`;
  return imageurl;
};

const getConversationListIntoDB = async (
  userId: string,
  page: number = 1,
  limit: number = 10
) => {
  const skip = (page - 1) * limit;

  const [privateConversations, privateCount] = await Promise.all([
    prisma.conversation.findMany({
      where: {
        OR: [{ user1Id: userId }, { user2Id: userId }],
        status: "ACTIVE",
      },

      select: {
        ...conversationPrivateFields,
        _count: {
          select: {
            privateMessage: {
              where: {
                receiverId: userId,
                read: false,
              },
            },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.conversation.count({
      where: { OR: [{ user1Id: userId }, { user2Id: userId }] },
    }),
  ]);

  // Map private conversations
  const privateConversationsData = await Promise.all(
    privateConversations.map(async (conv) => {
      const otherUser: any = conv?.user1Id === userId ? conv.user2 : conv.user1;

      return {
        conversationId: conv?.id,
        type: "private",
        participants: {
          userId: otherUser?.id || "",
          username:
            otherUser?.passenger?.fullName || otherUser?.driver?.fullName || "",
          avater:
            otherUser?.passenger?.avater || otherUser?.driver?.avater || "",
        },
        lastMessage: conv?.lastMessage || "",
        lastMessageTime: conv?.updatedAt || new Date(0),
        unseen: conv?._count?.privateMessage || 0,
      };
    })
  );

  const totalPages = Math.ceil(privateCount / limit);

  const result = {
    result: privateConversationsData,
    meta: {
      page: totalPages,
      limit: limit,
      total: privateCount,
    },
  };
  return result;
};

const getSingleMessageList = async (
  userId: string,
  receiverId: string,
  page: number,
  limit: number
) => {
  const skip = (page - 1) * limit;
  const result = await prisma.privateMessage.findMany({
    where: {
      OR: [
        {
          senderId: userId,
          receiverId: receiverId,
        },
        {
          senderId: receiverId,
          receiverId: userId,
        },
      ],
    },
    orderBy: { createdAt: "desc" },
    skip,
    take: limit,
  });

  const totalMessage = await prisma.privateMessage.count({
    where: {
      OR: [
        {
          senderId: userId,
          receiverId: receiverId,
        },
        {
          senderId: receiverId,
          receiverId: userId,
        },
      ],
    },
  });
  const totalPages = Math.ceil(totalMessage / limit);

  return {
    result,
    meta: {
      page,
      limit,
      totalPage: totalPages,
      total: totalMessage,
    },
  };
};

const markMessagesAsRead = async (userId: string, conversationId: string) => {
  await prisma.privateMessage.updateMany({
    where: {
      receiverId: userId,
      conversationId: conversationId,
      read: false,
    },
    data: {
      read: true,
      updatedAt: new Date(),
    },
  });

  return { success: true, message: "Messages marked as read" };
};

const singleGroupMessageIntoDB = async (req: Request) => {
  const groupId = req.params.groupId as string;
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const result = await prisma.groupMessage.findMany({
    where: { groupId: groupId },
    select: {
      id: true,
      content: true,
      groupId: true,
      createdAt: true,
      sender: { select: { id: true, fullName: true, profileImage: true } },
    },
    orderBy: {
      createdAt: "desc",
    },
    skip,
    take: limit,
  });

  const totalMessage = await prisma.groupMessage.count({
    where: { groupId: groupId },
  });

  const totalPages = Math.ceil(totalMessage / limit);

  return {
    result,
    meta: {
      page: totalPages,
      limit: limit,
      total: totalMessage,
    },
  };
};

const getMergedMessageList = async (
  conversationId: string,
  userId: string,
  page: number,
  limit: number
) => {
  const start = (page - 1) * limit;
  const end = start + limit - 1;
  const redisKey = `chat:messages:${conversationId}`;

  const [redisCount, dbCount] = await Promise.all([
    redis.zcard(redisKey),
    prisma.privateMessage.count({ where: { conversationId } }),
  ]);

  const total = redisCount + dbCount;
  const totalPage = Math.ceil(total / limit);

  const messages: any[] = [];

  if (start < redisCount) {
    const redisEnd = Math.min(end, redisCount - 1);
    const redisRaw = await redis.zrange(redisKey, start, redisEnd);
    const redisMessages = redisRaw.map((msg) => JSON.parse(msg));

    const remaining = limit - redisMessages.length;
    let dbMessages: any[] = [];
    if (remaining > 0) {
      dbMessages = await prisma.privateMessage.findMany({
        where: { conversationId },

        orderBy: { createdAt: "asc" },
        skip: 0,
        take: remaining,
      });
    }

    messages.push(
      ...[...redisMessages, ...dbMessages].sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      )
    );
  } else {
    const dbSkip = start - redisCount;
    const dbMessages = await prisma.privateMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
      skip: dbSkip,
      take: limit,
    });

    messages.push(...dbMessages);
  }

  await prisma.privateMessage.updateMany({
    where: {
      conversationId: conversationId,
      receiverId: userId,
      read: false,
    },
    data: {
      read: true,
    },
  });

  return {
    messages,
    meta: {
      page,
      limit,
      totalPage,
      total,
    },
  };
};
export const chatService = {
  getConversationListIntoDB,
  createConversationIntoDB,
  getSingleMessageList,
  markMessagesAsRead,
  chatImageUploadIntoDB,
  singleGroupMessageIntoDB,
  getMergedMessageList
};
