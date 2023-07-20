import '../../__test__/winston';
import { NotificationTemplate } from '@prisma/client';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@src/database/prisma.service';
import { PrismaServiceMock } from '@src/database/mocks/prisma.service';
import { mockDeep } from 'jest-mock-extended';
import { NotificationTemplatesService } from './notification-templates.service';

describe('NotificationTemplatesService', () => {
  let service: NotificationTemplatesService;
  let prisma: PrismaServiceMock;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationTemplatesService,
        {
          provide: PrismaService,
          useValue: PrismaServiceMock,
        },
      ],
    }).compile();

    service = module.get<NotificationTemplatesService>(
      NotificationTemplatesService,
    );
    prisma = module.get(PrismaService);
  });

  describe('customer notification template', () => {
    it('find notification templates for a customer', async () => {
      const notificationTemplateMock = mockDeep<NotificationTemplate>({
        id: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
        customerId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
        title: 'alerta',
        description: 'esto es para cuando se active la alarma de robo',
      });

      prisma.notificationTemplate.findMany.mockResolvedValueOnce([
        notificationTemplateMock,
      ]);
      prisma.notificationTemplate.count.mockResolvedValueOnce(1);
      const { results, pagination } = await service.findAll({});
      expect(results).toEqual([notificationTemplateMock]);
      expect(pagination).toEqual({
        total: 1,
        take: 100,
        skip: 0,
        hasMore: false,
        size: 1,
      });
    });

    it('should create notification template', async () => {
      const Mock = mockDeep<NotificationTemplate>({
        id: '1111ee9a-401c-4cb0-8f0a-8f653eaa848a',
        active: true,
        customerId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
        description: 'alerta',
        title: 'description alerta',
      });

      prisma.notificationTemplate.create.mockResolvedValueOnce(Mock);

      const result = await service.create({
        customerId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
        description: 'alerta',
        title: 'description alerta',
      });

      expect(result).toStrictEqual(Mock);
    });

    it('should update a notification template', async () => {
      const mock = mockDeep<NotificationTemplate>({
        id: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
        title: 'alerta de seguridad',
        active: false,
        customerId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
      });

      prisma.notificationTemplate.count.mockResolvedValueOnce(1);
      prisma.notificationTemplate.update.mockResolvedValueOnce(mock);

      const result = await service.update(
        'e2afa0ab-95d8-4b2a-bc00-6afbe0024145',
        {
          active: false,
          customerId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
        },
      );

      expect(result).toMatchObject(mock);
    });
  });
});
