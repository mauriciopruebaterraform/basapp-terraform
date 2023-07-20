import '../../__test__/winston';
import { ReservationServiceMock } from './mocks/reservations.service';
import { ReservationController } from './reservations.controller';
import { PrismaService } from '@src/database/prisma.service';
import { ReservationModule } from './reservations.module';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaServiceMock } from '@src/database/mocks/prisma.service';
import { ReservationService } from './reservations.service';
import { mockDeep } from 'jest-mock-extended';
import { Reservation } from '@prisma/client';
import { PushNotificationServiceMock } from '@src/push-notification/mocks/push-notification.service';
import { PushNotificationService } from '@src/push-notification/push-notification.service';
import { ConfigModule } from '@nestjs/config';
import configuration from '@src/config/configuration';
import { DatabaseModule } from '@src/database/database.module';
import { ConfigurationModule } from '@src/configuration/configuration.module';

describe('reservationController', () => {
  let controller: ReservationController;
  let service: ReservationServiceMock;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ReservationModule,
        DatabaseModule,
        ConfigurationModule,
        ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
      ],
      controllers: [ReservationController],
    })
      .overrideProvider(PrismaService)
      .useValue(PrismaServiceMock)
      .overrideProvider(ReservationService)
      .useValue(ReservationServiceMock)
      .overrideProvider(PushNotificationService)
      .useValue(PushNotificationServiceMock)
      .compile();

    controller = module.get<ReservationController>(ReservationController);
    service = module.get(ReservationService);
  });

  it('should return a list of reservation of customers', async () => {
    const mock: Reservation[] = mockDeep<Reservation[]>([
      {
        id: '4e3f8f9b-4b5f-b8e9-f8c1b5f8e9f8',
        customerId: 'f8c1-b8e9-4b5f-b8e9-f8c1b5f8e9f8',
      },
      {
        id: '4e3f8f9b-f8c1-4b5f-b8e9-f8c1b5f8e9f9',
        customerId: 'f8c1-b8e9-4b5f-b8e9-f8c1b5f8e9f8',
      },
      {
        id: '4e3f8f9b-f8c1-4b5f-b8e9-f8c1b5f8e9f10',
        customerId: 'f8c1-b8e9-4b5f-b8e9-f8c1b5f8e9f8',
      },
      {
        id: '4e3f8f9b-f8c1-4b5f-b8e9-f8c1b5f8e9f11',
        customerId: 'f8c1-b8e9-4b5f-b8e9-f8c1b5f8e9f8',
      },
    ]);

    service.findAll.mockResolvedValueOnce({
      results: mock,
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
          customerId: 'f8c1-b8e9-4b5f-b8e9-f8c1b5f8e9f8',
          role: 'statesman',
        },
      },
      'f8c1-b8e9-4b5f-b8e9-f8c1b5f8e9f8',
      {},
    );
    expect(results).toBeDefined();
    expect(results).toBeInstanceOf(Array);
    expect(results.length).toBe(4);

    results.forEach((item) => {
      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('createdAt');
      expect(item).toHaveProperty('updatedAt');
      expect(item).toHaveProperty('fromDate');
      expect(item).toHaveProperty('toDate');
      expect(item).toHaveProperty('inactiveToDate');
      expect(item).toHaveProperty('cancelDate');
      expect(item).toHaveProperty('numberOfGuests');
      expect(item).toHaveProperty('createdById');
      expect(item).toHaveProperty('lot');
      expect(item).toHaveProperty('userId');
      expect(item).toHaveProperty('authorizedUserId');
      expect(item).toHaveProperty('customerId');
      expect(item).toHaveProperty('reservationTypeId');
      expect(item).toHaveProperty('reservationModeId');
      expect(item).toHaveProperty('reservationSpaceId');
      expect(item).toHaveProperty('eventStateId');
      expect(item).toHaveProperty('file');
      expect(item).toHaveProperty('noUser');
    });

    expect(pagination).toBeDefined();
    expect(pagination).toBeInstanceOf(Object);
    expect(pagination).toEqual({
      size: mock.length,
      total: mock.length,
      take: 10,
      skip: 0,
    });
  });

  it('should return a reservation', async () => {
    const reservation: Reservation = mockDeep<Reservation>({
      id: '4e3f8f9b-4b5f-b8e9-f8c1b5f8e9f8',
      customerId: 'f8c1-b8e9-4b5f-b8e9-f8c1b5f8e9f8',
    });

    service.findOne.mockResolvedValueOnce(reservation);

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
    expect(result).toEqual(reservation);
  });
});
