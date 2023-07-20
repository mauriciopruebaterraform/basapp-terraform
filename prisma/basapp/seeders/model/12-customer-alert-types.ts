import { Prisma, PrismaClient } from '@prisma/client';
import { Model } from '../seed';
import { constants } from '../utils/constants';

const { TEST_COUNTRY_ID } = constants;

const model: Model & { data: Prisma.CustomerAlertTypeCreateManyInput[] } = {
  data: [
    {
      customerId: TEST_COUNTRY_ID,
      alertTypeId: '1806b4b7-a7a0-42cc-92c6-30d5bcefa258',
      order: 0,
    },
    {
      alertTypeId: 'ebc298a9-fc21-46e5-aef5-fb7dcbb3b8b3',
      customerId: TEST_COUNTRY_ID,
      order: 1,
    },
    {
      alertTypeId: '89caacde-8bf0-4ff0-b548-55f4ce7f3b46',
      customerId: TEST_COUNTRY_ID,
      order: 2,
    },
    {
      alertTypeId: '076ab363-a50d-47a8-990c-d40b43723a0e',
      customerId: TEST_COUNTRY_ID,
      order: 3,
    },
    {
      alertTypeId: 'a753e6da-e426-447f-a06f-b11694bd770e',
      customerId: TEST_COUNTRY_ID,
      order: 4,
    },
    {
      alertTypeId: '519180b7-3004-4e24-822f-b753c22e4d77',
      customerId: TEST_COUNTRY_ID,
      order: 5,
    },
    {
      alertTypeId: '51a5424b-3956-41ca-8b5d-d0a15dcd5195',
      customerId: TEST_COUNTRY_ID,
      order: 6,
    },
    {
      alertTypeId: '2d85b343-d4cd-4e2b-9d62-20a9fe7a3cf5',
      customerId: TEST_COUNTRY_ID,
      order: 7,
    },
  ],
  async run(prisma: PrismaClient) {
    return prisma.customerAlertType.createMany({
      data: this.data,
      skipDuplicates: true,
    });
  },
};

export default model;
