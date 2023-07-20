import { PrismaClient, Prisma } from '@prisma/client';

export const middlewareNotifications = async (
  prisma: PrismaClient,
  params: Prisma.MiddlewareParams,
) => {
  if (params.action == 'create' && params.model == 'Notification') {
    const customerId =
      params.args.data?.customer?.connect?.id || params.args.data?.customerId;

    const customer = await prisma.customer.findUnique({
      where: {
        id: customerId,
      },
    });

    params.args.data.trialPeriod = customer?.trialPeriod || false;
  }
};
