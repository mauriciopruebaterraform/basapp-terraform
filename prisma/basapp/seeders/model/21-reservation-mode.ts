import { Prisma, PrismaClient } from '@prisma/client';
import { Model } from '../seed';
import {
  constants,
  reservationType,
  reservationMode,
} from '../utils/constants';

const { TEST_COUNTRY_ID, USER_ADMIN_ID, SAN_FERNANDO_ID } = constants;
const { SUM, POOL, GOLF, TENNIS, SOCCER, YARD } = reservationType;
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
const model: Model & { data: Prisma.ReservationModeCreateManyInput[] } = {
  data: [
    {
      id: DOUBLE,
      name: 'Dobles',
      maxDuration: 90,
      maxPeople: 4,
      active: false,
      attachList: false,
      allowGuests: true,
      allParticipantsRequired: true,
      inactivityTime: 90,
      reservationTypeId: TENNIS,
      customerId: TEST_COUNTRY_ID,
      createdAt: new Date(),
      updatedAt: new Date(),
      maxPerMonth: null,
      email: null,
      updatedById: USER_ADMIN_ID,
    },
    {
      id: SINGLE,
      name: 'Singles',
      maxDuration: 60,
      maxPeople: 2,
      active: true,
      attachList: false,
      allowGuests: true,
      allParticipantsRequired: true,
      inactivityTime: 60,
      reservationTypeId: TENNIS,
      updatedById: USER_ADMIN_ID,
      customerId: TEST_COUNTRY_ID,
      createdAt: new Date(),
      updatedAt: new Date(),
      maxPerMonth: null,
      email: null,
    },
    {
      id: SUM_MEETINGS,
      name: 'SUM Reuniones',
      maxDuration: 240,
      maxPeople: 50,
      active: true,
      attachList: true,
      allowGuests: false,
      updatedById: USER_ADMIN_ID,
      allParticipantsRequired: false,
      inactivityTime: 1,
      reservationTypeId: SUM,
      customerId: SAN_FERNANDO_ID,
      createdAt: new Date(),
      updatedAt: new Date(),
      maxPerMonth: null,
      email: null,
    },
    {
      id: SOCCER_11,
      name: 'Partido 11',
      maxDuration: 120,
      maxPeople: 22,
      active: true,
      attachList: true,
      allowGuests: true,
      allParticipantsRequired: false,
      inactivityTime: 120,
      reservationTypeId: SOCCER,
      customerId: SAN_FERNANDO_ID,
      updatedById: USER_ADMIN_ID,
      createdAt: new Date(),
      updatedAt: new Date(),
      maxPerMonth: null,
      email: null,
    },
    {
      id: SOCCER_7,
      name: 'Partido 7',
      maxDuration: 90,
      maxPeople: 14,
      active: true,
      attachList: true,
      allowGuests: true,
      allParticipantsRequired: false,
      inactivityTime: 90,
      reservationTypeId: SOCCER,
      updatedById: USER_ADMIN_ID,
      customerId: SAN_FERNANDO_ID,
      createdAt: new Date(),
      updatedAt: new Date(),
      maxPerMonth: null,
      email: null,
    },
    {
      id: PRACTICE_9_HOLES,
      name: 'Practica 9 Hoyos',
      maxDuration: 12,
      updatedById: USER_ADMIN_ID,
      maxPeople: 4,
      active: true,
      attachList: false,
      allowGuests: true,
      allParticipantsRequired: false,
      inactivityTime: 120,
      reservationTypeId: GOLF,
      customerId: TEST_COUNTRY_ID,
      createdAt: new Date(),
      updatedAt: new Date(),
      maxPerMonth: null,
      email: null,
    },
    {
      id: SIMULTANEOUS,
      name: 'Simultana',
      maxDuration: 300,
      maxPeople: 50,
      active: true,
      attachList: false,
      allowGuests: true,
      allParticipantsRequired: false,
      inactivityTime: 300,
      reservationTypeId: GOLF,
      customerId: TEST_COUNTRY_ID,
      updatedById: USER_ADMIN_ID,
      createdAt: new Date(),
      updatedAt: new Date(),
      maxPerMonth: null,
      email: null,
    },
    {
      id: TOURNAMENT,
      name: 'Torneo',
      maxDuration: 12,
      maxPeople: 4,
      active: true,
      attachList: false,
      updatedById: USER_ADMIN_ID,
      allowGuests: true,
      allParticipantsRequired: false,
      inactivityTime: 240,
      reservationTypeId: GOLF,
      customerId: TEST_COUNTRY_ID,
      createdAt: new Date(),
      updatedAt: new Date(),
      maxPerMonth: null,
      email: null,
    },
    {
      id: RECREATIONAL,
      name: 'Recreativa',
      maxDuration: 45,
      maxPeople: 23,
      active: true,
      attachList: false,
      allowGuests: true,
      allParticipantsRequired: false,
      inactivityTime: 45,
      updatedById: USER_ADMIN_ID,
      reservationTypeId: POOL,
      customerId: SAN_FERNANDO_ID,
      createdAt: new Date(),
      updatedAt: new Date(),
      maxPerMonth: null,
      email: null,
    },
    {
      id: MEETINGS,
      name: 'Reuniones',
      maxDuration: 388,
      maxPeople: 50,
      active: true,
      attachList: true,
      allowGuests: false,
      allParticipantsRequired: false,
      inactivityTime: 0,
      updatedById: USER_ADMIN_ID,
      reservationTypeId: YARD,
      customerId: TEST_COUNTRY_ID,
      createdAt: new Date(),
      updatedAt: new Date(),
      maxPerMonth: null,
      email: null,
    },
  ],
  async run(prisma: PrismaClient) {
    return prisma.reservationMode.createMany({
      data: this.data,
      skipDuplicates: true,
    });
  },
};

export default model;
