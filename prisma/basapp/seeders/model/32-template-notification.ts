import { Prisma, PrismaClient } from '@prisma/client';
import { Model } from '../seed';

const model: Model & { data: Prisma.NotificationTemplateCreateManyInput[] } = {
  data: [
    {
      title: 'Alerta',
      description:
        'SE PROCEDERÁ CON LA APERTURA DEL PUENTE POR EGRESO DE EMBARCACIÓN',
      customerId: 'a7e63a98-bcdf-4c9d-8041-8d82e2b9e8a1',
    },
  ],
  async run(prisma: PrismaClient) {
    for (const user of this.data) {
      await prisma.notificationTemplate.createMany({
        data: user,
      });
    }

    return true;
  },
};

export default model;
