import '../__test__/winston';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../database/prisma.service';
import { AlertTypesService } from './alert-types.service';
import { PrismaServiceMock } from '../database/mocks/prisma.service';

describe('AlertTypesService', () => {
  let service: AlertTypesService;
  let prisma: PrismaServiceMock;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AlertTypesService,
        {
          provide: PrismaService,
          useValue: PrismaServiceMock,
        },
      ],
    }).compile();

    service = module.get<AlertTypesService>(AlertTypesService);
    prisma = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return the alert types', async () => {
    prisma.alertType.findMany.mockResolvedValueOnce([
      {
        id: '072b1cc5-f307-4e32-9753-ecb65b5adaa2',
        type: 'panic',
        name: 'Antipánico',
      },
      {
        id: '515aa0d5-1e03-413a-aa05-ed6c48fdc0f8',
        type: 'alarm-activated',
        name: 'Alarma activada',
      },
    ]);
    const result = await service.findAll();
    expect(result).toBeInstanceOf(Array);
    result.forEach((item) => {
      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('name');
      expect(item).toHaveProperty('type');
    });
  });
});
