import '../__test__/winston';
import { EventStatesService } from './event-states.service';
import { Test, TestingModule } from '@nestjs/testing';
import { EventState } from '@prisma/client';
import { PrismaServiceMock } from '@src/database/mocks/prisma.service';
import { PrismaService } from '@src/database/prisma.service';
import { mockDeep } from 'jest-mock-extended';
import { EventStates } from './entities/event-states.entity';

describe('EventStatesService', () => {
  let prisma: PrismaServiceMock;
  let service: EventStatesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventStatesService,
        {
          provide: PrismaService,
          useValue: PrismaServiceMock,
        },
      ],
    }).compile();

    service = module.get<EventStatesService>(EventStatesService);
    prisma = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('find event states', async () => {
    const mock = mockDeep<EventStates>({
      id: '4053ee9a-401c-4cb0-8f0a-4a9ef4811e21',
      name: 'testing name',
      active: true,
    });

    prisma.eventState.findMany.mockResolvedValueOnce([mock]);
    prisma.eventState.count.mockResolvedValueOnce(1);

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

  it('should create an event state', async () => {
    const data = mockDeep<EventState>({
      active: true,
      name: 'casa',
      customerId: '123-123asd-213asd-asdf324',
    });
    prisma.eventState.create.mockResolvedValueOnce(data);
    expect(service.create).toBeDefined();

    const result = await service.create({
      customerId: '123-123asd-213asd-asdf324',
      name: 'casa',
    });

    expect(result).toMatchObject(data);
  });

  it('should update an event state', async () => {
    const data = mockDeep<EventState>({
      id: '123-123asd-213asd-asdf324-64dg6',
      active: true,
      name: 'test',
      customerId: '123-123asd-213asd-asdf324',
    });

    prisma.eventState.findUnique.mockResolvedValueOnce(data);
    prisma.eventState.update.mockResolvedValueOnce({ ...data, name: 'casa' });
    const result = await service.update('123-123asd-213asd-asdf324-64dg6', {
      customerId: '123-123asd-213asd-asdf324',
      name: 'casa',
    });

    expect(result).toMatchObject({
      ...data,
      name: 'casa',
    });
  });
});
