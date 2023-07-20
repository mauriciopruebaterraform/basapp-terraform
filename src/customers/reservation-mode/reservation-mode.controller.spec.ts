import '../../__test__/winston';
import { ReservationModeServiceMock } from './mocks/reservation-mode.service';
import { ReservationModeController } from './reservation-mode.controller';
import { PrismaService } from '@src/database/prisma.service';
import { ReservationModeModule } from './reservation-mode.module';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaServiceMock } from '@src/database/mocks/prisma.service';
import { ReservationModeService } from './reservation-mode.service';
import { mockDeep } from 'jest-mock-extended';
import {
  ReservationMode,
  ReservationSpace,
  ReservationSpaceReservationMode,
} from '@prisma/client';

describe('reservationModeController', () => {
  let controller: ReservationModeController;
  let service: ReservationModeServiceMock;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ReservationModeModule],
      controllers: [ReservationModeController],
    })
      .overrideProvider(PrismaService)
      .useValue(PrismaServiceMock)
      .overrideProvider(ReservationModeService)
      .useValue(ReservationModeServiceMock)
      .compile();

    controller = module.get<ReservationModeController>(
      ReservationModeController,
    );
    service = module.get(ReservationModeService);
  });

  it('should return a list of reservation mode of customers', async () => {
    const mock: ReservationMode[] = mockDeep<ReservationMode[]>([
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
      expect(item).toHaveProperty('name');
      expect(item).toHaveProperty('maxDuration');
      expect(item).toHaveProperty('maxPeople');
      expect(item).toHaveProperty('active');
      expect(item).toHaveProperty('attachList');
      expect(item).toHaveProperty('allowGuests');
      expect(item).toHaveProperty('allParticipantsRequired');
      expect(item).toHaveProperty('inactivityTime');
      expect(item).toHaveProperty('createdAt');
      expect(item).toHaveProperty('updatedAt');
      expect(item).toHaveProperty('maxPerMonth');
      expect(item).toHaveProperty('email');
      expect(item).toHaveProperty('reservationTypeId');
      expect(item).toHaveProperty('customerId');
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

    const Mock = mockDeep<
      ReservationMode & {
        reservationSpaces: (ReservationSpaceReservationMode & {
          reservationSpace: ReservationSpace;
        })[];
      }
    >({
      id: '1111ee9a-401c-4cb0-8f0a-8f653eaa848a',
      active: true,
      customerId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
      name: 'Pileta',
      reservationTypeId: '2de3865c-51e2-4270-aa26-2de3865c',
    });

    service.create.mockResolvedValueOnce(Mock);

    const result = await controller.create(
      {
        user: {
          id: '234-234-234-234',
          customerId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
        },
      },
      '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
      {
        name: 'Pileta',
        reservationTypeId: '2de3865c-51e2-4270-aa26-2de3865c',
        reservationSpaces: ['b0273fda-1977-469e-b376-6b49cceb0a6f'],
      },
    );

    expect(result).toStrictEqual(Mock);
  });

  it('should update reservation space', async () => {
    expect(controller.update).toBeDefined();

    const mock = mockDeep<
      ReservationMode & {
        reservationSpaces: (ReservationSpaceReservationMode & {
          reservationSpace: ReservationSpace;
        })[];
      }
    >({
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
