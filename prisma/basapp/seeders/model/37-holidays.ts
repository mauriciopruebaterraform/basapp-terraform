import { Prisma, PrismaClient } from '@prisma/client';
import { Model } from '../seed';
import { constants } from '../utils/constants';

const { TEST_COUNTRY_ID } = constants;

const model: Model & { data: Prisma.CustomerHolidaysCreateManyInput[] } = {
  data: [
    {
      date: new Date('2023-05-25 03:00:00'),
      customerId: TEST_COUNTRY_ID,
      createdAt: new Date('2022-11-10 17:28:03'),
      updatedAt: new Date('2022-11-10 17:28:03'),
    },
    {
      date: new Date('2023-01-01 03:00:00'),
      customerId: TEST_COUNTRY_ID,
      createdAt: new Date('2022-11-08 18:24:29'),
      updatedAt: new Date('2022-11-08 18:24:29'),
    },
    {
      date: new Date('2023-02-20 03:00:00'),
      customerId: TEST_COUNTRY_ID,
      createdAt: new Date('2022-11-10 17:25:09'),
      updatedAt: new Date('2022-11-10 17:25:09'),
    },
    {
      date: new Date('2023-02-21 03:00:00'),
      customerId: TEST_COUNTRY_ID,
      createdAt: new Date('2022-11-10 17:25:30'),
      updatedAt: new Date('2022-11-10 17:25:30'),
    },
    {
      date: new Date('2023-03-24 03:00:00'),
      customerId: TEST_COUNTRY_ID,
      createdAt: new Date('2022-11-10 17:26:12'),
      updatedAt: new Date('2022-11-10 17:26:12'),
    },
    {
      date: new Date('2023-04-02 03:00:00'),
      customerId: TEST_COUNTRY_ID,
      createdAt: new Date('2022-11-10 17:26:53'),
      updatedAt: new Date('2022-11-10 17:26:53'),
    },
    {
      date: new Date('2023-04-07 03:00:00'),
      customerId: TEST_COUNTRY_ID,
      createdAt: new Date('2022-11-10 17:27:18'),
      updatedAt: new Date('2022-11-10 17:27:18'),
    },
    {
      date: new Date('2023-05-01 03:00:00'),
      customerId: TEST_COUNTRY_ID,
      createdAt: new Date('2022-11-10 17:27:36'),
      updatedAt: new Date('2022-11-10 17:27:36'),
    },
    {
      date: new Date('2022-10-10 03:00:00'),
      customerId: TEST_COUNTRY_ID,
      createdAt: new Date('2022-09-18 18:22:36'),
      updatedAt: new Date('2022-09-18 18:22:36'),
    },
    {
      date: new Date('2023-06-20 03:00:00'),
      customerId: TEST_COUNTRY_ID,
      createdAt: new Date('2022-11-10 17:28:22'),
      updatedAt: new Date('2022-11-10 17:28:22'),
    },
    {
      date: new Date('2023-07-09 03:00:00'),
      customerId: TEST_COUNTRY_ID,
      createdAt: new Date('2022-11-10 17:28:40'),
      updatedAt: new Date('2022-11-10 17:28:40'),
    },
    {
      date: new Date('2023-12-08 03:00:00'),
      customerId: TEST_COUNTRY_ID,
      createdAt: new Date('2022-11-10 17:29:09'),
      updatedAt: new Date('2022-11-10 17:29:09'),
    },
    {
      date: new Date('2023-12-25 03:00:00'),
      customerId: TEST_COUNTRY_ID,
      createdAt: new Date('2022-11-10 17:29:27'),
      updatedAt: new Date('2022-11-10 17:29:27'),
    },
    {
      date: new Date('2023-08-21 03:00:00'),
      customerId: TEST_COUNTRY_ID,
      createdAt: new Date('2022-11-10 17:29:51'),
      updatedAt: new Date('2022-11-10 17:29:51'),
    },
    {
      date: new Date('2023-10-16 03:00:00'),
      customerId: TEST_COUNTRY_ID,
      createdAt: new Date('2022-11-10 17:30:21'),
      updatedAt: new Date('2022-11-10 17:30:21'),
    },
    {
      date: new Date('2023-11-20 03:00:00'),
      customerId: TEST_COUNTRY_ID,
      createdAt: new Date('2022-11-10 17:30:46'),
      updatedAt: new Date('2022-11-10 17:30:46'),
    },
    {
      date: new Date('2022-12-25 03:00:00'),
      customerId: TEST_COUNTRY_ID,
      createdAt: new Date('2022-09-18 18:23:59'),
      updatedAt: new Date('2022-09-18 18:23:59'),
    },
    {
      date: new Date('2022-12-09 03:00:00'),
      customerId: TEST_COUNTRY_ID,
      createdAt: new Date('2022-09-18 18:23:44'),
      updatedAt: new Date('2022-09-18 18:23:44'),
    },
    {
      date: new Date('2022-12-08 03:00:00'),
      customerId: TEST_COUNTRY_ID,
      createdAt: new Date('2022-09-18 18:23:35'),
      updatedAt: new Date('2022-09-18 18:23:35'),
    },
    {
      date: new Date('2022-11-20 03:00:00'),
      customerId: TEST_COUNTRY_ID,
      createdAt: new Date('2022-09-18 18:23:17'),
      updatedAt: new Date('2022-09-18 18:23:17'),
    },
    {
      date: new Date('2022-11-21 03:00:00'),
      customerId: TEST_COUNTRY_ID,
      createdAt: new Date('2022-09-18 18:22:55'),
      updatedAt: new Date('2022-09-18 18:22:55'),
    },
    {
      date: new Date('2022-10-07 03:00:00'),
      customerId: TEST_COUNTRY_ID,
      createdAt: new Date('2022-09-18 18:22:26'),
      updatedAt: new Date('2022-09-18 18:22:26'),
    },
  ],
  async run(prisma: PrismaClient) {
    return prisma.customerHolidays.createMany({
      data: this.data,
    });
  },
};

export default model;
