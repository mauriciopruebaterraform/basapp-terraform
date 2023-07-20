import { Prisma, PrismaClient, Role } from '@prisma/client';
import { Model } from '../seed';
import * as bcrypt from 'bcryptjs';
import { constants } from '../utils/constants';

const { USER_ADMIN_ID } = constants;
const hashedPassword = bcrypt.hashSync('sg2021BAS', 10);

const model: Model & { data: Prisma.UserCreateInput } = {
  data: {
    id: USER_ADMIN_ID,
    username: 'administrador@sysgarage.com',
    password: hashedPassword,
    role: Role.admin,
    firstName: 'Administrador',
    lastName: 'Basapp',
    fullName: 'Administrador Basapp',
    active: true,
  },
  async run(prisma: PrismaClient) {
    return prisma.user.create({
      data: this.data,
    });
  },
};

export default model;
