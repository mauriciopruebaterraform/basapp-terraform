import { Prisma, PrismaClient } from '@prisma/client';
import { Model } from '../seed';
import { constants } from '../utils/constants';

const { SAN_FERNANDO_ID, TEST_COUNTRY_ID, BOLIVAR_ID } = constants;

const model: Model & { data: Prisma.CustomerSectionsCreateManyInput[] } = {
  data: [
    {
      customerId: TEST_COUNTRY_ID,
      alerts: true,
      events: false,
      notifications: true,
      reservations: false,
      protocols: true,
      usefulInformation: false,
      integrations: true,
      lots: false,
      cameras: true,
      locations: false,
    },
    {
      customerId: SAN_FERNANDO_ID,
      alerts: false,
      events: true,
      notifications: false,
      reservations: false,
      protocols: false,
      usefulInformation: true,
      integrations: false,
      lots: true,
      cameras: false,
      locations: true,
    },
    {
      customerId: BOLIVAR_ID,
      alerts: true,
      events: false,
      notifications: true,
      reservations: false,
      protocols: true,
      usefulInformation: false,
      integrations: true,
      lots: false,
      cameras: true,
      locations: false,
    },
    {
      customerId: 'cecb27ae-b082-4f09-aea6-4e96a6ef61ca',
      alerts: false,
      events: true,
      notifications: false,
      reservations: true,
      protocols: false,
      usefulInformation: true,
      integrations: false,
      lots: true,
      cameras: false,
      locations: true,
    },
  ],
  async run(prisma: PrismaClient) {
    return prisma.customerSections.createMany({
      data: this.data,
      skipDuplicates: true,
    });
  },
};

export default model;
