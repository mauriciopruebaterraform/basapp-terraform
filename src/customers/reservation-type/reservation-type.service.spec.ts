import '../../__test__/winston';
import { ReservationType } from '@prisma/client';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@src/database/prisma.service';
import { ReservationTypeService } from './reservation-type.service';
import { PrismaServiceMock } from '@src/database/mocks/prisma.service';
import { mockDeep } from 'jest-mock-extended';
import { UnprocessableEntityException } from '@nestjs/common';
import { errorCodes } from './reservation-type.constants';

describe('ReservationTypeService', () => {
  let service: ReservationTypeService;
  let prisma: PrismaServiceMock;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReservationTypeService,
        {
          provide: PrismaService,
          useValue: PrismaServiceMock,
        },
      ],
    }).compile();

    service = module.get<ReservationTypeService>(ReservationTypeService);
    prisma = module.get(PrismaService);
  });

  it('Get all reservation types from a customer', async () => {
    const mock = mockDeep<ReservationType>({
      id: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
      active: true,
      customerId: '0589141d-ef1c-4c39-a8c7-30aef555003f',
    });

    prisma.reservationType.findMany.mockResolvedValueOnce([mock]);
    prisma.reservationType.count.mockResolvedValueOnce(1);

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

  it('should create reservation type', async () => {
    const Mock = mockDeep<ReservationType>({
      id: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
      code: 'Pileta',
      display: 'day',
      groupCode: 'TE',
      customerId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
    });

    prisma.reservationType.create.mockResolvedValueOnce(Mock);
    prisma.reservationType.count.mockResolvedValueOnce(0);

    const result = await service.create({
      code: 'Pileta',
      display: 'day',
      groupCode: 'TE',
      customerId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
    });

    expect(result).toStrictEqual(Mock);
  });

  it('should throw an error when creating a reservation type', async () => {
    prisma.reservationType.count.mockResolvedValueOnce(1);

    return await expect(
      service.create({
        code: 'Pileta',
        display: 'day',
        groupCode: 'TE',
        customerId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
      }),
    ).rejects.toThrow(
      new UnprocessableEntityException(errorCodes.INVALID_CODE),
    );
  });

  it('should update reservation type', async () => {
    const mock = mockDeep<ReservationType>({
      id: 'e2afa0ab-95d8-4b2a-bc00-6afbe0024145',
      active: false,
      code: 'Pileta',
      customerId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
    });

    prisma.reservationType.findUnique.mockResolvedValueOnce(mock);
    prisma.reservationType.update.mockResolvedValueOnce(mock);

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
