import '../../__test__/winston';
import { CustomerHolidays as Holiday } from '@prisma/client';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@src/database/prisma.service';
import { PrismaServiceMock } from '@src/database/mocks/prisma.service';
import { mockDeep } from 'jest-mock-extended';
import { HolidaysService } from './holidays.service';

describe('HolidaysService', () => {
  let service: HolidaysService;
  let prisma: PrismaServiceMock;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HolidaysService,
        {
          provide: PrismaService,
          useValue: PrismaServiceMock,
        },
      ],
    }).compile();

    service = module.get<HolidaysService>(HolidaysService);
    prisma = module.get(PrismaService);
  });

  describe('customer holiday', () => {
    it('find all holiday that customers get it', async () => {
      const holidayMock = mockDeep<Holiday>({
        id: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
        active: true,
        customerId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
      });

      prisma.customerHolidays.findMany.mockResolvedValueOnce([holidayMock]);
      prisma.customerHolidays.count.mockResolvedValueOnce(1);

      const { results, pagination } = await service.findAll({});
      expect(results).toEqual([holidayMock]);
      expect(pagination).toEqual({
        total: 1,
        take: 100,
        skip: 0,
        hasMore: false,
        size: 1,
      });
    });

    it('should create holiday', async () => {
      const holidayMock = mockDeep<Holiday>({
        id: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
        customerId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
      });

      prisma.customerHolidays.create.mockResolvedValueOnce(holidayMock);
      prisma.customerHolidays.count.mockResolvedValueOnce(0);

      const result = await service.create({
        date: new Date(),
        customerId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
      });

      expect(result).toMatchObject(holidayMock);
    });

    it('should update holiday', async () => {
      const holidayMock = mockDeep<Holiday>({
        id: 'e2afa0ab-95d8-4b2a-bc00-6afbe0024145',
        active: false,
        customerId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
      });

      prisma.customerHolidays.count.mockResolvedValueOnce(1);
      prisma.customerHolidays.findUnique.mockResolvedValueOnce(holidayMock);
      prisma.customerHolidays.update.mockResolvedValueOnce(holidayMock);

      const result = await service.update(
        'e2afa0ab-95d8-4b2a-bc00-6afbe0024145',
        {
          active: false,
          customerId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
        },
      );

      expect(result).toMatchObject(holidayMock);
    });
  });
});
