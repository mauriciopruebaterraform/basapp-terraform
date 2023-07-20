import { Prisma, PrismaClient } from '@prisma/client';
import { Model } from '../seed';
import { constants, reservationType } from '../utils/constants';

const { SAN_FERNANDO_ID, TEST_COUNTRY_ID } = constants;
const { SUM, POOL, GOLF, TENNIS, SOCCER, YARD } = reservationType;

const model: Model & { data: Prisma.ReservationTypeCreateManyInput[] } = {
  data: [
    {
      id: TENNIS,
      code: 'Tenis',
      days: 1,
      display: 'day',
      groupCode: 'TE',
      numberOfPending: 2,
      customerId: TEST_COUNTRY_ID,
      createdAt: new Date('2021-02-01 13:27:10'),
      updatedAt: new Date('2021-09-04 15:21:14'),
      minDays: 0,
      maxPerMonth: null,
      minDaysBetweenReservation: null,
    },
    {
      id: SOCCER,
      code: 'Futbol',
      days: 1,
      display: 'day',
      groupCode: 'FU',
      numberOfPending: 0,
      customerId: SAN_FERNANDO_ID,
      createdAt: new Date('2021-02-01 13:27:28'),
      updatedAt: new Date('2021-02-01 13:27:28'),
      minDays: 0,
      maxPerMonth: null,
      minDaysBetweenReservation: null,
    },
    {
      id: GOLF,
      code: 'Golf',
      days: 5,
      display: 'day',
      groupCode: 'GO',
      numberOfPending: 5,
      customerId: TEST_COUNTRY_ID,
      createdAt: new Date('2021-02-01 13:27:48'),
      updatedAt: new Date('2021-02-01 13:27:48'),
      minDays: 0,
      maxPerMonth: null,
      minDaysBetweenReservation: null,
    },
    {
      id: POOL,
      code: 'Pileta',
      days: 1,
      display: 'day',
      groupCode: 'PI',
      numberOfPending: 0,
      customerId: SAN_FERNANDO_ID,
      createdAt: new Date('2021-02-01 13:28:18'),
      updatedAt: new Date('2021-02-01 13:28:18'),
      minDays: 0,
      maxPerMonth: null,
      minDaysBetweenReservation: null,
    },
    {
      id: YARD,
      code: 'Quincho',
      days: 45,
      display: 'month',
      groupCode: 'QU',
      numberOfPending: 0,
      customerId: TEST_COUNTRY_ID,
      createdAt: new Date('2021-02-01 13:28:49'),
      updatedAt: new Date('2021-02-01 13:28:49'),
      minDays: 0,
      maxPerMonth: null,
      minDaysBetweenReservation: null,
    },
    {
      id: SUM,
      code: 'SUM',
      days: 30,
      display: 'month',
      groupCode: 'SU',
      numberOfPending: 0,
      customerId: SAN_FERNANDO_ID,
      createdAt: new Date('2021-02-01 13:29:12'),
      updatedAt: new Date('2021-02-01 13:29:12'),
      minDays: 0,
      maxPerMonth: null,
      minDaysBetweenReservation: null,
    },
  ],
  async run(prisma: PrismaClient) {
    return prisma.reservationType.createMany({
      data: this.data,
      skipDuplicates: true,
    });
  },
};

export default model;
