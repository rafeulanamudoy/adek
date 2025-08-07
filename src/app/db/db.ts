import { UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import prisma from "../../shared/prisma";

export const initiateSuperAdmin = async () => {
  const payload = {
    id: "67de4b5db3d0bda15b780ca4",
    userName: "superAdmin",
    email: "superadmin@gmail10p.com",
    password: "123456",
    role: UserRole.ADMIN,
    db: "1997-01-12T06:48:45.050Z",
    phoneNumber: "+8801515635005",
  };

  const existingSuperAdmin = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  if (existingSuperAdmin) {
    return;
  }
  const hashedPassword: string = await bcrypt.hash(payload.password, 12);
  await prisma.user.create({
    data: {
      id: payload.id,
      email: payload.email,
      role: payload.role,

      fullName: "admin",
      password: payload.password,
      phoneNumber: payload.phoneNumber,

      admin: {
        create: {
          id: payload.id,
          email: payload.email,
          password: hashedPassword,
          nickName: payload.userName,
        },
      },
    },
  });
};
