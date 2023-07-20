import { Prisma, PrismaClient } from '@prisma/client';
import { Model } from '../seed';
import { constants } from '../utils/constants';

const { USER_ADMIN_ID, TEST_COUNTRY_ID, SAN_FERNANDO_ID } = constants;

const model: Model & { data: Prisma.CameraCreateManyInput[] } = {
  data: [
    {
      code: 'SI100',
      updatedById: USER_ADMIN_ID,
      geolocation: {
        lat: '-34.473163',
        lng: '-58.513503',
      },
      active: false,
      description: 'Av Centenario y Terrero',
      customerId: TEST_COUNTRY_ID,
      createdAt: new Date('2020-09-18 19:55:54'),
    },
    {
      code: 'SI110',
      geolocation: {
        lat: '-34.474189',
        lng: '-58.512569',
      },
      description: 'Av. Centenerio y Roque Saenz Peña',
      updatedById: USER_ADMIN_ID,
      active: false,
      customerId: SAN_FERNANDO_ID,
      createdAt: new Date('2020-09-18 19:57:25'),
    },
    {
      code: 'SI200',
      geolocation: {
        lat: '-34.47251',
        lng: '-58.514526',
      },
      description: 'Alarma Vecinal - Centenerio y Laprida',
      customerId: TEST_COUNTRY_ID,
      updatedById: USER_ADMIN_ID,
      createdAt: new Date('2020-09-21 11:44:55'),
    },
    {
      code: 'SI120',
      geolocation: {
        lat: '-34.467108',
        lng: '-58.509886',
      },
      updatedById: USER_ADMIN_ID,
      description: '9 de Julio y Libertador',
      customerId: SAN_FERNANDO_ID,
      createdAt: new Date('2020-09-27 23:42:23'),
    },
  ],
  async run(prisma: PrismaClient) {
    return prisma.camera.createMany({
      data: this.data,
      skipDuplicates: true,
    });
  },
};

export default model;
