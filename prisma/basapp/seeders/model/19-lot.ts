import { Prisma, PrismaClient } from '@prisma/client';
import { Model } from '../seed';
import { constants, lots } from '../utils/constants';

const { USER_ADMIN_ID, TEST_COUNTRY_ID, SAN_FERNANDO_ID } = constants;
const { LOT_265 } = lots;

const model: Model & { data: Prisma.LotCreateManyInput[] } = {
  data: [
    {
      lot: '264',
      latitude: '-34.411019',
      longitude: '-58.829745',
      active: true,
      isArea: false,
      updatedById: USER_ADMIN_ID,
      customerId: TEST_COUNTRY_ID,
      createdAt: new Date(),
    },
    {
      lot: 'House',
      latitude: '-34.407568',
      longitude: '-58.827965',
      updatedById: USER_ADMIN_ID,
      active: true,
      isArea: true,
      customerId: TEST_COUNTRY_ID,
      createdAt: new Date(),
    },
    {
      id: LOT_265,
      lot: '265',
      latitude: '-34.410820',
      longitude: '-58.829445',
      active: true,
      isArea: false,
      updatedById: USER_ADMIN_ID,
      customerId: TEST_COUNTRY_ID,
      createdAt: new Date(),
    },
    {
      lot: 'Golf House',
      updatedById: USER_ADMIN_ID,
      latitude: '-34.406696',
      longitude: '-58.825858',
      active: true,
      isArea: true,
      customerId: SAN_FERNANDO_ID,
      createdAt: new Date(),
    },
    {
      lot: '266',
      latitude: '-34.410698',
      updatedById: USER_ADMIN_ID,
      longitude: '-58.829257',
      active: true,
      isArea: false,
      customerId: TEST_COUNTRY_ID,
      createdAt: new Date(),
    },
    {
      lot: 'Tenis canchas',
      latitude: '-34.405789',
      updatedById: USER_ADMIN_ID,
      longitude: '-58.828421',
      active: false,
      isArea: true,
      customerId: SAN_FERNANDO_ID,
      createdAt: new Date(),
    },
  ],
  async run(prisma: PrismaClient) {
    return prisma.lot.createMany({
      data: this.data,
      skipDuplicates: true,
    });
  },
};

export default model;
