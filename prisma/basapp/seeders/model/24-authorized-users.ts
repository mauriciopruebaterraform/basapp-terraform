import { Prisma, PrismaClient } from '@prisma/client';
import { Model } from '../seed';
import { constants, authorizedUser } from '../utils/constants';

const { TEST_COUNTRY_ID, USER_ADMIN_ID, SAN_FERNANDO_ID } = constants;
const {
  AUTHORIZED_USER_FERNANDO,
  AUTHORIZED_USER_NERINA,
  AUTHORIZED_USER_GONZALO,
} = authorizedUser;

const model: Model & { data: Prisma.AuthorizedUserCreateManyInput[] } = {
  data: [
    {
      id: AUTHORIZED_USER_FERNANDO,
      firstName: 'Fernando',
      lastName: 'Bello',
      username: '1150281459',
      lot: 'DS123456',
      description: null,
      sendEvents: true,
      active: false,
      customerId: TEST_COUNTRY_ID,
      createdAt: new Date(),
      updatedAt: new Date(),
      expireDate: null,
      updatedById: USER_ADMIN_ID,
      isOwner: true,
    },
    {
      id: AUTHORIZED_USER_NERINA,
      firstName: 'Nerina',
      lastName: 'Capital',
      username: '1123199052',
      lot: '',
      description: null,
      sendEvents: true,
      customerId: TEST_COUNTRY_ID,
      createdAt: new Date(),
      updatedAt: new Date(),
      expireDate: null,
      updatedById: USER_ADMIN_ID,
      isOwner: true,
    },
    {
      id: AUTHORIZED_USER_GONZALO,
      firstName: 'Gonzalo',
      lastName: 'Buszmicz',
      username: '3413077090',
      lot: null,
      description: null,
      sendEvents: false,
      customerId: SAN_FERNANDO_ID,
      createdAt: new Date(),
      updatedAt: new Date(),
      expireDate: null,
      updatedById: USER_ADMIN_ID,
      isOwner: true,
    },
  ],
  async run(prisma: PrismaClient) {
    return prisma.authorizedUser.createMany({
      data: this.data,
      skipDuplicates: true,
    });
  },
};

export default model;
