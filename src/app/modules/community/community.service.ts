import prisma from "../../../shared/prisma";

const createPost = async (payload: any) => {
  const result = await prisma.communityPost.create({
    data: {
      userId: payload.userId,

      content: payload.content,
    },
  });
  return result;
};
const getAllPost = async (userId: string) => {
  const result = await prisma.communityPost.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      content: true,
      likes: true,
      imageUrl: true,
      videoUrl: true,
      user: {
        select: {
          fullName: true,
          profileImage: true,
        },
      },

      comments: {
        where: {
          parentCommentId: null,
        },
        select: {
          id: true,
          content: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              fullName: true,
              profileImage: true,
            },
          },

          replies: {
            select: {
              id: true,
              content: true,
              createdAt: true,
              user: {
                select: {
                  id: true,
                  fullName: true,
                  profileImage: true,
                },
              },
            },
          },
        },
      },
    },
  });
  return result;
};

export const communityService = {
  createPost,
  getAllPost,
};
