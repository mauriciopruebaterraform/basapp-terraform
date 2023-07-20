import '../../__test__/winston';
import {
  Notification,
  NotificationCustomer,
  CustomerSections,
  CustomerSettings,
} from '@prisma/client';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@src/database/prisma.service';
import { PrismaServiceMock } from '@src/database/mocks/prisma.service';
import { mockDeep } from 'jest-mock-extended';
import { NotificationsServiceMock } from './mocks/notifications.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationsModule } from './notifications.module';
import { Customer } from '../entities/customer.entity';
import configuration from '@src/config/configuration';
import { ConfigModule } from '@nestjs/config';

describe('NotificationsController', () => {
  let controller: NotificationsController;
  let service: NotificationsServiceMock;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        NotificationsModule,
        ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
      ],
      controllers: [NotificationsController],
    })
      .overrideProvider(PrismaService)
      .useValue(PrismaServiceMock)
      .overrideProvider(NotificationsService)
      .useValue(NotificationsServiceMock)
      .compile();

    controller = module.get<NotificationsController>(NotificationsController);
    service = module.get(NotificationsService);
  });

  it('should return a list of customers notifications', async () => {
    const customerNotifications: Notification[] = mockDeep<Notification[]>([
      {
        id: '4e3f8f9b-4b5f-b8e9-f8c1b5f8e9f8',
        customerId: 'f8c1-b8e9-4b5f-b8e9-f8c1b5f8e9f8',
      },
      {
        id: '4e3f8f9b-f8c1-4b5f-b8e9-f8c1b5f8e9f9',
        customerId: 'b8e9-dd-f8c1-4b5f-b8e9-asd',
      },
      {
        id: '4e3f8f9b-f8c1-4b5f-b8e9-f8c1b5f8e9f10',
        customerId: 'b8e9-f8c1b5f8e9f8-sdf-4b5f-sdf-sdf',
      },
      {
        id: '4e3f8f9b-f8c1-4b5f-b8e9-f8c1b5f8e9f11',
        customerId: 'b8e9-dfsdfsd-f8c1-4b5f-b8e9-f8c1b5f8e9f8',
      },
    ]);

    service.findAll.mockResolvedValueOnce({
      results: customerNotifications,
      pagination: {
        total: 4,
        size: 4,
        skip: 0,
        take: 10,
      },
    });

    const { results, pagination } = await controller.findAll(
      {
        user: {
          id: 'b0273fda-1977-469e-b376-6b49cceb0a6f',
          customerId: 'b0273fda-1977-469e-b376-sdf123sgd',
          role: 'admin',
        },
      },
      'b0273fda-1977-469e-b376-sdf123sgd',
      {},
    );
    expect(results).toBeDefined();
    expect(results).toBeInstanceOf(Array);
    expect(results.length).toBe(4);

    results.forEach((item) => {
      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('title');
      expect(item).toHaveProperty('name');
      expect(item).toHaveProperty('customerId');
      expect(item).toHaveProperty('description');
      expect(item).toHaveProperty('image');
      expect(item).toHaveProperty('userId');
      expect(item).toHaveProperty('toUserId');
      expect(item).toHaveProperty('authorizationRequestId');
      expect(item).toHaveProperty('notificationId');
      expect(item).toHaveProperty('notificationType');
      expect(item).toHaveProperty('emergency');
    });

    expect(pagination).toBeDefined();
    expect(pagination).toBeInstanceOf(Object);
    expect(pagination).toEqual({
      size: customerNotifications.length,
      total: customerNotifications.length,
      take: 10,
      skip: 0,
    });
  });

  it('should create notification', async () => {
    expect(controller.create).toBeDefined();

    const notificationMock = mockDeep<
      Notification & {
        additionalNotifications: (NotificationCustomer & {
          customer: Customer & {
            sections: CustomerSections | null;
            settings: CustomerSettings | null;
          };
        })[];
      }
    >({
      id: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
      title: 'alerta',
      description: 'explicacion de la alerta',
      customerId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
    });

    service.create.mockResolvedValueOnce(notificationMock);

    const result = await controller.create(
      {
        user: {
          id: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
          customerId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
        },
      },
      '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
      {
        title: 'alerta',
        description: 'explicacion de la alerta',
      },
    );

    expect(result).toMatchObject(notificationMock);
  });

  it('should return a notification', async () => {
    const notification = mockDeep<Notification>({
      id: '3857e49f-3188-40d2-bfbe-367519ec42df',
      customerId: 'b0273fda-1977-469e-b376-sdf123sgd',
    });

    service.findOne.mockResolvedValueOnce(notification);

    const result = await controller.findOne(
      {
        user: {
          id: 'b0273fda-1977-469e-b376-6b49cceb0a6f',
          customerId: 'b0273fda-1977-469e-b376-sdf123sgd',
          role: 'admin',
        },
      },
      '3857e49f-3188-40d2-bfbe-367519ec42df',
      'b0273fda-1977-469e-b376-sdf123sgd',
      {},
    );
    expect(result).toEqual(notification);
  });
});
