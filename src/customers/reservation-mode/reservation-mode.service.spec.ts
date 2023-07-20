import '../../__test__/winston';
import {
  ReservationMode,
  ReservationSpaceReservationMode,
  ReservationSpace,
} from '@prisma/client';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@src/database/prisma.service';
import { ReservationModeService } from './reservation-mode.service';
import { PrismaServiceMock } from '@src/database/mocks/prisma.service';
import { mockDeep } from 'jest-mock-extended';

describe('ReservationModeService', () => {
  let service: ReservationModeService;
  let prisma: PrismaServiceMock;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReservationModeService,
        {
          provide: PrismaService,
          useValue: PrismaServiceMock,
        },
      ],
    }).compile();

    service = module.get<ReservationModeService>(ReservationModeService);
    prisma = module.get(PrismaService);
  });

  it('Get all reservation modes from a customer', async () => {
    const mock = mockDeep<ReservationMode>({
      id: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
      active: true,
      customerId: '0589141d-ef1c-4c39-a8c7-30aef555003f',
    });

    prisma.reservationMode.findMany.mockResolvedValueOnce([mock]);
    prisma.reservationMode.count.mockResolvedValueOnce(1);

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

  it('should create reservation space', async () => {
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
      reservationTypeId: '2de3865c-51e2-4270-aa26-2de3865c',
      name: 'Pileta',
    });

    prisma.reservationMode.create.mockResolvedValueOnce(Mock);
    prisma.reservationSpace.count.mockResolvedValueOnce(1);
    prisma.reservationType.count.mockResolvedValueOnce(1);

    const result = await service.create({
      customerId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
      reservationTypeId: '2de3865c-51e2-4270-aa26-2de3865c',
      name: 'Pileta',
      reservationSpaces: ['5884e214-5e28-4ad5-a334-9b0388175b82'],
      userId: '6addd5b6-0fef-4641-bd04-0ede80dfa0ca',
    });

    expect(result).toStrictEqual(Mock);
  });

  it('should update reservation mode', async () => {
    const mock = mockDeep<ReservationMode>({
      id: 'e2afa0ab-95d8-4b2a-bc00-6afbe0024145',
      active: false,
      name: 'Pileta',
      customerId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
    });

    prisma.reservationMode.findUnique.mockResolvedValueOnce(mock);
    prisma.reservationMode.update.mockResolvedValueOnce(mock);
    prisma.reservationSpace.count.mockResolvedValueOnce(1);
    prisma.reservationType.count.mockResolvedValueOnce(1);

    const result = await service.update(
      'e2afa0ab-95d8-4b2a-bc00-6afbe0024145',
      {
        active: false,
        name: 'Pileta',
        userId: '5884e214-5e28-4ad5-a334-9b0388175b82',
        customerId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
      },
    );

    expect(result).toMatchObject(mock);
  });
});
