import { Prisma, PrismaClient } from '@prisma/client';
import { Model } from '../seed';
import { finalUser, contact } from '../utils/constants';

const {
  FINAL_USER_FERNANDO,
  FINAL_USER_NERINA,
  FINAL_USER_MAURICIO,
  FINAL_USER_SAN_FERNANDO,
} = finalUser;
const { CONTACT_USER_1 } = contact;

const model: Model & { data: Prisma.ContactCreateManyInput[] } = {
  data: [
    {
      id: CONTACT_USER_1,
      phoneNumber: '541166480626',
      userId: FINAL_USER_NERINA,
      contactUserId: FINAL_USER_FERNANDO,
      deviceContact: {
        id: '28',
        rawId: '36',
        displayName: 'Fer Bello',
        name: { familyName: 'Bello', givenName: 'Fer', formatted: 'Fer Bello' },
        nickname: null,
        phoneNumbers: [
          { id: '276', pref: false, value: '+5491150281459', type: 'other' },
        ],
        emails: null,
        addresses: null,
        ims: null,
        organizations: null,
        birthday: null,
        note: '',
        photos: null,
        categories: null,
        urls: null,
      },
    },
    {
      userId: FINAL_USER_SAN_FERNANDO,
      contactUserId: FINAL_USER_NERINA,
      phoneNumber: '541123199052',
      deviceContact: {
        id: '28',
        rawId: '36',
        displayName: 'Nerina Serra',
        name: {
          familyName: 'Serra',
          givenName: 'Nerina',
          formatted: 'Nerina Serra',
        },
        nickname: null,
        phoneNumbers: [
          { id: '276', pref: false, value: '+541123199052', type: 'other' },
        ],
        emails: null,
        addresses: null,
        ims: null,
        organizations: null,
        birthday: null,
        note: '',
        photos: null,
        categories: null,
        urls: null,
      },
    },
    {
      userId: FINAL_USER_MAURICIO,
      contactUserId: FINAL_USER_FERNANDO,
      phoneNumber: '5491150281459',
      deviceContact: {
        id: '28',
        rawId: '36',
        displayName: 'Fer Bello',
        name: {
          familyName: 'Bello',
          givenName: 'Fer',
          formatted: 'Fer Bello',
        },
        nickname: null,
        phoneNumbers: [
          { id: '276', pref: false, value: '+5491150281459', type: 'other' },
        ],
        emails: null,
        addresses: null,
        ims: null,
        organizations: null,
        birthday: null,
        note: '',
        photos: null,
        categories: null,
        urls: null,
      },
    },
  ],
  async run(prisma: PrismaClient) {
    for (const contact of this.data) {
      await prisma.contact.createMany({
        data: contact,
      });
    }

    return true;
  },
};

export default model;
