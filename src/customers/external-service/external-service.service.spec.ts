import '../../__test__/winston';
import { ExternalService } from '@prisma/client';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@src/database/prisma.service';
import { ExternalServiceService } from './external-service.service';
import { PrismaServiceMock } from '@src/database/mocks/prisma.service';
import { mockDeep } from 'jest-mock-extended';

describe('ExternalServiceService', () => {
  let service: ExternalServiceService;
  let prisma: PrismaServiceMock;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExternalServiceService,
        {
          provide: PrismaService,
          useValue: PrismaServiceMock,
        },
      ],
    }).compile();

    service = module.get<ExternalServiceService>(ExternalServiceService);
    prisma = module.get(PrismaService);
  });

  it('find all external services', async () => {
    const mock = mockDeep<ExternalService>({
      id: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
      active: true,
    });

    prisma.externalService.findMany.mockResolvedValueOnce([mock]);
    prisma.externalService.count.mockResolvedValueOnce(1);

    const { results, pagination } = await service.findAll({});
    expect(results).toEqual([mock]);
    expect(pagination).toEqual({
      total: 1,
      take: 100,
      skip: 0,
      hasMore: false,
      size: 1,
    });
  });

  it('should create', async () => {
    const mock = mockDeep<ExternalService>({
      id: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
      active: true,
      alertId: 'efc8a613-b538-4296-a269-c1cd458c5283',
    });

    prisma.alert.count.mockResolvedValueOnce(1);
    prisma.externalService.create.mockResolvedValueOnce(mock);

    const result = await service.create({
      alertId: 'efc8a613-b538-4296-a269-c1cd458c5283',
    });

    expect(result).toMatchObject(mock);
  });

  it('should update', async () => {
    const mock = mockDeep<ExternalService>({
      id: 'e2afa0ab-95d8-4b2a-bc00-6afbe0024145',
      active: false,
      alertId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
    });

    prisma.alert.count.mockResolvedValueOnce(1);
    prisma.externalService.count.mockResolvedValueOnce(1);
    prisma.externalService.findUnique.mockResolvedValueOnce(mock);
    prisma.externalService.update.mockResolvedValueOnce(mock);

    const result = await service.update(
      'e2afa0ab-95d8-4b2a-bc00-6afbe0024145',
      {
        active: false,
      },
    );

    expect(result).toMatchObject(mock);
  });
});
