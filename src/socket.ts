import { WebSocketServer } from "ws";
import {
  ExtendedWebSocket,
 
  MessageTypes,
} from "./utlits/socket.helpers";
import { validateToken } from "./utlits/validateToken";
import {
  handleJoinApp,
  handleJoinPrivateChat,
  handleSendPrivateMessage,
} from "./utlits/private.chat";
import { chatService } from "./app/modules/chat/chat.service";


import { authService } from "./app/modules/auth/auth.service";
import startKeepAlive from "./utlits/startKeepAlive";

export const activeUsers = new Map<string, ExtendedWebSocket>();

export const chatRooms = new Map<string, Set<ExtendedWebSocket>>();

let wss: WebSocketServer;

export default function socketConnect(server: any) {
  wss = new WebSocketServer({ server });

  wss.on("connection", (ws: ExtendedWebSocket, req) => {
    const token = req.headers["x-token"] as string;
    const userId = validateToken(ws, token);
    if (!userId) {
      return;
    }
    const keepAliveInterval = startKeepAlive(ws);

    ws.on("message", async (data: string) => {
      try {
        let parsedData = JSON.parse(data);
        parsedData.userId = userId;

        switch (parsedData.type) {
          case MessageTypes.JOIN_PRIVATE_CHAT:
            await handleJoinPrivateChat(ws, parsedData, chatRooms);
            break;
          case MessageTypes.JOIN_APP:
            await handleJoinApp(ws, userId, activeUsers);
            break;
          case MessageTypes.SEND_PRIVATE_MESSAGE:
            await handleSendPrivateMessage(ws, parsedData);
            break;
         
          case MessageTypes.CONVERSATION_LIST:
            try {
              const { userId, page = 1, limit = 10 } = parsedData;
              const conversationList =
                await chatService.getConversationListIntoDB(
                  userId,
                  Number(page),
                  Number(limit)
                );
              const receiverSocket = activeUsers.get(userId);
              if (receiverSocket) {
                receiverSocket.send(
                  JSON.stringify({
                    type: MessageTypes.CONVERSATION_LIST,
                    conversationList,
                  })
                );
              }
            } catch (error) {
              ws.send(
                JSON.stringify({
                  type: MessageTypes.FAILURE,
                  message: error,
                })
              );
            }
            break;

         

         
          default:
            console.log("Unknown WebSocket message type:", parsedData.type);
        }
      } catch (error) {
        console.error("Error handling WebSocket message:", error);
      }
    });
    ws.on("close", () => {
      clearInterval(keepAliveInterval);
      // handleDisconnect(ws);
    });
  });
}
