import '../../__test__/winston';
import { Event } from '@src/customers/events/entities/event.entity';
import { Test, TestingModule } from '@nestjs/testing';
import { EventsController } from './events.controller';
import { EventsModule } from './events.module';
import { EventsService } from './events.service';
import { EventsServiceMock } from './mocks/events.service';
import { PrismaService } from '@src/database/prisma.service';
import { PrismaServiceMock } from '@src/database/mocks/prisma.service';
import { mockDeep } from 'jest-mock-extended';
import { ReservationService } from '../reservations/reservations.service';
import { ReservationServiceMock } from '../reservations/mocks/reservations.service';
import configuration from '@src/config/configuration';
import { ConfigModule } from '@nestjs/config';
import { ConfigurationModule } from '@src/configuration/configuration.module';
import { DatabaseModule } from '@src/database/database.module';
import { ReservationModule } from '../reservations/reservations.module';

describe('EventsController', () => {
  let controller: EventsController;
  let eventsService: EventsServiceMock;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        EventsModule,
        DatabaseModule,
        ReservationModule,
        ConfigurationModule,
        ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
      ],
      controllers: [EventsController],
    })
      .overrideProvider(PrismaService)
      .useValue(PrismaServiceMock)
      .overrideProvider(ReservationService)
      .useValue(ReservationServiceMock)
      .overrideProvider(EventsService)
      .useValue(EventsServiceMock)
      .compile();

    controller = module.get<EventsController>(EventsController);
    eventsService = module.get(EventsService);
  });

  it('should return a list of customers events', async () => {
    const customerEvents: Event[] = mockDeep<Event[]>([
      {
        id: '4e3f8f9b-4b5f-b8e9-f8c1b5f8e9f8',
        customerId: 'f8c1-b8e9-4b5f-b8e9-f8c1b5f8e9f8',
      },
      {
        id: '4e3f8f9b-f8c1-4b5f-b8e9-f8c1b5f8e9f9',
        customerId: 'b8e9-dd-f8c1-4b5f-b8e9-asd',
      },
      {
        id: '4e3f8f9b-f8c1-4b5f-b8e9-f8c1b5f8e9f10',
        customerId: 'b8e9-f8c1b5f8e9f8-sdf-4b5f-sdf-sdf',
      },
      {
        id: '4e3f8f9b-f8c1-4b5f-b8e9-f8c1b5f8e9f11',
        customerId: 'b8e9-dfsdfsd-f8c1-4b5f-b8e9-f8c1b5f8e9f8',
      },
    ]);

    eventsService.findAll.mockResolvedValueOnce({
      results: customerEvents,
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
      expect(item).toHaveProperty('from');
      expect(item).toHaveProperty('to');
      expect(item).toHaveProperty('fullName');
      expect(item).toHaveProperty('description');
      expect(item).toHaveProperty('lot');
      expect(item).toHaveProperty('changeLog');
      expect(item).toHaveProperty('observations');
      expect(item).toHaveProperty('eventStateId');
      expect(item).toHaveProperty('statesmanId');
      expect(item).toHaveProperty('authorizedUserId');
      expect(item).toHaveProperty('eventTypeId');
      expect(item).toHaveProperty('file');
      expect(item).toHaveProperty('userId');
      expect(item).toHaveProperty('dni');
      expect(item).toHaveProperty('isPermanent');
      expect(item).toHaveProperty('isCopy');
      expect(item).toHaveProperty('firstName');
      expect(item).toHaveProperty('lastName');
      expect(item).toHaveProperty('patent');
      expect(item).toHaveProperty('monitorId');
      expect(item).toHaveProperty('qrCode');
      expect(item).toHaveProperty('token');
      expect(item).toHaveProperty('qrPending');
      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('createdAt');
    });

    expect(pagination).toBeDefined();
    expect(pagination).toBeInstanceOf(Object);
    expect(pagination).toEqual({
      size: customerEvents.length,
      total: customerEvents.length,
      take: 10,
      skip: 0,
    });
  });

  it('should return a event', async () => {
    const event: Event = mockDeep<Event>({
      id: '4e3f8f9b-4b5f-b8e9-f8c1b5f8e9f8',
      customerId: 'f8c1-b8e9-4b5f-b8e9-f8c1b5f8e9f8',
    });

    eventsService.findOne.mockResolvedValueOnce(event);

    const result = await controller.findOne(
      {
        user: {
          id: 'b0273fda-1977-469e-b376-6b49cceb0a6f',
          customerId: 'b0273fda-1977-469e-b376-sdf123sgd',
          role: 'admin',
        },
      },
      '3857e49f-3188-40d2-bfbe-367519ec42df',
      'b0273fda-1977-469e-b376-sdf123sgd',
      {},
    );
    expect(result).toEqual(event);
  });

  it('should update a event', async () => {
    const event = mockDeep<Event>({
      id: '4e3f8f9b-4b5f-b8e9-f8c1b5f8e9f8',
      customerId: 'f8c1-b8e9-4b5f-b8e9-f8c1b5f8e9f8',
      observations: 'se cambio el evento',
      eventStateId: '70df3d00-b373-4fe8-bbcc-aa38ade885dd',
    });

    eventsService.eventUpdateState.mockResolvedValueOnce(event);

    const result = await controller.eventUpdateState(
      {
        user: {
          id: 'b0273fda-1977-469e-b376-6b49cceb0a6f',
          customerId: 'b0273fda-1977-469e-b376-sdf123sgd',
          role: 'admin',
        },
      },
      '3857e49f-3188-40d2-bfbe-367519ec42df',
      'b0273fda-1977-469e-b376-sdf123sgd',
      {
        observations: 'se cambio el evento',
        eventStateId: '70df3d00-b373-4fe8-bbcc-aa38ade885dd',
      },
    );
    expect(result).toEqual(event);
  });
});
