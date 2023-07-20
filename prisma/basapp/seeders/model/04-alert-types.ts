import { Prisma, PrismaClient } from '@prisma/client';
import { Model } from '../seed';

const model: Model & { data: Prisma.AlertTypeCreateInput[] } = {
  data: [
    {
      id: 'ebc298a9-fc21-46e5-aef5-fb7dcbb3b8b3',
      type: 'perimeter-violation',
      name: 'Violación de perímetro',
    },
    {
      id: '1806b4b7-a7a0-42cc-92c6-30d5bcefa258',
      type: 'alarm-activated',
      name: 'Alarma activada',
    },
    {
      id: '89caacde-8bf0-4ff0-b548-55f4ce7f3b46',
      type: 'fire',
      name: 'Incendio',
    },
    {
      id: '076ab363-a50d-47a8-990c-d40b43723a0e',
      type: 'arrived-well',
      name: 'Llegué bien',
    },
    {
      id: 'a753e6da-e426-447f-a06f-b11694bd770e',
      type: 'health-emergency',
      name: 'Emergencia de salud',
    },
    {
      id: '519180b7-3004-4e24-822f-b753c22e4d77',
      type: 'gender-violence',
      name: 'Violencia de género',
    },
    {
      id: '51a5424b-3956-41ca-8b5d-d0a15dcd5195',
      type: 'bad-company',
      name: 'Mala compañía',
    },
    {
      id: '2d85b343-d4cd-4e2b-9d62-20a9fe7a3cf5',
      type: 'robbery',
      name: 'Robo',
    },
    {
      id: 'bda1067e-8043-4ab6-82d9-9d437762be9c',
      type: 'panic',
      name: 'Antipánico',
    },
    {
      id: '3001d440-cc7d-4949-84f0-27cfe7f6e746',
      type: 'public-violence',
      name: 'Defensa civil',
    },
    {
      id: '0e9f58af-477c-4460-8b9a-cba61f27d62b',
      type: 'kidnapping',
      name: 'Secuestro',
    },
  ],
  async run(prisma: PrismaClient) {
    return prisma.alertType.createMany({
      data: this.data,
      skipDuplicates: true,
    });
  },
};

export default model;
