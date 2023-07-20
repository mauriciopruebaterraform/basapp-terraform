import '../__test__/winston';
import { DatabaseModule } from '@src/database/database.module';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaServiceMock } from '@src/database/mocks/prisma.service';
import { PrismaService } from '@src/database/prisma.service';
import { PermissionsController } from './permissions.controller';
import { PermissionsModule } from './permissions.module';
import { PermissionsService } from './permissions.service';
import { PermissionsServiceMock } from './mocks/permissions.service';

describe('PermissionsController', () => {
  let controller: PermissionsController;
  let service: PermissionsServiceMock;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [DatabaseModule, PermissionsModule],
      controllers: [PermissionsController],
      providers: [PermissionsService],
    })
      .overrideProvider(PrismaService)
      .useValue(PrismaServiceMock)
      .overrideProvider(PermissionsService)
      .useValue(PermissionsServiceMock)
      .compile();

    controller = module.get<PermissionsController>(PermissionsController);
    service = module.get(PermissionsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return a complete list of permissions', async () => {
    const { results, pagination } = await controller.findAll({});
    expect(results).toBeDefined();
    expect(results).toBeInstanceOf(Array);
    expect(results.length).toBe(4);

    results.forEach((item) => {
      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('name');
      expect(item).toHaveProperty('action');
      expect(item).toHaveProperty('statesman');
      expect(item).toHaveProperty('monitoring');
    });

    expect(pagination).toBeDefined();
    expect(pagination).toBeInstanceOf(Object);
    expect(pagination).toEqual({
      hasMore: false,
      take: 100,
      skip: 0,
      size: 4,
      total: 4,
    });
  });

  it('should return statesman permissions', async () => {
    const req = {
      where: {
        statesman: true,
      },
    };
    const { results, pagination } = await controller.findAll(req);
    expect(results).toBeDefined();
    expect(results).toBeInstanceOf(Array);
    expect(results.length).toBe(2);
    results.forEach((item) => {
      expect(item).toMatchObject({
        statesman: true,
      });
    });

    expect(pagination).toBeDefined();
    expect(pagination).toBeInstanceOf(Object);
    expect(pagination).toEqual({
      hasMore: false,
      take: 100,
      skip: 0,
      size: 2,
      total: 2,
    });
  });

  it('should return monitoring permissions', async () => {
    const req = {
      where: {
        monitoring: true,
      },
    };
    const { results, pagination } = await controller.findAll(req);
    expect(results).toBeDefined();
    expect(results).toBeInstanceOf(Array);
    expect(results.length).toBe(2);
    results.forEach((item) => {
      expect(item).toMatchObject({
        statesman: false,
      });
    });

    expect(pagination).toBeDefined();
    expect(pagination).toBeInstanceOf(Object);
    expect(pagination).toEqual({
      hasMore: false,
      take: 100,
      skip: 0,
      size: 2,
      total: 2,
    });
  });

  it('should update a permission', async () => {
    service.update.mockResolvedValueOnce({
      id: '799c4674-ab27-4bdf-9ff1-a79fd22ab31b',
      action: 'monitor-alert',
      name: 'Monitoreo de alertas',
      category: 'alert',
      statesman: true,
      monitoring: false,
    });
    const result = await controller.update(
      '799c4674-ab27-4bdf-9ff1-a79fd22ab31b',
      {
        statesman: true,
        monitoring: false,
      },
    );
    expect(result).toBeDefined();
    expect(result).toEqual({
      id: '799c4674-ab27-4bdf-9ff1-a79fd22ab31b',
      action: 'monitor-alert',
      name: 'Monitoreo de alertas',
      category: 'alert',
      statesman: true,
      monitoring: false,
    });
  });
});
