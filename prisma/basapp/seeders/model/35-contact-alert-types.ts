import { Prisma, PrismaClient } from '@prisma/client';
import { Model } from '../seed';
import { contact, alertTypes } from '../utils/constants';

const { CONTACT_USER_1 } = contact;
const { ALERT_TYPE_VIOLATION, ALERT_TYPE_ALARM_ACT, ALERT_TYPE_FIRE } =
  alertTypes;

const model: Model & { data: Prisma.ContactAlertTypeCreateManyInput[] } = {
  data: [
    {
      alertTypeId: ALERT_TYPE_VIOLATION,
      contactId: CONTACT_USER_1,
    },
    {
      alertTypeId: ALERT_TYPE_ALARM_ACT,
      contactId: CONTACT_USER_1,
    },
    {
      alertTypeId: ALERT_TYPE_FIRE,
      contactId: CONTACT_USER_1,
    },
  ],
  async run(prisma: PrismaClient) {
    for (const user of this.data) {
      await prisma.contactAlertType.createMany({
        data: user,
      });
    }

    return true;
  },
};

export default model;
