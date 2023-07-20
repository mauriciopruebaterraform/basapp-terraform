import '../__test__/winston';
import { PrismaServiceMock } from '@src/database/mocks/prisma.service';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@src/database/prisma.service';
import { EventCategoryService } from './event-category.service';
import { mockDeep } from 'jest-mock-extended';
import EventCategoryInput from './mocks/create-event-category.dto';
import { CreateEventCategoryDto } from './dto/create-event-categor.dto';
import { EventCategory } from '@prisma/client';

describe('EventCategoryService', () => {
  let service: EventCategoryService;
  let prisma: PrismaServiceMock;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventCategoryService,
        {
          provide: PrismaService,
          useValue: PrismaServiceMock,
        },
      ],
    }).compile();

    prisma = module.get(PrismaService);
    service = module.get<EventCategoryService>(EventCategoryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create event category', async () => {
    const categoryEventInput =
      mockDeep<CreateEventCategoryDto>(EventCategoryInput);
    const categoryEventMock = mockDeep<EventCategory>({
      id: '4e3f8f9b-f8c1-4b5f-b8e9-f8c1b5f8e9f8',
      ...EventCategoryInput,
      image: {
        ...categoryEventInput.image,
      },
    });
    prisma.eventCategory.create.mockResolvedValueOnce(categoryEventMock);
    const result = await service.create({
      ...categoryEventInput,
    });
    expect(result).toEqual(categoryEventMock);
  });

  it('find event categories', async () => {
    const eventCategoryMock = mockDeep<EventCategory>({
      active: true,
      title: 'evento',
      image: null,
      id: '4053ee9a-401c-4cb0-8f0a-4a9ef4811e21',
    });

    prisma.eventCategory.findMany.mockResolvedValueOnce([eventCategoryMock]);
    prisma.eventCategory.count.mockResolvedValueOnce(1);

    const { results, pagination } = await service.findAll({});
    expect(results).toEqual([eventCategoryMock]);
    expect(pagination).toEqual({
      total: 1,
      take: 100,
      skip: 0,
      hasMore: false,
      size: 1,
    });
  });

  it('update event categories', async () => {
    const eventCategoryMock = mockDeep<EventCategory>({
      active: true,
      title: 'after updated',
      image: null,
      id: '4053ee9a-401c-4cb0-8f0a-4a9ef4811e21',
    });
    prisma.eventCategory.update.mockResolvedValueOnce(eventCategoryMock);

    const result = await service.update(
      '4053ee9a-401c-4cb0-8f0a-4a9ef4811e21',
      {
        active: true,
        title: 'after updated',
        image: null,
      },
    );

    expect(result).toMatchObject(eventCategoryMock);
  });
});
