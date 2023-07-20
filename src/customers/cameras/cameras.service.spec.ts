import '../../__test__/winston';
import { Camera } from '@prisma/client';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@src/database/prisma.service';
import { CamerasService } from './cameras.service';
import { PrismaServiceMock } from '@src/database/mocks/prisma.service';
import { mockDeep } from 'jest-mock-extended';

describe('CamerasService', () => {
  let service: CamerasService;
  let prisma: PrismaServiceMock;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CamerasService,
        {
          provide: PrismaService,
          useValue: PrismaServiceMock,
        },
      ],
    }).compile();

    service = module.get<CamerasService>(CamerasService);
    prisma = module.get(PrismaService);
  });

  describe('customer camera', () => {
    it('find all cameras that customers get it', async () => {
      const cameraMock = mockDeep<Camera>({
        id: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
        updatedById: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
        active: true,
        customerId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
      });

      prisma.camera.findMany.mockResolvedValueOnce([cameraMock]);
      prisma.camera.count.mockResolvedValueOnce(1);
      const { results, pagination } = await service.findAll({});
      expect(results).toEqual([cameraMock]);
      expect(pagination).toEqual({
        total: 1,
        take: 100,
        skip: 0,
        hasMore: false,
        size: 1,
      });
    });

    it('should create', async () => {
      const cameraMock = mockDeep<Camera>({
        id: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
        code: '123123123',
        geolocation: {
          lat: '32',
          lng: '54',
        },
        description: 'test',
        url: 'url',
        updatedById: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
        customerId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
      });

      prisma.camera.create.mockResolvedValueOnce(cameraMock);
      prisma.camera.count.mockResolvedValueOnce(0);

      const result = await service.create({
        code: '123123123',
        geolocation: {
          lat: '32',
          lng: '54',
        },
        description: 'test',
        url: 'url',
        userId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
        customerId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
      });

      expect(result).toMatchObject(cameraMock);
    });

    it('update camera', async () => {
      const cameraMock = mockDeep<Camera>({
        id: 'e2afa0ab-95d8-4b2a-bc00-6afbe0024145',
        updatedById: '70df3d00-b373-4fe8-bbcc-aa98ade885dd',
        active: false,
        customerId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
      });

      prisma.camera.count.mockResolvedValueOnce(1);
      prisma.camera.findUnique.mockResolvedValueOnce(cameraMock);
      prisma.camera.update.mockResolvedValueOnce(cameraMock);

      const result = await service.update(
        'e2afa0ab-95d8-4b2a-bc00-6afbe0024145',
        {
          active: false,
          customerId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
          userId: '70df3d00-b373-4fe8-bbcc-aa98ade885dd',
        },
      );

      expect(result).toMatchObject(cameraMock);
    });
  });
});
