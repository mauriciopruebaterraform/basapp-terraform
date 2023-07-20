import { Prisma, PrismaClient } from '@prisma/client';
import { Model } from '../seed';
import { constants } from '../utils/constants';

const { TEST_COUNTRY_ID } = constants;

const model: Model & { data: Prisma.NotificationCreateInput[] } = {
  data: [
    {
      title: 'Ud. tiene una visita esperando en la guardia',
      description:
        'PEDIDOS YA se encuentra esperando en la Guardia. Por favor ingrese a Basapp CyB para autorizarlo.',
      createdAt: new Date('2021-12-04 20:00:32'),
      toUsers: {
        createMany: {
          data: [
            {
              userId: '3150178e-5c69-481e-bb2d-f481292fed10',
            },
          ],
        },
      },
      user: {
        connect: {
          id: '126d14a6-6a1f-46f7-a798-a45016848c90',
        },
      },
      customer: {
        connect: {
          id: TEST_COUNTRY_ID,
        },
      },
      emergency: false,
      fromLot: null,
      toLot: null,
      authorizationRequest: {
        connect: { id: '409bca88-7b87-45c3-b00e-b77596211816' },
      },
      notificationType: 'authorization',
    },
    {
      title: 'Ud. tiene una visita esperando en la guardia',
      description:
        'Plorutti Bautista se encuentra esperando en la Guardia. Por favor ingrese a Basapp CyB para autorizarlo.',
      createdAt: new Date('2021-12-16 00:38:14'),
      toUsers: {
        createMany: {
          data: [
            {
              userId: '3150178e-5c69-481e-bb2d-f481292fed10',
            },
          ],
        },
      },
      user: {
        connect: {
          id: '126d14a6-6a1f-46f7-a798-a45016848c90',
        },
      },
      customer: {
        connect: {
          id: TEST_COUNTRY_ID,
        },
      },
      emergency: false,
      fromLot: null,
      toLot: null,
      authorizationRequest: {
        connect: { id: '409bca88-7b87-45c3-b00e-b77596211816' },
      },
      notificationType: 'authorization',
    },
    {
      title: 'Ud. tiene una visita esperando en la guardia',
      description:
        'NELIDA DIAZ se encuentra esperando en la Guardia. Por favor ingrese a Basapp CyB para autorizarlo.',
      createdAt: new Date('2021-12-17 11:11:05'),
      toUsers: {
        createMany: {
          data: [
            {
              userId: 'a4b43596-aa0b-4595-ae68-43bca7b39163',
            },
          ],
        },
      },
      user: {
        connect: {
          id: '126d14a6-6a1f-46f7-a798-a45016848c90',
        },
      },
      customer: {
        connect: {
          id: TEST_COUNTRY_ID,
        },
      },
      emergency: false,
      fromLot: null,
      toLot: null,
      authorizationRequest: {
        connect: { id: '409bca88-7b87-45c3-b00e-b77596211816' },
      },
      notificationType: 'authorization',
    },
    {
      title: 'Usuario desactivado',
      description:
        'Fuiste dado de baja para enviar alertas. Contactate con tu administrador de country o barrio para más información',
      createdAt: new Date('2022-03-27 11:32:34'),
      user: {
        connect: {
          id: '126d14a6-6a1f-46f7-a798-a45016848c90',
        },
      },
      toUsers: {
        createMany: {
          data: [
            {
              userId: 'a4b43596-aa0b-4595-ae68-43bca7b39163',
            },
          ],
        },
      },
      customer: {
        connect: {
          id: TEST_COUNTRY_ID,
        },
      },
      emergency: false,
      fromLot: null,
      toLot: null,
      notificationType: 'user',
    },
  ],
  async run(prisma: PrismaClient) {
    for (const user of this.data) {
      await prisma.notification.create({
        data: user,
      });
    }

    return true;
  },
};

export default model;
