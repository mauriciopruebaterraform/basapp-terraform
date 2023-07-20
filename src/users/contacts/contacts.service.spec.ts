import '../../__test__/winston';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@src/database/prisma.service';
import { ContactsService } from './contacts.service';
import { PrismaServiceMock } from '@src/database/mocks/prisma.service';
import { Role, User } from '@prisma/client';
import { ConfigModule } from '@nestjs/config';
import configuration from '@src/config/configuration';
import { mockDeep } from 'jest-mock-extended';
import { Contact } from './entities/contact.entity';

describe('ContactsService', () => {
  let service: ContactsService;
  let prisma: PrismaServiceMock;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ load: [configuration] })],
      providers: [
        ContactsService,
        {
          provide: PrismaService,
          useValue: PrismaServiceMock,
        },
      ],
    }).compile();

    service = module.get<ContactsService>(ContactsService);
    prisma = module.get(PrismaService);
  });

  describe('contact', () => {
    it('find all contacts', async () => {
      const user = mockDeep<User>({
        id: 'f3a8f8f8-f3a8-f3a8-f3a8-f3a8f8f8f8f8',
        username: '541166480626',
        firstName: 'test',
        lastName: 'test',
        fullName: 'test test',
        role: Role.user,
        active: true,
        password: undefined,
        customerId: '0589141d-ef1c-4c39-a8c7-30aef555003f',
      });
      const mock = mockDeep<Contact>({
        id: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
        userId: 'f3a8f8f8-f3a8-f3a8-f3a8-f3a8f8f8f8f8',
        phoneNumber: '541146829731',
        contactUser: undefined,
        user: undefined,
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

      prisma.contact.findMany.mockResolvedValueOnce([mock]);
      prisma.contact.count.mockResolvedValueOnce(1);
      prisma.user.findFirst.mockResolvedValueOnce({
        ...user,
      });
      const { results, pagination } = await service.findAllContacts(
        {
          where: {
            userId: 'f3a8f8f8-f3a8-f3a8-f3a8-f3a8f8f8f8f8',
          },
        },
        '0589141d-ef1c-4c39-a8c7-30aef555003f',
        'f3a8f8f8-f3a8-f3a8-f3a8-f3a8f8f8f8f8',
      );
      expect(results).toEqual([mock]);
      expect(pagination).toEqual({
        total: 1,
        take: 100,
        skip: 0,
        hasMore: false,
        size: 1,
      });
    });

    it('create contact', async () => {
      const data = {
        phoneNumber: '541166480626',
        deviceContact: {
          id: '28',
          rawId: '36',
          name: 'Fer Bello',
          nickname: null,
          phoneNumbers: [
            {
              id: '276',
              number: '+5491150281459',
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
      };
      prisma.user.findFirst.mockResolvedValueOnce(null);
      prisma.contact.count.mockResolvedValueOnce(0);
      const user = mockDeep<User>({
        role: Role.user,
        active: true,
      });
      prisma.user.findUnique.mockResolvedValueOnce(user);

      const result = await service.create({
        ...data,
        userId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
      });

      expect(data).toMatchObject({
        ...result,
      });
    });

    it('update contact', async () => {
      const data = mockDeep<Contact>({
        phoneNumber: '541166480626',
      });
      const user = mockDeep<User>({
        role: Role.user,
        active: true,
      });
      prisma.contact.findUnique.mockResolvedValueOnce(data);
      prisma.user.findUnique.mockResolvedValueOnce(
        mockDeep<User>({
          role: Role.user,
          active: true,
        }),
      );
      prisma.user.findFirst.mockResolvedValueOnce(null);
      prisma.user.findFirst.mockResolvedValueOnce(user);

      const result = await service.update(
        'f3a8f8f8-f3a8-f3a8-f3a8-f3a8f8f8f8f8',
        {
          phoneNumber: '541166480626',
          alertTypes: [],
          userId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
        },
      );

      expect(data).toMatchObject({
        ...result,
      });
    });
    it('delete contact', async () => {
      const data = mockDeep<Contact>({
        phoneNumber: '541166480626',
      });

      prisma.contact.findFirst.mockResolvedValueOnce(data);
      prisma.contactAlertType.deleteMany.mockResolvedValueOnce({ count: 1 });
      prisma.contact.deleteMany.mockResolvedValueOnce({ count: 1 });

      const result = await service.deleteContact(
        '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
        '1234ee9a-401c-4cb0-8f0a-4a9ef4811e21',
      );

      expect(result).toBeUndefined();
    });
  });
});
