import { Prisma, PrismaClient } from '@prisma/client';
import { Model } from '../seed';
import { authorizedUser, reservationType } from '../utils/constants';

const { AUTHORIZED_USER_FERNANDO, AUTHORIZED_USER_MAURICIO } = authorizedUser;
const { TENNIS, GOLF, YARD } = reservationType;

const model: Model & {
  data: Prisma.AuthorizedUserReservationTypeCreateManyInput[];
} = {
  data: [
    {
      reservationTypeId: TENNIS,
      authorizedUserId: AUTHORIZED_USER_FERNANDO,
    },
    {
      reservationTypeId: GOLF,
      authorizedUserId: AUTHORIZED_USER_MAURICIO,
    },
    {
      reservationTypeId: YARD,
      authorizedUserId: AUTHORIZED_USER_MAURICIO,
    },
    {
      reservationTypeId: TENNIS,
      authorizedUserId: AUTHORIZED_USER_MAURICIO,
    },
  ],
  async run(prisma: PrismaClient) {
    return prisma.authorizedUserReservationType.createMany({
      data: this.data,
      skipDuplicates: true,
    });
  },
};

export default model;
