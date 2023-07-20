import '../../__test__/winston';
import { ReservationLock } from './entities/reservation-lock.entity';
import { Test, TestingModule } from '@nestjs/testing';
import { ReservationLocksController } from './reservation-locks.controller';
import { ReservationLocksModule } from './reservation-locks.module';
import { ReservationLocksService } from './reservation-locks.service';
import { ReservationLocksServiceMock } from './mocks/reservation-locks.service';
import { PrismaService } from '@src/database/prisma.service';
import { PrismaServiceMock } from '@src/database/mocks/prisma.service';
import { mockDeep } from 'jest-mock-extended';

describe('ReservationLocksController', () => {
  let controller: ReservationLocksController;
  let service: ReservationLocksServiceMock;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ReservationLocksModule],
      controllers: [ReservationLocksController],
    })
      .overrideProvider(PrismaService)
      .useValue(PrismaServiceMock)
      .overrideProvider(ReservationLocksService)
      .useValue(ReservationLocksServiceMock)
      .compile();

    controller = module.get<ReservationLocksController>(
      ReservationLocksController,
    );
    service = module.get(ReservationLocksService);
  });

  it('should return a list of reservation locks', async () => {
    const reservationLocksMock: ReservationLock[] = mockDeep<ReservationLock[]>(
      [
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
      ],
    );

    service.findAll.mockResolvedValueOnce({
      results: reservationLocksMock,
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
      expect(item).toHaveProperty('type');
      expect(item).toHaveProperty('name');
      expect(item).toHaveProperty('customerId');
    });

    expect(pagination).toBeDefined();
    expect(pagination).toBeInstanceOf(Object);
    expect(pagination).toEqual({
      size: reservationLocksMock.length,
      total: reservationLocksMock.length,
      take: 10,
      skip: 0,
    });
  });

  it('should create reservation lock', async () => {
    expect(controller.create).toBeDefined();

    const reservationLockMock = mockDeep<ReservationLock>({
      id: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
      active: true,
      name: 'navidad',
      reservationTypeId: '7a94962c-2c7a-49e9-be59-9e7bd1f5a17c',
      reservationSpaceId: 'b6595d54-5dbf-49d0-b5b9-21725f9fbd90',
      customerId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
    });

    service.create.mockResolvedValueOnce(reservationLockMock);

    const result = await controller.create(
      {
        user: {
          id: '234-234-234-234',
          customerId: '123-123-123-123',
        },
      },
      '123-123-123-123',
      {
        name: 'navidad',
        reservationTypeId: '7a94962c-2c7a-49e9-be59-9e7bd1f5a17c',
        reservationSpaceId: 'b6595d54-5dbf-49d0-b5b9-21725f9fbd90',
      },
    );

    expect(result).toMatchObject(reservationLockMock);
  });

  it('should update reservation lock', async () => {
    expect(controller.update).toBeDefined();

    const reservationLockMock = mockDeep<ReservationLock>({
      id: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
      active: false,
      name: 'navidad',
      reservationTypeId: '7a94962c-2c7a-49e9-be59-9e7bd1f5a17c',
      reservationSpaceId: 'b6595d54-5dbf-49d0-b5b9-21725f9fbd90',
      customerId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
    });

    service.update.mockResolvedValueOnce(reservationLockMock);

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

    expect(result).toMatchObject(reservationLockMock);
  });
});
