
// import prisma from "../shared/prisma";

// // const storeUserConnection = async (userId: string) => {
// //   const user = await prisma.user.findUnique({
// //     where: { id: userId },
// //     select: {
// //       passenger: { select: { avater: true, fullName: true } },
// //       driver: { select: { avater: true, fullName: true } },
// //     },
// //   });
// //   if (!user) return;
// //   const image = user?.passenger?.avater || user?.driver?.avater || " ";
// //   const username = user?.passenger?.fullName || user?.driver?.fullName || " ";

// //   await redis.hmset(`user:${userId}`, {
// //     username,
// //     image,
// //   });
// // };

// const getUserDetails = async (userId: string): Promise<any | null> => {
//   const userDetails = await redis.hgetall(`user:${userId}`);
//   return userDetails;
// };

// const removeUserConnection = async (userId: string) => {
//   await redis.del(`user:${userId}`);
//   await removeDriverLocationFromRedis(userId);
//   await redis.zremrangebyrank(`conversation:list:${userId}`, 0, -1);
// };

// const removeDriverLocationFromRedis = async (driverId: string) => {
//   const locationKey = "driver-locations-geo";
//   const detailsKey = "driver-locations-details";
//   await redis.zrem(locationKey, driverId);
//   await redis.hdel(detailsKey, driverId);
// };

// const updateConversationList = async (
//   user1Id: string,
//   user2Id: string,
//   conversationId: string,
//   lastMessage: string
// ) => {
//   const messagePreview = lastMessage.slice(0, 50);
//   const timestamp = Date.now();
//   await redis.zadd(
//     `conversation:list:${user1Id}`,
//     timestamp.toString(),
//     user2Id
//   );

//   await redis.zadd(
//     `conversation:list:${user2Id}`,
//     timestamp.toString(),
//     user2Id
//   );
//   await redis.hset(
//     `conversation:details:${conversationId}`,
//     "lastMessage",
//     messagePreview,
//     "timestamp",
//     timestamp
//   );
// };

// // const getConversationList = async (
// //   userId: string,
// //   page: number = 1,
// //   limit: number = 10
// // ) => {
// //   const skip = (page - 1) * limit;

// //   const conversationIds = await redis.zrevrange(
// //     `conversation:list:${userId}`,
// //     skip,
// //     skip + limit - 1
// //   );

// //   const userDetailsPromises = conversationIds.map(async (conversationId) => {
// //     const otherUserId = await redis
// //       .zrange(`conversation:list:${userId}`, 0, -1)
// //       .then((userIds) => userIds.find((id) => id !== userId));

// //     const userDetails = await getUserDetails(otherUserId as string);
// //     return userDetails;
// //   });
// //   const resolvedUserDetails = await Promise.all(userDetailsPromises);
// //   return resolvedUserDetails.filter(Boolean);
// // };

// export const redisSocketService = {

//   getUserDetails,
//   removeUserConnection,
//   removeDriverLocationFromRedis,
//   // getConversationList,
//   updateConversationList,
// };
