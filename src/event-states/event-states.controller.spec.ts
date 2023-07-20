import '../__test__/winston';
import { Test, TestingModule } from '@nestjs/testing';
import { EventState } from '@prisma/client';
import { PrismaServiceMock } from '@src/database/mocks/prisma.service';
import { PrismaService } from '@src/database/prisma.service';
import { mockDeep } from 'jest-mock-extended';
import { EventStatesController } from './event-states.controller';
import { EventStatesModule } from './event-states.module';
import { EventStatesService } from './event-states.service';
import { EventStatesServiceMock } from './mock/event-states.service';

describe('EventStatesController', () => {
  let controller: EventStatesController;
  let service: EventStatesServiceMock;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [EventStatesModule],
      providers: [EventStatesService],
      controllers: [EventStatesController],
    })
      .overrideProvider(PrismaService)
      .useValue(PrismaServiceMock)
      .overrideProvider(EventStatesService)
      .useValue(EventStatesServiceMock)
      .compile();

    controller = module.get<EventStatesController>(EventStatesController);
    service = module.get(EventStatesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return a list of event states', async () => {
    const eventStatesList = [
      {
        id: '4e3f8f9b-f8c1-4b5f-b8e9-f8c1b5f8e9f8',
        name: 'Test',
      },
      {
        id: '4e3f8f9b-f8c1-4b5f-b8e9-f8c1b5f8e9f9',
        name: 'Test2',
      },
      {
        id: '4e3f8f9b-f8c1-4b5f-b8e9-f8c1b5f8e9f10',
        name: 'Test3',
      },
      {
        id: '4e3f8f9b-f8c1-4b5f-b8e9-f8c1b5f8e9f11',
        name: 'Test4',
      },
    ];

    service.findAll.mockResolvedValue({
      results: eventStatesList,
      pagination: {
        total: eventStatesList.length,
        size: eventStatesList.length,
        skip: 0,
        take: 10,
      },
    });

    const { results, pagination } = await controller.findAll(
      {
        user: {
          customerId: null,
        },
      },
      {},
    );
    expect(results).toBeDefined();
    expect(results).toBeInstanceOf(Array);
    expect(results.length).toBe(eventStatesList.length);

    results.forEach((item) => {
      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('name');
    });

    expect(pagination).toBeDefined();
    expect(pagination).toBeInstanceOf(Object);
    expect(pagination).toEqual({
      size: 4,
      total: 4,
      take: 10,
      skip: 0,
    });
  });

  it('should create an event state', async () => {
    const data = mockDeep<EventState>({
      active: true,
      name: 'casa',
      customerId: '123-123asd-213asd-asdf324',
    });
    expect(controller.create).toBeDefined();
    service.create.mockResolvedValueOnce(data);

    const result = await controller.create(
      {
        user: {
          customerId: '123-123asd-213asd-asdf324',
        },
      },
      {
        name: 'casa',
      },
    );

    expect(result).toMatchObject(data);
  });

  it('should update an event state', async () => {
    const data = mockDeep<EventState>({
      active: true,
      name: 'otro nombre',
      customerId: '123-123asd-213asd-asdf324',
    });
    service.update.mockResolvedValueOnce(data);
    const result = await controller.update(
      {
        user: {
          customerId: '123-123asd-213asd-asdf324',
        },
      },
      '123-123asd-dd31dfg-213asd-asdf324',
      {
        name: 'otro nombre',
      },
    );
    expect(result).toMatchObject({
      ...data,
      name: 'otro nombre',
    });
  });
});
