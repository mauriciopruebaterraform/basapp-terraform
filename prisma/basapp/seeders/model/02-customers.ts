import { CustomerType, Prisma, PrismaClient } from '@prisma/client';
import { Model } from '../seed';
import { constants } from '../utils/constants';

const { USER_ADMIN_ID, SAN_FERNANDO_ID, TEST_COUNTRY_ID, BOLIVAR_ID } =
  constants;

const model: Model & { data: Prisma.CustomerCreateManyInput[] } = {
  data: [
    {
      id: TEST_COUNTRY_ID,
      name: 'Test Country',
      type: CustomerType.business,
      active: true,
      district: 'San Fernando',
      state: 'Buenos Aires',
      country: 'Argentina',
      secretKey: '1234567',
      trialPeriod: false,
      countryCode: '54',
      phoneLength: 10,
      url: 'test-country',
      speed: '20',
      notes: 'Respete las señales de transito y estacionamiento. Evite multas',
      timezone: '-180',
      image: {
        name: '4053ee9a-401c-4cb0-8f0a-4a9ef4811e21.png',
        url: 'https://s3.amazonaws.com/uploads.countries.basapp.com.ar/customers/image/4053ee9a-401c-4cb0-8f0a-4a9ef4811e21.png',
        thumbnailUrl:
          'https://s3.amazonaws.com/uploads.countries.basapp.com.ar/customers/image/4053ee9a-401c-4cb0-8f0a-4a9ef4811e21-thumbnail.png',
      },
      createdAt: new Date('2021-11-05 09:57:34.726'),
      updatedAt: new Date('2021-11-05 09:57:34.726'),
      updatedById: USER_ADMIN_ID,
    },
    {
      id: SAN_FERNANDO_ID,
      name: 'San Fernando',
      type: CustomerType.government,
      active: true,
      district: 'San Fernando',
      state: 'Buenos Aires',
      country: 'Argentina',
      secretKey: '12345678',
      trialPeriod: false,
      countryCode: '54',
      phoneLength: 10,
      url: 'test-country',
      speed: '20',
      notes: 'Respete las señales de transito y estacionamiento. Evite multas',
      timezone: '-180',
      image: {
        name: '4053ee9a-401c-4cb0-8f0a-4a9ef4811e21.png',
        url: 'https://s3.amazonaws.com/uploads.countries.basapp.com.ar/customers/image/4053ee9a-401c-4cb0-8f0a-4a9ef4811e21.png',
        thumbnailUrl:
          'https://s3.amazonaws.com/uploads.countries.basapp.com.ar/customers/image/4053ee9a-401c-4cb0-8f0a-4a9ef4811e21-thumbnail.png',
      },
      createdAt: new Date('2021-11-05 09:57:34.726'),
      updatedAt: new Date('2021-11-05 09:57:34.726'),
      updatedById: USER_ADMIN_ID,
    },
    {
      id: BOLIVAR_ID,
      name: 'Bolivar',
      type: CustomerType.government,
      active: false,
      district: 'San Fernando',
      state: 'Buenos Aires',
      country: 'Argentina',
      secretKey: '24685912',
      trialPeriod: false,
      countryCode: '54',
      phoneLength: 10,
      url: 'test-country.com',
      speed: '20',
      notes: 'Respete las señales de transito y estacionamiento. Evite multas',
      timezone: '-180',
      image: {
        name: '4053ee9a-401c-4cb0-8f0a-4a9ef4811e21.png',
        url: 'https://s3.amazonaws.com/uploads.countries.basapp.com.ar/customers/image/4053ee9a-401c-4cb0-8f0a-4a9ef4811e21.png',
        thumbnailUrl:
          'https://s3.amazonaws.com/uploads.countries.basapp.com.ar/customers/image/4053ee9a-401c-4cb0-8f0a-4a9ef4811e21-thumbnail.png',
      },
      createdAt: new Date('2021-11-05 09:57:34.726'),
      updatedAt: new Date('2021-11-05 09:57:34.726'),
      updatedById: USER_ADMIN_ID,
    },
    {
      id: 'cecb27ae-b082-4f09-aea6-4e96a6ef61ca',
      name: 'varsovia',
      type: CustomerType.business,
      district: 'San Fernando',
      state: 'Buenos Aires',
      country: 'Argentina',
      secretKey: '1166480626',
      trialPeriod: false,
      countryCode: '54',
      phoneLength: 10,
      parentId: TEST_COUNTRY_ID,
      url: 'test-country.com',
      speed: '20',
      notes: 'Respete las señales de transito y estacionamiento. Evite multas',
      timezone: '-180',
      createdAt: new Date('2021-11-05 09:57:34.726'),
      updatedAt: new Date('2021-11-05 09:57:34.726'),
      updatedById: USER_ADMIN_ID,
    },
  ],
  async run(prisma: PrismaClient) {
    return prisma.customer.createMany({
      data: this.data,
      skipDuplicates: true,
    });
  },
};

export default model;
