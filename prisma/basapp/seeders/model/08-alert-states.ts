import { Prisma, PrismaClient } from '@prisma/client';
import { constants } from '../utils/constants';
import { Model } from '../seed';

const { SAN_FERNANDO_ID, TEST_COUNTRY_ID } = constants;

const model: Model & { data: Prisma.AlertStateCreateInput[] } = {
  data: [
    {
      id: '674a171f-2180-4072-baa9-f8ad95325d2d',
      name: 'Alarma Vecinal',
      active: true,
      customerId: null,
    },
    {
      id: '353a7a25-1888-4cc9-a325-ba7592f8d227',
      name: 'Derivada 911',
      active: true,
      customerId: null,
    },
    {
      id: '5e73c4cc-fd08-45c9-b904-9734558e1d56',
      name: 'Falsa',
      active: true,
      customerId: null,
    },
    {
      id: '83b38481-13f6-4dd6-87a0-d7acc5570ca6',
      name: 'Bomberos',
      active: true,
      customerId: null,
    },
    {
      id: '85d18800-18e0-41e3-bf2f-4c624382fd3d',
      name: 'Emitida',
      active: true,
      customerId: null,
    },
    {
      id: 'aced3f75-3e23-4cea-a6dd-841895b33518',
      name: 'Ambulancia',
      active: true,
      customerId: null,
    },
    {
      id: 'd4117749-aede-4a81-a752-6f0602cf13b7',
      name: 'Fin de tracking',
      active: true,
      customerId: null,
    },
    {
      id: '157bdb1d-3719-43ec-8919-ccffd7dd0b9b',
      name: 'Derivada al 911',
      active: false,
      customerId: SAN_FERNANDO_ID,
    },
    {
      id: '879b2fde-938f-40b9-9f53-9b48255ed3a0',
      name: 'Atendida',
      active: true,
      customerId: TEST_COUNTRY_ID,
    },
  ],
  async run(prisma: PrismaClient) {
    return prisma.alertState.createMany({
      data: this.data,
      skipDuplicates: true,
    });
  },
};

export default model;
