import '../../__test__/winston';
import { Lot } from '@prisma/client';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@src/database/prisma.service';
import { LotsService } from './lots.service';
import { PrismaServiceMock } from '@src/database/mocks/prisma.service';
import { mock, mockDeep } from 'jest-mock-extended';
import { CsvModule } from 'nest-csv-parser';
import * as fs from 'fs';

describe('LotsService', () => {
  let service: LotsService;
  let prisma: PrismaServiceMock;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [CsvModule],
      providers: [
        LotsService,
        {
          provide: PrismaService,
          useValue: PrismaServiceMock,
        },
      ],
    }).compile();

    service = module.get<LotsService>(LotsService);
    prisma = module.get(PrismaService);
  });

  describe('customer lots', () => {
    it('find all lots that customers get it', async () => {
      const lotMock = mockDeep<Lot>({
        id: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
        updatedById: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
        active: true,
        customerId: '0589141d-ef1c-4c39-a8c7-30aef555003f',
      });

      prisma.lot.findMany.mockResolvedValueOnce([lotMock]);
      prisma.lot.count.mockResolvedValueOnce(1);
      const { results, pagination } = await service.findAll({});
      expect(results).toEqual([lotMock]);
      expect(pagination).toEqual({
        total: 1,
        take: 100,
        skip: 0,
        hasMore: false,
        size: 1,
      });
    });

    it('should create lot', async () => {
      const Mock = mockDeep<Lot>({
        id: '37b1b635-3591-4414-9964-87cb32dcab0b',
        lot: 'Golf House',
        latitude: '-34.406696',
        longitude: '-58.825858',
        updatedById: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
        customerId: '0589141d-ef1c-4c39-a8c7-30aef555003f',
      });

      prisma.lot.create.mockResolvedValueOnce(Mock);
      prisma.lot.count.mockResolvedValueOnce(0);

      const result = await service.create({
        lot: 'Golf House',
        latitude: '-34.406696',
        longitude: '-58.825858',
        userId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
        customerId: '0589141d-ef1c-4c39-a8c7-30aef555003f',
      });

      expect(result).toStrictEqual(Mock);
    });

    it('should update lot', async () => {
      const mock = mockDeep<Lot>({
        id: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
        updatedById: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
        lot: 'Golf House',
        latitude: '-34.406696',
        longitude: '-58.825858',
        active: false,
        customerId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
      });

      prisma.lot.count.mockResolvedValueOnce(1);
      prisma.lot.findUnique.mockResolvedValueOnce(mock);
      prisma.lot.update.mockResolvedValueOnce(mock);

      const result = await service.update(
        'e2afa0ab-95d8-4b2a-bc00-6afbe0024145',
        {
          active: false,
          userId: '70df3d00-b373-4fe8-bbcc-aa98ade885dd',
        },
      );

      expect(result).toMatchObject(mock);
    });

    it('should import many new lots', async () => {
      const buffer = Buffer.from(
        fs.readFileSync(`${__dirname}/mocks/upload-lots.csv`),
      );
      const file = mock<Express.Multer.File>({
        originalname: 'upload-lots.csv',
        mimetype: 'text/csv',
      });

      prisma.lot.createMany.mockResolvedValueOnce({ count: 2 });
      const result = await service.loadCsv(
        { ...file, buffer },
        '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
        '23435ee9a-401c-4cb0-8f0a-4a9ef4811e21',
      );

      expect(result).toStrictEqual({ count: 2 });
    });
  });
});
