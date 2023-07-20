import { Prisma, PrismaClient } from '@prisma/client';
import { Model } from '../seed';
import { constants } from '../utils/constants';

const { USER_ADMIN_ID, SAN_FERNANDO_ID, TEST_COUNTRY_ID, BOLIVAR_ID } =
  constants;

const model: Model & { data: Prisma.CustomerSettingsCreateManyInput[] } = {
  data: [
    {
      customerId: TEST_COUNTRY_ID,
      updatedById: USER_ADMIN_ID,
    },
    {
      customerId: SAN_FERNANDO_ID,
      updatedById: USER_ADMIN_ID,
    },
    {
      customerId: BOLIVAR_ID,
      updatedById: USER_ADMIN_ID,
    },
  ],
  async run(prisma: PrismaClient) {
    return prisma.customerSettings.createMany({
      data: this.data,
      skipDuplicates: true,
    });
  },
};

export default model;
