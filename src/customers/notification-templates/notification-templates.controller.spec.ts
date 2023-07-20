import '../../__test__/winston';
import { NotificationTemplate } from '@prisma/client';
import { Test, TestingModule } from '@nestjs/testing';
import { NotificationTemplatesController } from './notification-templates.controller';
import { NotificationTemplatesModule } from './notification-templates.module';
import { NotificationTemplatesService } from './notification-templates.service';
import { NotificationTemplatesServiceMock } from './mocks/notification-templates.service';
import { PrismaService } from '@src/database/prisma.service';
import { PrismaServiceMock } from '@src/database/mocks/prisma.service';
import { mockDeep } from 'jest-mock-extended';

describe('NotificationTemplatesController', () => {
  let controller: NotificationTemplatesController;
  let service: NotificationTemplatesServiceMock;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [NotificationTemplatesModule],
      controllers: [NotificationTemplatesController],
    })
      .overrideProvider(PrismaService)
      .useValue(PrismaServiceMock)
      .overrideProvider(NotificationTemplatesService)
      .useValue(NotificationTemplatesServiceMock)
      .compile();

    controller = module.get<NotificationTemplatesController>(
      NotificationTemplatesController,
    );
    service = module.get(NotificationTemplatesService);
  });

  it('should return a list of customers notification templates', async () => {
    const customerNotificationTemplates: NotificationTemplate[] = mockDeep<
      NotificationTemplate[]
    >([
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
      results: customerNotificationTemplates,
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
      expect(item).toHaveProperty('description');
      expect(item).toHaveProperty('active');
      expect(item).toHaveProperty('customerId');
      expect(item).toHaveProperty('image');
      expect(item).toHaveProperty('createdAt');
      expect(item).toHaveProperty('updatedAt');
    });

    expect(pagination).toBeDefined();
    expect(pagination).toBeInstanceOf(Object);
    expect(pagination).toEqual({
      size: customerNotificationTemplates.length,
      total: customerNotificationTemplates.length,
      take: 10,
      skip: 0,
    });
  });

  it('should create notification template', async () => {
    expect(controller.create).toBeDefined();

    const Mock = mockDeep<NotificationTemplate>({
      id: '1111ee9a-401c-4cb0-8f0a-8f653eaa848a',
      active: true,
      customerId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
      title: 'alerta',
      description: 'description de la alerta',
    });

    service.create.mockResolvedValueOnce(Mock);

    const result = await controller.create(
      {
        user: {
          id: '234-234-234-234',
          customerId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
        },
      },
      '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
      {
        title: 'alerta',
        description: 'description de la alerta',
      },
    );

    expect(result).toStrictEqual(Mock);
  });

  it('should update a notification template', async () => {
    expect(controller.update).toBeDefined();

    const mock = mockDeep<NotificationTemplate>({
      id: 'a3d4ge9a-401c-4cb0-8f0a-4a9ef4811ed1',
      title: 'Alerta de seguridad',
      active: false,
      customerId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
    });

    service.update.mockResolvedValueOnce(mock);

    const result = await controller.update(
      {
        user: {
          id: 'a3d4ge9a-401c-4cb0-8f0a-4a9ef4811ed1',
          customerId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
        },
      },
      'a3d4ge9a-401c-4cb0-8f0a-4a9ef4811ed1',
      '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
      {
        active: false,
        title: 'Alerta de seguridad',
      },
    );

    expect(result).toMatchObject(mock);
  });
});
