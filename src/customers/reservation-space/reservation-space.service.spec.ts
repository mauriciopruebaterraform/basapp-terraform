import '../../__test__/winston';
import { ReservationSpace } from '@prisma/client';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@src/database/prisma.service';
import { ReservationSpaceService } from './reservation-space.service';
import { PrismaServiceMock } from '@src/database/mocks/prisma.service';
import { mockDeep } from 'jest-mock-extended';

describe('ReservationSpaceService', () => {
  let service: ReservationSpaceService;
  let prisma: PrismaServiceMock;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReservationSpaceService,
        {
          provide: PrismaService,
          useValue: PrismaServiceMock,
        },
      ],
    }).compile();

    service = module.get<ReservationSpaceService>(ReservationSpaceService);
    prisma = module.get(PrismaService);
  });

  it('Get all reservation spaces from a customer', async () => {
    const mock = mockDeep<ReservationSpace>({
      id: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
      active: true,
      customerId: '0589141d-ef1c-4c39-a8c7-30aef555003f',
    });

    prisma.reservationSpace.findMany.mockResolvedValueOnce([mock]);
    prisma.reservationSpace.count.mockResolvedValueOnce(1);

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
    const Mock = mockDeep<ReservationSpace>({
      id: '1111ee9a-401c-4cb0-8f0a-8f653eaa848a',
      active: true,
      customerId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
      code: '3SUM Tarde',
      schedule: {
        mon: { from: '1400', to: '1800' },
        tue: { from: '1400', to: '1800' },
        wed: { from: '1400', to: '1800' },
        thu: { from: '1400', to: '1800' },
        fri: { from: '1400', to: '1800' },
        sat: { from: '1400', to: '1800' },
        sun: { from: '1400', to: '1800' },
      },
      additionalNumbers: '[]',
      eventTypeId: '2de3865c-51e2-4270-aa26-8f653eaa848a',
      reservationTypeId: '2de3865c-51e2-4270-aa26-2de3865c',
    });

    prisma.reservationSpace.create.mockResolvedValueOnce(Mock);
    prisma.reservationSpace.count.mockResolvedValueOnce(0);
    prisma.eventType.count.mockResolvedValueOnce(1);
    prisma.reservationType.count.mockResolvedValueOnce(1);

    const result = await service.create({
      customerId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
      code: '3SUM Tarde',
      schedule: {
        mon: { from: '1400', to: '1800' },
        tue: { from: '1400', to: '1800' },
        wed: { from: '1400', to: '1800' },
        thu: { from: '1400', to: '1800' },
        fri: { from: '1400', to: '1800' },
        sat: { from: '1400', to: '1800' },
        holiday: { from: '1400', to: '1800' },
        holidayEve: { from: '1400', to: '1800' },
        sun: { from: '1400', to: '1800' },
      },
      additionalNumbers: '[]',
      eventTypeId: '2de3865c-51e2-4270-aa26-8f653eaa848a',
      reservationTypeId: '2de3865c-51e2-4270-aa26-2de3865c',
    });

    expect(result).toStrictEqual(Mock);
  });

  it('should update reservation spcae', async () => {
    const mock = mockDeep<ReservationSpace>({
      id: 'e2afa0ab-95d8-4b2a-bc00-6afbe0024145',
      active: false,
      code: 'Pileta',
      customerId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
    });

    prisma.reservationSpace.findUnique.mockResolvedValueOnce(mock);
    prisma.reservationSpace.update.mockResolvedValueOnce(mock);

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
