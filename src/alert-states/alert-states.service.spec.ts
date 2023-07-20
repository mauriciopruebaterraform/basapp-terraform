import '../__test__/winston';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaServiceMock } from '@src/database/mocks/prisma.service';
import { PrismaService } from '@src/database/prisma.service';
import { mockDeep } from 'jest-mock-extended';
import { AlertStateService } from './alert-states.service';
import { CreateAlertState } from './dto/create-alert-state.dto';
import { AlertState } from './entities/alert-states.entity';

describe('AlertStatesService', () => {
  let prisma: PrismaServiceMock;
  let service: AlertStateService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AlertStateService,
        {
          provide: PrismaService,
          useValue: PrismaServiceMock,
        },
      ],
    }).compile();

    service = module.get<AlertStateService>(AlertStateService);
    prisma = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('find alert states', async () => {
    const mock = mockDeep<AlertState>({
      id: '4053ee9a-401c-4cb0-8f0a-4a9ef4811e21',
      name: 'testing name',
      active: true,
    });

    prisma.alertState.findMany.mockResolvedValueOnce([mock]);
    prisma.alertState.count.mockResolvedValueOnce(1);

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

  it('create alert', async () => {
    const mock = mockDeep<CreateAlertState & { customerId: string }>({
      name: 'testing name',
      customerId: '12d1f3-f8c1-4b5f-b8e9-f8c1b5f8e9f8',
    });

    const response = mockDeep<AlertState>({
      id: '4053ee9a-401c-4cb0-8f0a-4a9ef4811e21',
      name: 'testing name',
      active: true,
      customerId: '12d1f3-f8c1-4b5f-b8e9-f8c1b5f8e9f8',
    });

    prisma.alertState.create.mockResolvedValueOnce(response);
    const result = await service.create({ ...mock });

    expect(result).toEqual(response);
  });

  it('update alert state', async () => {
    const mock = mockDeep<AlertState>({
      id: '4053ee9a-401c-4cb0-8f0a-4a9ef4811e21',
      name: 'testing name',
      active: true,
      customerId: '12d1f3-f8c1-4b5f-b8e9-f8c1b5f8e9f8',
    });

    prisma.alertState.update.mockResolvedValueOnce(mock);
    // prisma.alertState.findUnique.mockResolvedValueOnce();
    prisma.alertState.count.mockResolvedValueOnce(1);

    const result = await service.update(
      '4053ee9a-401c-4cb0-8f0a-4a9ef4811e21',
      {
        edit: {
          name: 'testing name',
        },
        role: 'admin',
        customerId: '12d1f3-f8c1-4b5f-b8e9-f8c1b5f8e9f8',
      },
    );
    expect(result).toMatchObject(mock);
  });
});
