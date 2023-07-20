import '../../__test__/winston';
import { Protocol } from '@prisma/client';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@src/database/prisma.service';
import { ProtocolsService } from './protocols.service';
import { PrismaServiceMock } from '@src/database/mocks/prisma.service';
import { mockDeep } from 'jest-mock-extended';

describe('ProtocolsService', () => {
  let service: ProtocolsService;
  let prisma: PrismaServiceMock;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProtocolsService,
        {
          provide: PrismaService,
          useValue: PrismaServiceMock,
        },
      ],
    }).compile();

    service = module.get<ProtocolsService>(ProtocolsService);
    prisma = module.get(PrismaService);
  });

  describe('customer protocol', () => {
    it('find all protocols that customers get it', async () => {
      const protocolsMock = mockDeep<Protocol>({
        id: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
        updatedById: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
        active: true,
        customerId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
      });

      prisma.protocol.findMany.mockResolvedValueOnce([protocolsMock]);
      prisma.protocol.count.mockResolvedValueOnce(1);
      const { results, pagination } = await service.findAll({});
      expect(results).toEqual([protocolsMock]);
      expect(pagination).toEqual({
        total: 1,
        take: 100,
        skip: 0,
        hasMore: false,
        size: 1,
      });
    });

    it('should create protocol', async () => {
      const Mock = mockDeep<Protocol>({
        id: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
        title: '123123123',
        code: 'locality',
        updatedById: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
        customerId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
      });

      prisma.protocol.create.mockResolvedValueOnce(Mock);
      prisma.protocol.count.mockResolvedValueOnce(0);

      const result = await service.create({
        title: '123123123',
        code: 'locality',
        userId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
        customerId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
      });

      expect(result).toStrictEqual(Mock);
    });

    it('should update protocol', async () => {
      const mock = mockDeep<Protocol>({
        id: 'e2afa0ab-95d8-4b2a-bc00-6afbe0024145',
        updatedById: '70df3d00-b373-4fe8-bbcc-aa98ade885dd',
        active: false,
        title: 'prueba',
        code: 'prueba',
        customerId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
      });

      prisma.protocol.count.mockResolvedValueOnce(1);
      prisma.protocol.findUnique.mockResolvedValueOnce(mock);
      prisma.protocol.update.mockResolvedValueOnce(mock);

      const result = await service.update(
        'e2afa0ab-95d8-4b2a-bc00-6afbe0024145',
        {
          active: false,
          userId: '70df3d00-b373-4fe8-bbcc-aa98ade885dd',
        },
      );

      expect(result).toMatchObject(mock);
    });
  });
});
