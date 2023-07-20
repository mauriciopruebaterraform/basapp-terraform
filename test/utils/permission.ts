import { Prisma, PrismaClient } from '@prisma/client';

export const createPermission = (
  prisma: PrismaClient,
  data: Prisma.PermissionCreateInput,
) => {
  return prisma.permission.create({
    data: {
      ...data,
    },
  });
};
