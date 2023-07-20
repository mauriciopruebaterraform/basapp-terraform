import { Prisma, PrismaClient } from '@prisma/client';
import { Model } from '../seed';
import { constants } from '../utils/constants';

const { USER_ADMIN_ID, TEST_COUNTRY_ID } = constants;

const model: Model & { data: Prisma.ProtocolCreateManyInput[] } = {
  data: [
    {
      id: 'ed7bcef1-eb11-4f09-91d8-17ff3cbd7a32',
      code: 'AA0001',
      title: 'Incendio',
      customerId: TEST_COUNTRY_ID,
      updatedById: USER_ADMIN_ID,
      createdAt: new Date('2020-09-18 19:50:30'),
      attachment: {
        url: 'https://s3.amazonaws.com/uploads.countries.basapp.com.ar/customers/image/4053ee9a-401c-4cb0-8f0a-4a9ef4811e21.png',
        name: '4053ee9a-401c-4cb0-8f0a-4a9ef4811e21.png',
        thumbnailUrl:
          'https://s3.amazonaws.com/uploads.countries.basapp.com.ar/customers/image/4053ee9a-401c-4cb0-8f0a-4a9ef4811e21-thumbnail.png',
      },
    },
    {
      id: '47e3452d-b59f-4210-b0ec-ac638546daa8',
      code: 'AA0003',
      title: 'Robo',
      active: false,
      customerId: TEST_COUNTRY_ID,
      updatedById: USER_ADMIN_ID,
      createdAt: new Date('2020-09-18 19:50:30'),
      attachment: {
        url: 'https://s3.amazonaws.com/uploads.countries.basapp.com.ar/customers/image/4053ee9a-401c-4cb0-8f0a-4a9ef4811e21.png',
        name: '4053ee9a-401c-4cb0-8f0a-4a9ef4811e21.png',
        thumbnailUrl:
          'https://s3.amazonaws.com/uploads.countries.basapp.com.ar/customers/image/4053ee9a-401c-4cb0-8f0a-4a9ef4811e21-thumbnail.png',
      },
    },
    {
      id: 'a6772e6e-d2f2-47ef-a73a-bcf0d687a602',
      code: 'AA0002',
      title: 'Violancion de genero',
      customerId: TEST_COUNTRY_ID,
      updatedById: USER_ADMIN_ID,
      createdAt: new Date('2020-09-18 19:50:30'),
      attachment: {
        url: 'https://s3.amazonaws.com/uploads.countries.basapp.com.ar/customers/image/4053ee9a-401c-4cb0-8f0a-4a9ef4811e21.png',
        name: '4053ee9a-401c-4cb0-8f0a-4a9ef4811e21.png',
        thumbnailUrl:
          'https://s3.amazonaws.com/uploads.countries.basapp.com.ar/customers/image/4053ee9a-401c-4cb0-8f0a-4a9ef4811e21-thumbnail.png',
      },
    },
  ],
  async run(prisma: PrismaClient) {
    return prisma.protocol.createMany({
      data: this.data,
      skipDuplicates: true,
    });
  },
};

export default model;
