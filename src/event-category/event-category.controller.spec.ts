import '../__test__/winston';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaServiceMock } from '@src/database/mocks/prisma.service';
import { PrismaService } from '@src/database/prisma.service';
import { mockDeep } from 'jest-mock-extended';
import { CreateEventCategoryDto } from './dto/create-event-categor.dto';
import { EventCategoryController } from './event-category.controller';
import { EventCategoryModule } from './event-category.module';
import { EventCategoryService } from './event-category.service';
import { EventCategoryServiceMock } from './mocks/event-category.service';
import { EventCategory } from '@prisma/client';

describe('EventCategoryController', () => {
  let controller: EventCategoryController;
  let service: EventCategoryServiceMock;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [EventCategoryModule],
      providers: [EventCategoryService],
      controllers: [EventCategoryController],
    })
      .overrideProvider(PrismaService)
      .useValue(PrismaServiceMock)
      .overrideProvider(EventCategoryService)
      .useValue(EventCategoryServiceMock)
      .compile();

    controller = module.get<EventCategoryController>(EventCategoryController);
    service = module.get(EventCategoryService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create a event category', async () => {
    expect(controller.create).toBeDefined();

    const data = {
      title: 'un evento mas',
      active: true,
    };

    const eventCategoryInput = mockDeep<CreateEventCategoryDto>(data);
    const responseEventCategory = mockDeep<EventCategory>({
      id: '4e3f8f9b-f8c1-4b5f-b8e9-f8c1b5f8e9f8',
      ...data,
    });
    service.create.mockResolvedValueOnce(responseEventCategory);
    const result = await controller.create(eventCategoryInput);

    expect(result).toMatchObject({
      id: '4e3f8f9b-f8c1-4b5f-b8e9-f8c1b5f8e9f8',
      active: true,
      title: 'un evento mas',
    });
  });

  it('should return a list of event categories', async () => {
    const eventCategories = [
      {
        id: '4e3f8f9b-f8c1-4b5f-b8e9-f8c1b5f8e9f8',
        title: 'Test',
        active: true,
      },
      {
        id: '4e3f8f9b-f8c1-4b5f-b8e9-f8c1b5f8e9f9',
        title: 'Test2',
        active: false,
      },
    ];

    service.findAll.mockResolvedValueOnce({
      results: eventCategories,
      pagination: {
        total: eventCategories.length,
        size: eventCategories.length,
        skip: 0,
        take: 10,
      },
    });

    const { results, pagination } = await controller.findAll({});
    expect(results).toBeDefined();
    expect(results).toBeInstanceOf(Array);
    expect(results.length).toBe(eventCategories.length);

    results.forEach((item) => {
      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('title');
      expect(item).toHaveProperty('active');
    });

    expect(pagination).toBeDefined();
    expect(pagination).toBeInstanceOf(Object);
    expect(pagination).toEqual({
      total: eventCategories.length,
      size: eventCategories.length,
      take: 10,
      skip: 0,
    });
  });

  it('should update a event category', async () => {
    expect(controller.update).toBeDefined();

    const eventCategory = mockDeep<CreateEventCategoryDto>({
      title: 'after updated',
      active: true,
    });
    const eventCategoryUpdated = mockDeep<EventCategory>({
      id: '4e3f8f9b-f8c1-4b5f-b8e9-f8c1b5f8e9f8',
      title: 'after updated',
      active: true,
    });

    service.update.mockResolvedValueOnce(eventCategoryUpdated);
    const result = await controller.update(
      '4e3f8f9b-f8c1-4b5f-b8e9-f8c1b5f8e9f8',
      eventCategory,
    );

    expect(result).toMatchObject(eventCategoryUpdated);
  });
});
