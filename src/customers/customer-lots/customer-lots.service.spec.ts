import '../../__test__/winston';
import { CustomerLot } from '@prisma/client';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@src/database/prisma.service';
import { CustomerLotsService } from './customer-lots.service';
import { PrismaServiceMock } from '@src/database/mocks/prisma.service';
import { mock, mockDeep } from 'jest-mock-extended';
import { CsvModule } from 'nest-csv-parser';
import * as fs from 'fs';

describe('CustomerLotsService', () => {
  let service: CustomerLotsService;
  let prisma: PrismaServiceMock;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [CsvModule],
      providers: [
        CustomerLotsService,
        {
          provide: PrismaService,
          useValue: PrismaServiceMock,
        },
      ],
    }).compile();

    service = module.get<CustomerLotsService>(CustomerLotsService);
    prisma = module.get(PrismaService);
  });

  describe('customer customerLot', () => {
    it('find all customerLots that customers get it', async () => {
      const customerLotMock = mockDeep<CustomerLot>({
        id: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
        customerId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
      });

      prisma.customerLot.findMany.mockResolvedValueOnce([customerLotMock]);
      prisma.customerLot.count.mockResolvedValueOnce(1);
      const { results, pagination } = await service.findAll({});
      expect(results).toEqual([customerLotMock]);
      expect(pagination).toEqual({
        total: 1,
        take: 100,
        skip: 0,
        hasMore: false,
        size: 1,
      });
    });

    it('should create customer lot', async () => {
      const customerLotMock = mockDeep<CustomerLot>({
        id: '4e3f8f9b-4b5f-b8e9-f8c1b5f8e9f8',
        customerId: 'f8c1-b8e9-4b5f-b8e9-f8c1b5f8e9f8',
        icmLot: 'SI100',
      });

      prisma.customerLot.count.mockResolvedValueOnce(1);
      prisma.customer.count.mockResolvedValueOnce(1);
      prisma.customerLot.create.mockResolvedValueOnce(customerLotMock);

      const result = await service.create({
        customerId: 'f8c1-b8e9-4b5f-b8e9-f8c1b5f8e9f8',
        icmLot: 'SI100',
      });

      expect(result).toMatchObject(customerLotMock);
    });

    it('update customer lot', async () => {
      const customerLotMock = mockDeep<CustomerLot>({
        id: '4e3f8f9b-4b5f-b8e9-f8c1b5f8e9f8',
        customerId: 'f8c1-b8e9-4b5f-b8e9-f8c1b5f8e9f8',
        icmLot: 'SI100',
      });

      prisma.customerLot.findUnique.mockResolvedValueOnce(customerLotMock);
      prisma.customer.count.mockResolvedValueOnce(1);
      prisma.customerLot.update.mockResolvedValueOnce(customerLotMock);

      const result = await service.update(
        'e2afa0ab-95d8-4b2a-bc00-6afbe0024145',
        {
          customerId: 'f8c1-b8e9-4b5f-b8e9-f8c1b5f8e9f8',
          icmLot: 'SI100',
        },
      );

      expect(result).toMatchObject(customerLotMock);
    });

    it('should import many new lots', async () => {
      const buffer = Buffer.from(
        fs.readFileSync(`${__dirname}/mocks/icm-lots.csv`),
      );
      const file = mock<Express.Multer.File>({
        originalname: 'icm-lots.csv',
        mimetype: 'text/csv',
      });

      prisma.customerLot.createMany.mockResolvedValueOnce({ count: 2 });
      prisma.customer.count.mockResolvedValueOnce(1);
      const result = await service.loadCsv(
        { ...file, buffer },
        '23435ee9a-401c-4cb0-8f0a-4a9ef4811e21',
      );

      expect(result).toStrictEqual({ count: 2 });
    });
  });
});
