import prisma from "../../../shared/prisma";
import ApiError from "../../../errors/ApiErrors";
import uploadToDigitalOcean from "../../../helpers/uploadToDigitalOcean";
import httpStatus from "http-status";

const createGroupIntoDB = async (
  payload: any,
  userId: string,
  file: Express.Multer.File
) => {
  if (!file) {
    throw new ApiError(400, "Group image is required");
  }

  const groupImage = await uploadToDigitalOcean(file);

  const group = await prisma.group.create({
    data: {
      name: payload.name,
      adminId: userId,
      description: payload.description,
      groupImage,
    },
  });

  if (!group) {
    throw new ApiError(500, "Failed to create the group.");
  }

  const memberIds = new Set<string>(payload.members || []);
  memberIds.add(userId);

  await prisma.userGroup.createMany({
    data: Array.from(memberIds).map((memberId) => ({
      userId: memberId,
      groupId: group.id,
    })),
  });

  return group;
};

const deleteGroupFromDB = async (groupId: string, userId: string) => {
  const group = await prisma.group.findUnique({
    where: {
      id: groupId,
    },
  });

  if (!group) {
    throw new ApiError(404, "Group not found.");
  }
  if (group.adminId !== userId) {
    throw new ApiError(403, "You are not authorized to delete this group.");
  }

  await prisma.userGroup.deleteMany({
    where: {
      groupId: groupId,
    },
  });

  const result = await prisma.group.delete({
    where: {
      id: groupId,
    },
  });

  return result;
};

const updateGroupInDB = async (
  groupId: string,
  userId: string,
  file: Express.Multer.File,
  payload: any
) => {
  const group = await prisma.group.findUnique({
    where: {
      id: groupId,
    },
  });

  if (!group) {
    throw new ApiError(404, "Group not found.");
  }

  if (group.adminId !== userId) {
    throw new ApiError(403, "You are not authorized to update this group.");
  }

  let groupImage = group.groupImage;

  if (file) {
    groupImage = await uploadToDigitalOcean(file);
  }

  const updatedGroup = await prisma.group.update({
    where: {
      id: groupId,
    },
    data: {
      name: payload.name || group.name,
      description: payload.description || group.description,
      groupImage,
    },
  });

  return updatedGroup;
};
const joinGroup = async (userId: string, groupId: string) => {

  console.log(groupId,"check group id")
  const findGroup = await prisma.group.findUnique({
    where: {
      id: groupId,
    },
  });



  if (!findGroup) {
    throw new ApiError(httpStatus.NOT_FOUND, "group not found");
  }

  const existingMembership = await prisma.userGroup.findUnique({
    where: {
      userId_groupId: {
        userId,
        groupId,
      },
    },
  });

  if (existingMembership) {
    throw new ApiError(400, "User is already a member of the group.");
  }

  const newMembership = await prisma.userGroup.create({
    data: {
      userId,
      groupId,
    },
  });

  return newMembership;
};

export const groupService = {
  createGroupIntoDB,
  updateGroupInDB,
  deleteGroupFromDB,
  joinGroup,
};
