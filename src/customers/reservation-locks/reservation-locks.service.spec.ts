import '../../__test__/winston';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@src/database/prisma.service';
import { PrismaServiceMock } from '@src/database/mocks/prisma.service';
import { mockDeep } from 'jest-mock-extended';
import { ReservationLocksService } from './reservation-locks.service';
import { ReservationLock } from './entities/reservation-lock.entity';

describe('ReservationLocksService', () => {
  let service: ReservationLocksService;
  let prisma: PrismaServiceMock;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReservationLocksService,
        {
          provide: PrismaService,
          useValue: PrismaServiceMock,
        },
      ],
    }).compile();

    service = module.get<ReservationLocksService>(ReservationLocksService);
    prisma = module.get(PrismaService);
  });

  describe('reservation lock', () => {
    it('find all reservation locks that customers get it', async () => {
      const mock = mockDeep<ReservationLock>({
        id: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
        active: true,
        customerId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
      });

      prisma.reservationLock.findMany.mockResolvedValueOnce([mock]);
      prisma.reservationLock.count.mockResolvedValueOnce(1);

      const { results, pagination } = await service.findAll({});
      expect(results).toEqual([mock]);
      expect(pagination).toEqual({
        total: 1,
        take: 100,
        skip: 0,
        hasMore: false,
        size: 1,
      });
    });

    it('should create reservation lock', async () => {
      const mock = mockDeep<ReservationLock>({
        id: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
        active: true,
        name: 'navidad',
        reservationTypeId: '7a94962c-2c7a-49e9-be59-9e7bd1f5a17c',
        reservationSpaceId: 'b6595d54-5dbf-49d0-b5b9-21725f9fbd90',
        customerId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
      });

      prisma.reservationLock.create.mockResolvedValueOnce(mock);
      prisma.reservationLock.count.mockResolvedValueOnce(0);
      prisma.reservationType.count.mockResolvedValueOnce(1);
      prisma.reservationSpace.count.mockResolvedValueOnce(1);

      const result = await service.create({
        customerId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
        reservationTypeId: '7a94962c-2c7a-49e9-be59-9e7bd1f5a17c',
        reservationSpaceId: 'b6595d54-5dbf-49d0-b5b9-21725f9fbd90',
        name: 'navidad',
      });

      expect(result).toMatchObject(mock);
    });

    it('should update reservation lock', async () => {
      const mock = mockDeep<ReservationLock>({
        id: 'e2afa0ab-95d8-4b2a-bc00-6afbe0024145',
        active: false,
        customerId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
      });

      prisma.reservationLock.count.mockResolvedValueOnce(1);
      prisma.reservationLock.findUnique.mockResolvedValueOnce(mock);
      prisma.reservationLock.update.mockResolvedValueOnce(mock);

      const result = await service.update(
        'e2afa0ab-95d8-4b2a-bc00-6afbe0024145',
        {
          active: false,
          customerId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
        },
      );

      expect(result).toMatchObject(mock);
    });
  });
});
