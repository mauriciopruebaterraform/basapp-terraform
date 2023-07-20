import '../../__test__/winston';
import { Notification, Location, Customer, User } from '@prisma/client';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@src/database/prisma.service';
import { NotificationsService } from './notifications.service';
import { PrismaServiceMock } from '@src/database/mocks/prisma.service';
import { mockDeep } from 'jest-mock-extended';
import { PushNotificationServiceMock } from '@src/push-notification/mocks/push-notification.service';
import { PushNotificationService } from '@src/push-notification/push-notification.service';
import { ConfigService } from '@nestjs/config';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let prisma: PrismaServiceMock;
  let pushNotification: PushNotificationServiceMock;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: PrismaService,
          useValue: PrismaServiceMock,
        },
        ConfigService,
        {
          provide: PushNotificationService,
          useValue: PushNotificationServiceMock,
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    pushNotification = module.get(PushNotificationService);
    prisma = module.get(PrismaService);
  });

  describe('customer notification', () => {
    it('find all notifications that customers get it', async () => {
      const notificationsMock = mockDeep<Notification>({
        id: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
        customerId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
      });

      prisma.notification.findMany.mockResolvedValueOnce([notificationsMock]);
      prisma.notification.count.mockResolvedValueOnce(1);
      const { results, pagination } = await service.findAll({});
      expect(results).toEqual([notificationsMock]);
      expect(pagination).toEqual({
        total: 1,
        take: 100,
        skip: 0,
        hasMore: false,
        size: 1,
      });
    });

    it('should create notification', async () => {
      const notificationMock = mockDeep<Notification>({
        id: 'f7dc327f-80db-4363-9d9b-9d12602288b5',
        title: 'alerta',
        description: 'descripcion de la alerta',
        customerId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
      });

      const userMock = mockDeep<User>({
        username: '541166480626',
        password: '123456',
        firstName: 'mauricio',
        lastName: 'gallego',
        fullName: 'mauricio gallego',
        role: 'user',
      });

      const locationMock = mockDeep<Location>({
        id: 'e3d8146e-c2d1-4028-9419-9ba303afb35a',
        updatedById: 'be50b2bf-b151-4dd1-9b12-b3b8780a7a1e',
        active: true,
        customerId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
      });

      const customerMock = mockDeep<Customer>({
        type: 'business',
      });
      prisma.notification.create.mockResolvedValueOnce(notificationMock);
      prisma.notification.count.mockResolvedValueOnce(0);
      prisma.customer.findUnique.mockResolvedValue(customerMock);
      prisma.location.findUnique.mockResolvedValue(locationMock);
      pushNotification.pushNotification.mockResolvedValue(true);
      prisma.user.findMany.mockResolvedValue([userMock]);

      const result = await service.create({
        title: 'alerta',
        description: 'descripcion de la alerta',
        userId: 'be50b2bf-b151-4dd1-9b12-b3b8780a7a1e',
        customerId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
      });

      expect(result).toMatchObject(notificationMock);
    });

    it('find a notification that customers get it', async () => {
      const notificationMock = mockDeep<Notification>({
        id: '548b438d-0596-4911-8769-d8b35e7edd2a',
        customerId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
        title: 'alerta',
        description: 'explicacion de la alerta',
      });

      prisma.notification.findFirst.mockResolvedValueOnce(notificationMock);
      const results = await service.findOne(
        '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
        '548b438d-0596-4911-8769-d8b35e7edd2a',
        {},
      );
      expect(results).toEqual(notificationMock);
    });
  });
});
