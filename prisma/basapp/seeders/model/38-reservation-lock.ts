import { Prisma, PrismaClient } from '@prisma/client';
import { Model } from '../seed';
import {
  constants,
  reservationSpace,
  reservationType,
} from '../utils/constants';

const { TEST_COUNTRY_ID } = constants;
const { GOLF, TENNIS, YARD } = reservationType;
const { MATCH_2, YARD: YARD_SPACE, SIMULTANEOUS } = reservationSpace;

const model: Model & { data: Prisma.ReservationLockCreateManyInput[] } = {
  data: [
    {
      name: 'COLONIA',
      ignoreIfHoliday: false,
      date: new Date('2023-02-01 03:00:00'),
      wed: [
        {
          from: '14:00',
          to: '19:00',
        },
      ],
      customerId: TEST_COUNTRY_ID,
      reservationSpaceId: YARD_SPACE,
      reservationTypeId: YARD,
      createdAt: new Date('2022-12-20 15:28:59'),
      updatedAt: new Date('2022-12-20 15:28:59'),
    },
    {
      name: 'COLONIA',
      ignoreIfHoliday: false,
      date: new Date('2023-02-06 03:00:00'),
      mon: [
        {
          from: '14:00',
          to: '19:00',
        },
      ],
      customerId: TEST_COUNTRY_ID,
      reservationSpaceId: YARD_SPACE,
      reservationTypeId: YARD,
      createdAt: new Date('2022-12-20 15:30:26'),
      updatedAt: new Date('2022-12-20 15:30:26'),
    },
    {
      name: 'COLONIA',
      ignoreIfHoliday: false,
      date: new Date('2023-02-07 03:00:00'),
      tue: [
        {
          from: '14:00',
          to: '19:00',
        },
      ],
      customerId: TEST_COUNTRY_ID,
      reservationSpaceId: YARD_SPACE,
      reservationTypeId: YARD,
      createdAt: new Date('2022-12-20 15:30:53'),
      updatedAt: new Date('2022-12-20 15:30:53'),
    },
    {
      name: 'COLONIA',
      ignoreIfHoliday: false,
      date: new Date('2023-02-08 03:00:00'),
      wed: [
        {
          from: '14:00',
          to: '19:00',
        },
      ],
      customerId: TEST_COUNTRY_ID,
      reservationSpaceId: MATCH_2,
      reservationTypeId: TENNIS, // ID de Tipo de Reserva Futbol

      createdAt: new Date('2022-12-20 15:31:40'),
      updatedAt: new Date('2022-12-20 15:31:40'),
    },
    {
      name: 'COLONIA',
      ignoreIfHoliday: false,
      date: new Date('2023-02-09 03:00:00'),
      thu: [
        {
          from: '14:00',
          to: '19:00',
        },
      ],
      customerId: TEST_COUNTRY_ID,
      reservationSpaceId: MATCH_2,
      reservationTypeId: TENNIS, // ID de Tipo de Reserva Futbol

      createdAt: new Date('2022-12-20 15:32:05'),
      updatedAt: new Date('2022-12-20 15:32:05'),
    },
    {
      name: 'Reparacion',
      ignoreIfHoliday: false,
      date: new Date('2022-12-24 03:00:00'),
      holidayEve: [
        {
          from: '08:00',
          to: '09:00',
        },
        {
          from: '09:00',
          to: '10:00',
        },
        {
          from: '10:00',
          to: '11:00',
        },
        {
          from: '11:00',
          to: '12:00',
        },
        {
          from: '12:00',
          to: '13:00',
        },
        {
          from: '13:00',
          to: '14:00',
        },
        {
          from: '14:00',
          to: '15:00',
        },
        {
          from: '15:00',
          to: '16:00',
        },
        {
          from: '16:00',
          to: '17:00',
        },
        {
          from: '17:00',
          to: '18:00',
        },
        {
          from: '18:00',
          to: '19:00',
        },
        {
          from: '19:00',
          to: '20:00',
        },
        {
          from: '20:00',
          to: '21:00',
        },
        {
          from: '21:00',
          to: '22:00',
        },
      ],
      customerId: TEST_COUNTRY_ID,
      reservationSpaceId: SIMULTANEOUS,
      reservationTypeId: GOLF,
      createdAt: new Date('2022-12-24 14:15:35'),
      updatedAt: new Date('2022-12-24 14:15:35'),
    },
    {
      name: 'Reparacion',
      ignoreIfHoliday: false,
      date: new Date('2022-12-24 03:00:00'),
      holidayEve: [
        {
          from: '08:00',
          to: '09:00',
        },
        {
          from: '09:00',
          to: '10:00',
        },
        {
          from: '10:00',
          to: '11:00',
        },
        {
          from: '11:00',
          to: '12:00',
        },
        {
          from: '12:00',
          to: '13:00',
        },
        {
          from: '13:00',
          to: '14:00',
        },
        {
          from: '14:00',
          to: '15:00',
        },
        {
          from: '15:00',
          to: '16:00',
        },
        {
          from: '16:00',
          to: '17:00',
        },
        {
          from: '17:00',
          to: '18:00',
        },
        {
          from: '18:00',
          to: '19:00',
        },
        {
          from: '19:00',
          to: '20:00',
        },
        {
          from: '20:00',
          to: '21:00',
        },
        {
          from: '21:00',
          to: '22:00',
        },
      ],
      customerId: TEST_COUNTRY_ID,
      reservationSpaceId: SIMULTANEOUS,
      reservationTypeId: GOLF,
      createdAt: new Date('2022-12-24 14:16:14'),
      updatedAt: new Date('2022-12-24 14:16:14'),
    },
    {
      name: 'Reparacion',
      ignoreIfHoliday: false,
      date: new Date('2022-12-24 03:00:00'),
      holidayEve: [
        {
          from: '08:00',
          to: '09:00',
        },
        {
          from: '09:00',
          to: '10:00',
        },
        {
          from: '10:00',
          to: '11:00',
        },
        {
          from: '11:00',
          to: '12:00',
        },
        {
          from: '12:00',
          to: '13:00',
        },
        {
          from: '13:00',
          to: '14:00',
        },
        {
          from: '14:00',
          to: '15:00',
        },
        {
          from: '15:00',
          to: '16:00',
        },
        {
          from: '16:00',
          to: '17:00',
        },
        {
          from: '17:00',
          to: '18:00',
        },
        {
          from: '18:00',
          to: '19:00',
        },
        {
          from: '19:00',
          to: '20:00',
        },
        {
          from: '20:00',
          to: '21:00',
        },
        {
          from: '21:00',
          to: '22:00',
        },
      ],
      customerId: TEST_COUNTRY_ID,
      reservationSpaceId: MATCH_2,
      reservationTypeId: TENNIS,
      createdAt: new Date('2022-12-24 14:16:44'),
      updatedAt: new Date('2022-12-24 14:16:44'),
    },
  ],
  async run(prisma: PrismaClient) {
    return prisma.reservationLock.createMany({
      data: this.data,
    });
  },
};

export default model;
