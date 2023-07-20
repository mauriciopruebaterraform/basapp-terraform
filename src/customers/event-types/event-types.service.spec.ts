import '../../__test__/winston';
import { EventType } from '@prisma/client';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@src/database/prisma.service';
import { EventTypesService } from './event-types.service';
import { PrismaServiceMock } from '@src/database/mocks/prisma.service';
import { mockDeep } from 'jest-mock-extended';

describe('EventTypesService', () => {
  let service: EventTypesService;
  let prisma: PrismaServiceMock;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventTypesService,
        {
          provide: PrismaService,
          useValue: PrismaServiceMock,
        },
      ],
    }).compile();

    service = module.get<EventTypesService>(EventTypesService);
    prisma = module.get(PrismaService);
  });

  it('find all event type', async () => {
    const eventTypeMock = mockDeep<EventType>({
      id: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
      updatedById: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
      active: true,
      customerId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
    });

    prisma.eventType.findMany.mockResolvedValueOnce([eventTypeMock]);
    prisma.eventType.count.mockResolvedValueOnce(1);
    const { results, pagination } = await service.findAll({});
    expect(results).toEqual([eventTypeMock]);
    expect(pagination).toEqual({
      total: 1,
      take: 100,
      skip: 0,
      hasMore: false,
      size: 1,
    });
  });
  it('should create', async () => {
    const eventTypeMock = mockDeep<EventType>({
      id: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
      updatedById: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
      active: true,
      customerId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
    });

    prisma.customerEventCategory.count.mockResolvedValueOnce(1);
    prisma.eventType.create.mockResolvedValueOnce(eventTypeMock);

    const result = await service.create({
      title: '123123123',
      code: '123123123',
      userId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
      customerId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
    });

    expect(result).toMatchObject(eventTypeMock);
  });

  it('update event type', async () => {
    const eventTypeMock = mockDeep<EventType>({
      id: 'e2afa0ab-95d8-4b2a-bc00-6afbe0024145',
      updatedById: '70df3d00-b373-4fe8-bbcc-aa98ade885dd',
      active: false,
      customerId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
    });

    prisma.customerEventCategory.count.mockResolvedValueOnce(1);
    prisma.eventType.count.mockResolvedValueOnce(1);
    prisma.eventType.findUnique.mockResolvedValueOnce(eventTypeMock);
    prisma.eventType.update.mockResolvedValueOnce(eventTypeMock);

    const result = await service.update(
      'e2afa0ab-95d8-4b2a-bc00-6afbe0024145',
      {
        active: false,
        customerId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
        userId: '70df3d00-b373-4fe8-bbcc-aa98ade885dd',
      },
    );

    expect(result).toMatchObject(eventTypeMock);
  });
});
