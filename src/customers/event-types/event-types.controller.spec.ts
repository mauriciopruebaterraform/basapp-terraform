import '../../__test__/winston';
import {
  CustomerEventCategory,
  EventType as EventTypePrisma,
  Customer,
} from '@prisma/client';
import { Test, TestingModule } from '@nestjs/testing';
import { EventTypesController } from './event-types.controller';
import { EventTypesModule } from './event-types.module';
import { EventTypesService } from './event-types.service';
import { PrismaService } from '@src/database/prisma.service';
import { PrismaServiceMock } from '@src/database/mocks/prisma.service';
import { mockDeep } from 'jest-mock-extended';
import { EventType } from './entities/event-type.entity';
import { EventTypesServiceMock } from './mocks/event-types.service';

describe('EventTypesController', () => {
  let controller: EventTypesController;
  let service: EventTypesServiceMock;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [EventTypesModule],
      controllers: [EventTypesController],
    })
      .overrideProvider(PrismaService)
      .useValue(PrismaServiceMock)
      .overrideProvider(EventTypesService)
      .useValue(EventTypesServiceMock)
      .compile();

    controller = module.get<EventTypesController>(EventTypesController);
    service = module.get(EventTypesService);
  });

  it('should return a list of customers event type', async () => {
    const customersEventType: EventType[] = mockDeep<EventType[]>([
      {
        id: '4e3f8f9b-4b5f-b8e9-f8c1b5f8e9f8',
        eventCategoryId: '4e3f8f9b-f8c1-4b5f-b8e9-f8c1b5f8e9f8',
        customerId: 'f8c1-b8e9-4b5f-b8e9-f8c1b5f8e9f8',
      },
      {
        id: '4e3f8f9b-f8c1-4b5f-b8e9-f8c1b5f8e9f9',
        eventCategoryId: '4e3f8f9b-b8e9-f8c1b5f8e9f8-4b5f-b8e9-b8e9',
        customerId: 'b8e9-dd-f8c1-4b5f-b8e9-asd',
      },
      {
        id: '4e3f8f9b-f8c1-4b5f-b8e9-f8c1b5f8e9f10',
        eventCategoryId: '4e3f8f9b-b8e9-f8c1b5f8e9f8-b8e9-f8c1b5f8e9f8',
        customerId: 'b8e9-f8c1b5f8e9f8-sdf-4b5f-sdf-sdf',
      },
      {
        id: '4e3f8f9b-f8c1-4b5f-b8e9-f8c1b5f8e9f11',
        eventCategoryId: 'b8e9-f8c1b5f8e9f8-f8c1-4b5f-b8e9-f8c1b5f8e9f8',
        customerId: 'b8e9-dfsdfsd-f8c1-4b5f-b8e9-f8c1b5f8e9f8',
      },
    ]);

    service.findAll.mockResolvedValueOnce({
      results: customersEventType,
      pagination: {
        total: 4,
        size: 4,
        skip: 0,
        take: 10,
      },
    });

    const { results, pagination } = await controller.findAllEventType(
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
      expect(item).toHaveProperty('code');
      expect(item).toHaveProperty('title');
      expect(item).toHaveProperty('lotFrom');
      expect(item).toHaveProperty('lotTo');
      expect(item).toHaveProperty('additionalNotifications');
      expect(item).toHaveProperty('qrFormat');
      expect(item).toHaveProperty('description');
      expect(item).toHaveProperty('attachment');
      expect(item).toHaveProperty('monitor');
      expect(item).toHaveProperty('addToStatistics');
      expect(item).toHaveProperty('notifyUser');
      expect(item).toHaveProperty('notifySecurityChief');
      expect(item).toHaveProperty('notifySecurityGuard');
      expect(item).toHaveProperty('autoCancelAfterExpired');
      expect(item).toHaveProperty('allowsMultipleAuthorized');
      expect(item).toHaveProperty('requiresDni');
      expect(item).toHaveProperty('isPermanent');
      expect(item).toHaveProperty('emergency');
      expect(item).toHaveProperty('requiresPatent');
      expect(item).toHaveProperty('generateQr');
      expect(item).toHaveProperty('reservation');
      expect(item).toHaveProperty('notifyGiroVision');
      expect(item).toHaveProperty('active');
      expect(item).toHaveProperty('customerId');
      expect(item).toHaveProperty('gvEntryTypeId');
      expect(item).toHaveProperty('gvGuestTypeId');
      expect(item).toHaveProperty('updatedById');
      expect(item).toHaveProperty('eventCategoryId');
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
  it('should create event type', async () => {
    expect(controller.createEventType).toBeDefined();

    const eventTypeMock = mockDeep<
      EventTypePrisma & {
        eventCategory: CustomerEventCategory;
        customer: Customer;
      }
    >({
      id: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
      code: 'test',
      title: 'test',
      updatedById: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
      active: true,
      customerId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
    });

    service.create.mockResolvedValueOnce(eventTypeMock);

    const result = await controller.createEventType(
      {
        user: {
          id: '234-234-234-234',
          customerId: '123-123-123-123',
        },
      },
      '123-123-123-123',
      {
        title: '123123123',
        code: '123123123',
      },
    );

    expect(result).toMatchObject(eventTypeMock);
  });

  it('should update event type', async () => {
    expect(controller.updateEventType).toBeDefined();

    const eventTypeMock = mockDeep<
      EventTypePrisma & {
        eventCategory: CustomerEventCategory;
      }
    >({
      id: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
      code: 'test',
      title: 'test',
      updatedById: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
      active: false,
      customerId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
    });

    service.update.mockResolvedValueOnce(eventTypeMock);

    const result = await controller.updateEventType(
      {
        user: {
          id: '234-234-234-234',
          customerId: 'e2afa0ab-95d8-4b2a-bc00-6afbe0024145',
        },
      },
      '86218e15-d405-4e1b-9955-947922474b1c',
      'e2afa0ab-95d8-4b2a-bc00-6afbe0024145',
      {
        active: false,
      },
    );

    expect(result).toMatchObject(eventTypeMock);
  });
});
