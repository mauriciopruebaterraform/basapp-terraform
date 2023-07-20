import { Prisma, PrismaClient } from '@prisma/client';
import { Model } from '../seed';
import {
  constants,
  eventCategory,
  customerEventCategory,
} from '../utils/constants';

const { USER_ADMIN_ID, TEST_COUNTRY_ID } = constants;
const { CONSTRUCTION, VISITAS } = eventCategory;
const { CONSTRUCTION_TEST_COUNTRY_ID, VISITAS_TEST_COUNTRY_ID } =
  customerEventCategory;
const model: Model & { data: Prisma.CustomerEventCategoryCreateManyInput[] } = {
  data: [
    {
      id: CONSTRUCTION_TEST_COUNTRY_ID,
      customerId: TEST_COUNTRY_ID,
      createdAt: new Date('2021-02-01 13:27:10'),
      updatedAt: new Date('2021-09-04 15:21:14'),
      categoryId: CONSTRUCTION,
      active: true,
      updatedById: USER_ADMIN_ID,
    },
    {
      id: VISITAS_TEST_COUNTRY_ID,
      customerId: TEST_COUNTRY_ID,
      createdAt: new Date(),
      updatedAt: new Date(),
      categoryId: VISITAS,
      active: true,
      updatedById: USER_ADMIN_ID,
    },
  ],
  async run(prisma: PrismaClient) {
    return prisma.customerEventCategory.createMany({
      data: this.data,
      skipDuplicates: true,
    });
  },
};

export default model;
