import '../../__test__/winston';
import { Test, TestingModule } from '@nestjs/testing';
import { EventAuthorizationRequestController } from './event-authorization-requests.controller';
import { EventAuthorizationRequestModule } from './event-authorization-requests.module';
import { EventAuthorizationRequestService } from './event-authorization-requests.service';
import { PrismaService } from '@src/database/prisma.service';
import { PrismaServiceMock } from '@src/database/mocks/prisma.service';
import { mockDeep } from 'jest-mock-extended';
import { EventAuthorizationRequest } from './entities/event-authorization-request.entity';
import { EventAuthorizationRequest as EventAuthorizationRequestPrisma } from '@prisma/client';
import { EventAuthorizationRequestServiceMock } from './mocks/event-authorization-requests.service';
import configuration from '@src/config/configuration';
import { ConfigModule } from '@nestjs/config';
import { EventsModule } from '../events/events.module';
import { EventsService } from '../events/events.service';
import { EventsServiceMock } from '../events/mocks/events.service';
import { ReservationModule } from '../reservations/reservations.module';
import { ReservationService } from '../reservations/reservations.service';
import { ReservationServiceMock } from '../reservations/mocks/reservations.service';
import { DatabaseModule } from '@src/database/database.module';
import { ConfigurationModule } from '@src/configuration/configuration.module';

describe('EventAuthorizationRequestController', () => {
  let controller: EventAuthorizationRequestController;
  let service: EventAuthorizationRequestServiceMock;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        EventsModule,
        DatabaseModule,
        ReservationModule,
        ConfigurationModule,
        EventAuthorizationRequestModule,
        ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
      ],
      controllers: [EventAuthorizationRequestController],
    })
      .overrideProvider(PrismaService)
      .useValue(PrismaServiceMock)
      .overrideProvider(EventAuthorizationRequestService)
      .useValue(EventAuthorizationRequestServiceMock)
      .overrideProvider(EventsService)
      .useValue(EventsServiceMock)
      .overrideProvider(ReservationService)
      .useValue(ReservationServiceMock)
      .compile();

    controller = module.get<EventAuthorizationRequestController>(
      EventAuthorizationRequestController,
    );
    service = module.get(EventAuthorizationRequestService);
  });

  it('should return a list of customers event authorization request', async () => {
    const customersEventAuthorizationRequest: EventAuthorizationRequest[] =
      mockDeep<EventAuthorizationRequest[]>([
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
      results: customersEventAuthorizationRequest,
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
      expect(item).toHaveProperty('sentBySms');
      expect(item).toHaveProperty('text');
      expect(item).toHaveProperty('authorized');
      expect(item).toHaveProperty('lot');
      expect(item).toHaveProperty('confirmed');
      expect(item).toHaveProperty('userId');
      expect(item).toHaveProperty('monitorId');
      expect(item).toHaveProperty('customerId');
      expect(item).toHaveProperty('eventTypeId');
      expect(item).toHaveProperty('authorizedUserId');
      expect(item).toHaveProperty('createdAt');
      expect(item).toHaveProperty('trialPeriod');
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

  it('should return a list of customers event authorization request', async () => {
    const mockEventRequest = mockDeep<EventAuthorizationRequestPrisma>({
      customerId: 'b0273fda-1977-469e-b376-sdf123sgd',
    });

    service.create.mockResolvedValueOnce(mockEventRequest);

    const result = await controller.create(
      {
        user: {
          id: 'b0273fda-1977-469e-b376-6b49cceb0a6f',
          customerId: 'b0273fda-1977-469e-b376-sdf123sgd',
          role: 'admin',
        },
      },
      'b0273fda-1977-469e-b376-sdf123sgd',
      {
        lot: 'd1234',
        authorized: 'coto',
      },
    );

    expect(result).toStrictEqual(mockEventRequest);
  });
});
