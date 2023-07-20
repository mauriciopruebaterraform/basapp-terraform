import { Prisma, PrismaClient } from '@prisma/client';
import { Model } from '../seed';
import { constants, eventType } from '../utils/constants';

const { MONITOR } = constants;
const { LIST_VISITORS } = eventType;

const model: Model & { data: Prisma.UserUpdateInput[] } = {
  data: [
    {
      userPermissions: {
        update: {
          requestAuthorization: true,
          authorizationEventTypeId: LIST_VISITORS,
          monitoringAlertTypes: {
            connect: [
              {
                id: 'ebc298a9-fc21-46e5-aef5-fb7dcbb3b8b3',
              },
              {
                id: '1806b4b7-a7a0-42cc-92c6-30d5bcefa258',
              },
              {
                id: '89caacde-8bf0-4ff0-b548-55f4ce7f3b46',
              },
              {
                id: '076ab363-a50d-47a8-990c-d40b43723a0e',
              },
              {
                id: 'a753e6da-e426-447f-a06f-b11694bd770e',
              },
              {
                id: '519180b7-3004-4e24-822f-b753c22e4d77',
              },
              {
                id: '51a5424b-3956-41ca-8b5d-d0a15dcd5195',
              },
              {
                id: '2d85b343-d4cd-4e2b-9d62-20a9fe7a3cf5',
              },
            ],
          },
        },
      },
    },
  ],
  async run(prisma: PrismaClient) {
    for (const user of this.data) {
      await prisma.user.update({
        data: user,
        where: {
          id: MONITOR,
        },
      });
    }

    return true;
  },
};

export default model;
