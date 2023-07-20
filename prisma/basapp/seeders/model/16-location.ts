import { Prisma, PrismaClient } from '@prisma/client';
import { Model } from '../seed';
import { constants } from '../utils/constants';

const { USER_ADMIN_ID, TEST_COUNTRY_ID, SAN_FERNANDO_ID } = constants;

const model: Model & { data: Prisma.LocationCreateManyInput[] } = {
  data: [
    {
      id: 'ed7bcef1-eb11-4f09-91d8-17ff3cbd7a32',
      name: 'Béccar',
      type: 'locality',
      createdAt: new Date('2020-09-18 19:50:30'),
      updatedById: USER_ADMIN_ID,
      customerId: TEST_COUNTRY_ID,
    },
    {
      id: 'd2e0b293-663e-4936-a92d-a4a733e5ebc9',
      name: 'San Isidro',
      type: 'locality',
      active: false,
      createdAt: new Date('2020-09-18 19:50:40'),
      updatedById: USER_ADMIN_ID,
      customerId: TEST_COUNTRY_ID,
    },
    {
      id: '7d75761e-4844-416f-a8a2-3eee28b69208',
      name: 'Boulogne',
      type: 'locality',
      createdAt: new Date('2020-09-18 19:51:02'),
      updatedById: USER_ADMIN_ID,
      customerId: TEST_COUNTRY_ID,
    },
    {
      id: '7f1a6b46-da14-4146-a58b-3e66118af39a',
      name: 'Villa Adelina',
      type: 'locality',
      createdAt: new Date('2020-09-18 19:51:17'),
      updatedById: USER_ADMIN_ID,
      customerId: SAN_FERNANDO_ID,
    },
    {
      id: 'e2a0ef7a-0305-4473-b5ec-0db8931067a8',
      name: 'Acassuso',
      type: 'locality',
      createdAt: new Date('2020-09-18 19:51:46'),
      updatedById: USER_ADMIN_ID,
      customerId: SAN_FERNANDO_ID,
    },
    {
      id: '3142a017-2170-49c9-83f5-4442c3504f5c',
      name: 'Martínez',
      type: 'locality',
      createdAt: new Date('2020-09-18 19:51:59'),
      updatedById: USER_ADMIN_ID,
      customerId: SAN_FERNANDO_ID,
    },
  ],
  async run(prisma: PrismaClient) {
    return prisma.location.createMany({
      data: this.data,
      skipDuplicates: true,
    });
  },
};

export default model;
