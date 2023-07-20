import '../../__test__/winston';
import { Location } from '@prisma/client';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@src/database/prisma.service';
import { PrismaServiceMock } from '@src/database/mocks/prisma.service';
import { mockDeep } from 'jest-mock-extended';
import { LocationsService } from './locations.service';

describe('LocationsService', () => {
  let service: LocationsService;
  let prisma: PrismaServiceMock;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocationsService,
        {
          provide: PrismaService,
          useValue: PrismaServiceMock,
        },
      ],
    }).compile();

    service = module.get<LocationsService>(LocationsService);
    prisma = module.get(PrismaService);
  });

  describe('customer location', () => {
    it('find all location that customers get it', async () => {
      const locationMock = mockDeep<Location>({
        id: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
        updatedById: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
        active: true,
        customerId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
      });

      prisma.location.findMany.mockResolvedValueOnce([locationMock]);
      prisma.location.count.mockResolvedValueOnce(1);
      const { results, pagination } = await service.findAll({});
      expect(results).toEqual([locationMock]);
      expect(pagination).toEqual({
        total: 1,
        take: 100,
        skip: 0,
        hasMore: false,
        size: 1,
      });
    });

    it('should create location', async () => {
      const locationMock = mockDeep<Location>({
        id: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
        name: '123123123',
        type: 'locality',
        updatedById: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
        customerId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
      });

      prisma.location.create.mockResolvedValueOnce(locationMock);
      prisma.location.count.mockResolvedValueOnce(0);

      const result = await service.create({
        name: '123123123',
        type: 'locality',
        userId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
        customerId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
      });

      expect(result).toMatchObject(locationMock);
    });

    it('should update location', async () => {
      const locationMock = mockDeep<Location>({
        id: 'e2afa0ab-95d8-4b2a-bc00-6afbe0024145',
        updatedById: '70df3d00-b373-4fe8-bbcc-aa98ade885dd',
        active: false,
        customerId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
      });

      prisma.location.count.mockResolvedValueOnce(1);
      prisma.location.findUnique.mockResolvedValueOnce(locationMock);
      prisma.location.update.mockResolvedValueOnce(locationMock);

      const result = await service.update(
        'e2afa0ab-95d8-4b2a-bc00-6afbe0024145',
        {
          active: false,
          customerId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
          userId: '70df3d00-b373-4fe8-bbcc-aa98ade885dd',
        },
      );

      expect(result).toMatchObject(locationMock);
    });
  });
});
