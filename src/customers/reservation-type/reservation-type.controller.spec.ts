import '../../__test__/winston';
import { ReservationTypeServiceMock } from './mocks/reservation-type.service';
import { ReservationTypeController } from './reservation-type.controller';
import { PrismaService } from '@src/database/prisma.service';
import { ReservationTypeModule } from './reservation-type.module';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaServiceMock } from '@src/database/mocks/prisma.service';
import { ReservationTypeService } from './reservation-type.service';
import { mockDeep } from 'jest-mock-extended';
import { ReservationType } from '@prisma/client';

describe('reservationTypeController', () => {
  let controller: ReservationTypeController;
  let service: ReservationTypeServiceMock;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ReservationTypeModule],
      controllers: [ReservationTypeController],
    })
      .overrideProvider(PrismaService)
      .useValue(PrismaServiceMock)
      .overrideProvider(ReservationTypeService)
      .useValue(ReservationTypeServiceMock)
      .compile();

    controller = module.get<ReservationTypeController>(
      ReservationTypeController,
    );
    service = module.get(ReservationTypeService);
  });

  it('should return a list of reservation type of customers', async () => {
    const mock: ReservationType[] = mockDeep<ReservationType[]>([
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
      expect(item).toHaveProperty('code');
      expect(item).toHaveProperty('days');
      expect(item).toHaveProperty('active');
      expect(item).toHaveProperty('minDays');
      expect(item).toHaveProperty('maxPerMonth');
      expect(item).toHaveProperty('minDaysBetweenReservation');
      expect(item).toHaveProperty('termsAndConditions');
      expect(item).toHaveProperty('display');
      expect(item).toHaveProperty('groupCode');
      expect(item).toHaveProperty('createdAt');
      expect(item).toHaveProperty('updatedAt');
      expect(item).toHaveProperty('customerId');
      expect(item).toHaveProperty('numberOfPending');
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

  it('should create reservation type', async () => {
    expect(controller.create).toBeDefined();

    const Mock = mockDeep<ReservationType>({
      id: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
      code: 'Pileta',
      display: 'day',
      groupCode: 'TE',
      active: true,
      customerId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
    });

    service.create.mockResolvedValueOnce(Mock);

    const result = await controller.create(
      {
        user: {
          id: '234-234-234-234',
          customerId: '123-123-123-123',
        },
      },
      '123-123-123-123',
      {
        code: 'Pileta',
        display: 'day',
        groupCode: 'TE',
      },
    );

    expect(result).toStrictEqual(Mock);
  });

  it('should update reservation type', async () => {
    expect(controller.update).toBeDefined();

    const mock = mockDeep<ReservationType>({
      id: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
      active: false,
      customerId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
    });

    service.update.mockResolvedValueOnce(mock);

    const result = await controller.update(
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

    expect(result).toMatchObject(mock);
  });
});
