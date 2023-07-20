import { Prisma, PrismaClient } from '@prisma/client';
import { Model } from '../seed';
import { reservationMode, reservationSpace } from '../utils/constants';

const {
  DOUBLE,
  SINGLE,
  SUM_MEETINGS,
  SOCCER_11,
  SOCCER_7,
  SIMULTANEOUS,
  MEETINGS,
  TOURNAMENT,
  PRACTICE_9_HOLES,
  RECREATIONAL,
} = reservationMode;
const {
  SUM_1_AFTERNOON,
  SUM_2_NIGHT,
  MATCH,
  MATCH_1,
  MATCH_2,
  MATCH_3,
  SOCCER_11: SOCCER_11_SPACE,
  SOCCER_7: SOCCER_7_SPACE,
  POOL,
  YARD,
  SIMULTANEOUS: SIMULTANEOUS_SPACE,
} = reservationSpace;

const model: Model & {
  data: Prisma.ReservationSpaceReservationModeCreateManyInput[];
} = {
  data: [
    {
      reservationModeId: DOUBLE,
      reservationSpaceId: MATCH_1,
    },
    {
      reservationModeId: DOUBLE,
      reservationSpaceId: MATCH_2,
    },
    {
      reservationModeId: DOUBLE,
      reservationSpaceId: MATCH_3,
    },
    {
      reservationModeId: SINGLE,
      reservationSpaceId: MATCH_1,
    },
    {
      reservationModeId: SINGLE,
      reservationSpaceId: MATCH_2,
    },
    {
      reservationModeId: SINGLE,
      reservationSpaceId: MATCH_3,
    },
    {
      reservationModeId: SUM_MEETINGS,
      reservationSpaceId: SUM_1_AFTERNOON,
    },
    {
      reservationModeId: SUM_MEETINGS,
      reservationSpaceId: SUM_2_NIGHT,
    },
    {
      reservationModeId: SOCCER_11,
      reservationSpaceId: SOCCER_11_SPACE,
    },
    {
      reservationModeId: SOCCER_7,
      reservationSpaceId: SOCCER_7_SPACE,
    },
    {
      reservationModeId: PRACTICE_9_HOLES,
      reservationSpaceId: MATCH,
    },
    {
      reservationModeId: SIMULTANEOUS,
      reservationSpaceId: SIMULTANEOUS_SPACE,
    },
    {
      reservationModeId: TOURNAMENT,
      reservationSpaceId: MATCH,
    },
    {
      reservationModeId: RECREATIONAL,
      reservationSpaceId: POOL,
    },
    {
      reservationModeId: MEETINGS,
      reservationSpaceId: YARD,
    },
  ],
  async run(prisma: PrismaClient) {
    return prisma.reservationSpaceReservationMode.createMany({
      data: this.data,
      skipDuplicates: true,
    });
  },
};

export default model;
