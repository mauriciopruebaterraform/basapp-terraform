import { PrismaClient, Prisma, User, Role } from '@prisma/client';
import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcryptjs';

const createUser = (prisma: PrismaClient, data: Prisma.UserCreateInput) => {
  const hashedPassword = bcrypt.hashSync(data.password, 10);
  return prisma.user.create({
    data: {
      ...data,
      password: hashedPassword,
    },
    include: {
      customer: true,
    },
  });
};

const createAdminUser = (
  prisma: PrismaClient,
  data?: Partial<Prisma.UserCreateInput>,
) => {
  return createUser(prisma, {
    role: Role.admin,
    username: 'admin@gmail.com',
    password: '123456',
    firstName: 'Usuario',
    lastName: 'Admin',
    fullName: 'Usuario Admin',
    ...data,
  });
};

const createMonitoringUser = (
  prisma: PrismaClient,
  data?: Partial<Prisma.UserCreateInput>,
) => {
  return createUser(prisma, {
    role: Role.monitoring,
    username: 'monitoring@gmail.com',
    password: '123456',
    firstName: 'Usuario',
    lastName: 'Monitor',
    fullName: 'Usuario Monitor',
    ...data,
  });
};

const createStatesmanUser = (
  prisma: PrismaClient,
  data?: Partial<Prisma.UserCreateInput>,
) => {
  return createUser(prisma, {
    username: 'statesman@gmail.com',
    password: '123456',
    firstName: 'Usuario',
    lastName: 'Estadista',
    fullName: 'Usuario Estadista',
    role: Role.statesman,
    ...data,
  });
};

const createFinalUser = (
  prisma: PrismaClient,
  data?: Partial<Prisma.UserCreateInput>,
) => {
  if (data?.username) {
    if (!parseInt(data?.username)) {
      throw new Error('final user must to have only phone number');
    }
  }

  return createUser(prisma, {
    username: '541166480626',
    password: '123456',
    firstName: 'Usuario',
    lastName: 'Final',
    fullName: 'Usuario Final',
    role: Role.user,
    ...data,
  });
};

const createUserToken = (user: User) => {
  const payload = {
    sub: user.id,
    username: user.username,
    role: user.role,
    active: user.active,
    customerId: user.customerId,
  };

  return jwt.sign(payload, process.env.JWT_SECRET || 'secret', {
    expiresIn: process.env.JWT_EXPIRATION || '10y',
  });
};

const createAdminUserAndToken = async (
  prisma: PrismaClient,
  data?: Prisma.UserCreateInput,
) => {
  const user = await createAdminUser(prisma, data);
  const token = createUserToken(user);
  return { user, token };
};

const createStatesmanUserAndToken = async (
  prisma: PrismaClient,
  data?: Partial<Prisma.UserCreateInput>,
) => {
  const user = await createStatesmanUser(prisma, data);
  const token = createUserToken(user);
  return { user, token };
};

const createMonitoringUserAndToken = async (
  prisma: PrismaClient,
  data?: Partial<Prisma.UserCreateInput>,
) => {
  const user = await createMonitoringUser(prisma, data);
  const token = createUserToken(user);
  return { user, token };
};

const createFinalUserAndToken = async (
  prisma: PrismaClient,
  data?: Partial<Prisma.UserCreateInput>,
) => {
  const user = await createFinalUser(prisma, data);
  const token = createUserToken(user);
  return { user, token };
};

const createUserAndToken = async (
  prisma: PrismaClient,
  data: Prisma.UserCreateInput,
) => {
  const user = await createUser(prisma, data);
  const token = createUserToken(user);
  return { user, token };
};

const deleteUser = (prisma: PrismaClient, id: string) => {
  return prisma.user.delete({
    where: { id },
  });
};

export {
  createUser,
  createFinalUser,
  createStatesmanUser,
  createMonitoringUser,
  createAdminUser,
  createUserToken,
  createUserAndToken,
  createAdminUserAndToken,
  createStatesmanUserAndToken,
  createMonitoringUserAndToken,
  createFinalUserAndToken,
  deleteUser,
};
