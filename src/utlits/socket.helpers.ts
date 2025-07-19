import { WebSocket } from "ws";
import prisma from "../shared/prisma";
import { activeUsers, chatRooms } from "../socket";


interface ExtendedWebSocket extends WebSocket {
  userId?: string;
  user2Id?: string;
  chatroomId?: string;
  groupId?: string;
}

export enum MessageTypes {
  JOIN_PRIVATE_CHAT = "joinPrivateChat",
  SEND_PRIVATE_MESSAGE = "sendPrivateMessage",
  RECEIVED_PRIVATE_MESSAGE = "receivePrivateMessage",
  NEARBY_DRIVER_LIST = "nearbyDriverList",
  CONVERSATION_LIST = "conversationList",
  JOIN_CONVARSATION_LIST = "joinConvarsationList",
  ORDER_LIST = "orderList",
  NOTIFY_DRIVER = "NOTIFY_DRIVER",
  AUTH_SUCCESS = "authSuccess",
  AUTH_FAILURE = "authFailure",
  FAILURE = "Failure",
  JOIN_APP = "joinApp",
  UPDATE_DRIVER_LOCATION = "updateDriverLocation",
}

function broadcastToGroup(
  groupId: string,
  message: any,
  groupRooms: Map<string, Set<ExtendedWebSocket>>
) {
  const groupClients = groupRooms.get(groupId);
  if (!groupClients) return;

  groupClients.forEach((client: ExtendedWebSocket) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}

export const handleConvarsationJoinEvent = async (
  ws: ExtendedWebSocket,
  userId: string,
  activeUsers: Map<
    string,
    { socket: ExtendedWebSocket; lastActiveAt: Date | null }
  >
) => {
  ws.userId = userId;
  activeUsers.set(userId, { socket: ws, lastActiveAt: new Date() });
  ws.send(
    JSON.stringify({
      type: MessageTypes.JOIN_CONVARSATION_LIST,
      message: `Successfully joined`,
    })
  );
};

// async function storeAndSendPrivateMessage(
//   ws: ExtendedWebSocket,
//   senderId: string,
//   receiverId: string,
//   content: string,
//   imageUrl: string,
//   conversationId: string
// ) {
//   try {
//     const [senderDetails, receiverDetails] = await Promise.all([
//       redisSocketService.getUserDetails(senderId),
//       redisSocketService.getUserDetails(receiverId),
//     ]);

//     const messagePayload = {
//       type: MessageTypes.RECEIVED_PRIVATE_MESSAGE,
//       senderId,
//       receiverId,
//       content,
//       imageUrl,
//     };

//     const chatRoom = chatRooms.get(conversationId);

//     if (chatRoom) {
//       for (const clientSocket of chatRoom) {
//         if (clientSocket.readyState === clientSocket.OPEN) {
//           const isSender = clientSocket.userId === senderId;

//           const enrichedPayload = {
//             ...messagePayload,
//             receiver: isSender ? receiverDetails : senderDetails,
//           };

//           clientSocket.send(JSON.stringify(enrichedPayload));
//         }
//       }
//     }
//     await conversationListQueue.add(
//       "conversationList",
//       { user1Id: senderId, user2Id: receiverId },
//       {
//         jobId: `conversationList:${senderId}-${receiverId}-${new Date()}`,
//         removeOnComplete: true,
//         delay: 0,
//         removeOnFail: {
//           count: 3,
//         },
//       }
//     );
//     await prisma.conversation.update({
//       where: {
//         id: conversationId,
//       },
//       data: {
//         lastMessage: content?.slice(0, 50),
//         privateMessage: {
//           create: {
//             content,
//             receiverId,
//             senderId,
//             imageUrl,
//           },
//         },
//       },
//     });
//   } catch (error: any) {
//     ws.send(
//       JSON.stringify({
//         type: MessageTypes.FAILURE,
//         message: `Error sending message: ${error.message || error}`,
//       })
//     );
//   }
// }

// Handle user disconnection
// function handleDisconnect(ws: ExtendedWebSocket) {
//   try {
//     if (ws.userId) {
//       activeUsers.delete(ws.userId);
//       redisSocketService.removeUserConnection(ws.userId);
//       if (ws.chatroomId && chatRooms.has(ws.chatroomId)) {
//         const chatRoom = chatRooms.get(ws.chatroomId);
//         chatRoom?.delete(ws);
//         if (chatRoom && chatRoom.size === 0) {
//           chatRooms.delete(ws.chatroomId);
//         }
//       }
//     }
//   } catch (error) {
//     return;
//   }
// }

export {
  broadcastToGroup,
  // storeAndSendPrivateMessage,
  ExtendedWebSocket,
  // handleDisconnect,
};
