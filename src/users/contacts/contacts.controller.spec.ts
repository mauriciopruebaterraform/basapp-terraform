import '../../__test__/winston';
/* eslint-disable @typescript-eslint/ban-ts-comment */
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaServiceMock } from '@src/database/mocks/prisma.service';
import { PrismaService } from '@src/database/prisma.service';
import { ContactsServiceMock } from './mocks/contacts.service';
import { ContactsController } from './contacts.controller';
import { ContactsModule } from './contacts.module';
import { ContactsService } from './contacts.service';
import configuration from '@src/config/configuration';
import { AlertType, Contact, ContactAlertType } from '@prisma/client';
import { mockDeep } from 'jest-mock-extended';

describe('ContactsController', () => {
  let controller: ContactsController;
  let service: ContactsServiceMock;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ContactsModule,
        ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
      ],
      controllers: [ContactsController],
    })
      .overrideProvider(PrismaService)
      .useValue(PrismaServiceMock)
      .overrideProvider(ContactsService)
      .useValue(ContactsServiceMock)
      .compile();

    controller = module.get<ContactsController>(ContactsController);
    service = module.get(ContactsService);
  });

  it('return contact list', async () => {
    const mockList: Contact[] = mockDeep<Contact[]>([
      {
        phoneNumber: '541166480626',
        userId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
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
            {
              id: '276',
              pref: false,
              value: '+5491150281459',
              type: 'other',
            },
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
        phoneNumber: '541156230615',
        userId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
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
            {
              id: '276',
              pref: false,
              value: '+5491150281459',
              type: 'other',
            },
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
    ]);

    service.findAllContacts.mockResolvedValueOnce({
      results: mockList,
      pagination: {
        total: 2,
        size: 2,
        skip: 0,
        take: 10,
      },
    });

    const { results, pagination } = await controller.findAllContacts(
      {
        user: {
          id: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
          customerId: 'f8c1-b8e9-4b5f-b8e9-f8c1b5f8e9f8',
          role: 'user',
        },
      },
      '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
      {},
    );
    expect(results).toBeDefined();
    expect(results).toBeInstanceOf(Array);
    expect(results.length).toBe(2);

    results.forEach((item) => {
      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('phoneNumber');
      expect(item).toHaveProperty('contactUserId');
      expect(item).toHaveProperty('userId');
      expect(item).toHaveProperty('deviceContact');
      expect(item).toHaveProperty('createdAt');
      expect(item).toHaveProperty('updatedAt');
    });

    expect(pagination).toBeDefined();
    expect(pagination).toBeInstanceOf(Object);
    expect(pagination).toEqual({
      size: mockList.length,
      total: mockList.length,
      take: 10,
      skip: 0,
    });
  });

  it('create contact', async () => {
    const mock: Contact & {
      contactAlertTypes: (ContactAlertType & { alertType: AlertType })[];
    } = mockDeep<
      Contact & {
        contactAlertTypes: (ContactAlertType & { alertType: AlertType })[];
      }
    >({
      phoneNumber: '541166480626',
      userId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
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
    });

    service.create.mockResolvedValueOnce(mock);

    const result = await controller.createContact(
      '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
      {
        phoneNumber: '541166480626',
        deviceContact: {
          id: '28',
          rawId: '36',
          displayName: 'Fer Bello',
          name: 'Fer Bello',
          nickname: null,
          phoneNumbers: [
            {
              id: '276',
              number: '+541166480626',
            },
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
    );

    expect(result).toMatchObject({
      ...mock,
    });
  });

  it('update contact', async () => {
    const mock: Contact & {
      contactAlertTypes: (ContactAlertType & { alertType: AlertType })[];
    } = mockDeep<
      Contact & {
        contactAlertTypes: (ContactAlertType & { alertType: AlertType })[];
      }
    >({
      phoneNumber: '541166480626',
      userId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
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
    });

    service.update.mockResolvedValueOnce(mock);

    const result = await controller.updateContacts(
      {
        user: {
          id: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
          customerId: 'f8c1-b8e9-4b5f-b8e9-f8c1b5f8e9f8',
          role: 'user',
        },
      },
      '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
      'e534a387-b76a-48a0-a25d-ea4a52417cb4',
      {
        phoneNumber: '541166480626',
        alertTypes: [],
        deviceContact: {
          id: '28',
          rawId: '36',
          name: 'Fer Bello',
          nickname: null,
          phoneNumbers: [
            {
              id: '276',
              number: '+541166480626',
            },
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
    );

    expect(result).toMatchObject({
      ...mock,
    });
  });
  it('delete contact', async () => {
    const result = await controller.deleteContact(
      {
        user: {
          id: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
          customerId: 'f8c1-b8e9-4b5f-b8e9-f8c1b5f8e9f8',
          role: 'user',
        },
      },
      '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
      'e534a387-b76a-48a0-a25d-ea4a52417cb4',
    );

    expect(result).toBeUndefined();
  });
});
