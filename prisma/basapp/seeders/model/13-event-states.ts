import { Prisma, PrismaClient } from '@prisma/client';
import { Model } from '../seed';
import { constants, eventState } from '../utils/constants';

const { TEST_COUNTRY_ID } = constants;
const { CANCEL } = eventState;

const model: Model & { data: Prisma.EventStateCreateManyInput[] } = {
  data: [
    {
      id: eventState.EMITIDO,
      name: 'Emitido',
    },
    {
      id: eventState.ATENDIDO,
      name: 'Atendido',
      active: false,
    },
    {
      id: CANCEL,
      name: 'Cancelado',
      active: true,
    },
    {
      id: eventState.VENCIDO,
      name: 'Vencido',
      customerId: TEST_COUNTRY_ID,
    },
    {
      id: eventState.USUARIO_CANCELO,
      name: 'Usuario canceló',
    },
    {
      id: eventState.RECHAZADO,
      name: 'Rechazado',
    },
    {
      id: eventState.A_CONFIRMAR,
      name: 'A confirmar',
    },
  ],
  async run(prisma: PrismaClient) {
    return prisma.eventState.createMany({
      data: this.data,
      skipDuplicates: true,
    });
  },
};

export default model;
