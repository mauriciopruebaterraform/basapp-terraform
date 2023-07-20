import { PrismaClient } from '.prisma/client';
import { Model } from '../seed';
import { awsSmsId, smsId } from '../utils/constants';

const model: Model = {
  async run(prisma: PrismaClient) {
    return prisma.smsProvider.createMany({
      data: this.data,
    });
  },
  data: [
    {
      id: smsId,
      provider: 'smsmasivos',
    },
    {
      id: awsSmsId,
      provider: 'aws',
    },
  ],
};

export default model;
