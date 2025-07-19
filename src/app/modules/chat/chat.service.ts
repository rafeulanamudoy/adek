import config from "../../../config";
import prisma from "../../../shared/prisma";
import { conversationPrivateFields } from "../../../utlits/prisma.common.field";

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

export const chatService = {
  getConversationListIntoDB,
  createConversationIntoDB,
  getSingleMessageList,
  markMessagesAsRead,
  chatImageUploadIntoDB,
};
