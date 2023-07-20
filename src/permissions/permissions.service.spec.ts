import '../__test__/winston';
/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaServiceMock } from '@src/database/mocks/prisma.service';
import { PrismaService } from '@src/database/prisma.service';
import { errorCodes } from './permissions.constants';
import { PermissionsService } from './permissions.service';

describe('PermissionsService', () => {
  let service: PermissionsService;
  let prisma: PrismaServiceMock;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionsService,
        {
          provide: PrismaService,
          useValue: PrismaServiceMock,
        },
      ],
    }).compile();

    service = module.get<PermissionsService>(PermissionsService);
    prisma = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return permissions', async () => {
    prisma.permission.findMany.mockResolvedValueOnce([
      {
        id: '799c4674-ab27-4bdf-9ff1-a79fd22ab31b',
        action: 'monitor-alert',
        name: 'Monitoreo de alertas',
        category: 'alert',
        statesman: true,
        monitoring: false,
      },
      {
        id: '9ce63e13-0b6b-44b1-9bac-0d69e78633be',
        action: 'list-authorizations',
        name: 'Listar solicitudes de autorización',
        category: 'event',
        statesman: true,
        monitoring: false,
      },
      {
        id: '8d63c567-acf3-49bd-a84a-7a185a690441',
        action: 'create-reservation',
        name: 'Crear reserva',
        category: 'reservation',
        statesman: true,
        monitoring: false,
      },
    ]);
    prisma.permission.count.mockResolvedValueOnce(3);
    const { results, pagination } = await service.findAll({});
    expect(results).toBeDefined();
    expect(results).toBeInstanceOf(Array);

    results.forEach((item) => {
      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('action');
      expect(item).toHaveProperty('name');
      expect(item).toHaveProperty('category');
      expect(item).toHaveProperty('statesman');
      expect(item).toHaveProperty('monitoring');
    });

    expect(pagination).toBeDefined();
    expect(pagination).toEqual({
      hasMore: false,
      take: 100,
      total: 3,
      size: 3,
      skip: 0,
    });
  });

  it('should fail returning permissions', async () => {
    prisma.permission.findMany.mockRejectedValueOnce(new Error('Error'));
    const params = { a: 1 };
    // @ts-ignore
    await expect(service.findAll(params)).rejects.toThrow();
    expect(prisma.permission.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ ...params }),
    );
  });

  it('should count permissions', () => {
    prisma.permission.count.mockResolvedValueOnce(3);
    expect(service.count()).resolves.toBe(3);
  });

  it('should update permission', async () => {
    const permission = {
      id: '799c4674-ab27-4bdf-9ff1-a79fd22ab31b',
      action: 'monitor-alert',
      name: 'Monitoreo de alertas',
      category: 'alert',
      statesman: false,
      monitoring: false,
    };
    prisma.permission.findUnique.mockResolvedValueOnce(permission);

    prisma.permission.update.mockResolvedValueOnce({
      ...permission,
      statesman: true,
    });

    const permissionUpdated = await service.update(
      '799c4674-ab27-4bdf-9ff1-a79fd22ab31b',
      {
        statesman: true,
      },
    );
    expect(permissionUpdated).toBeDefined();
    expect(permissionUpdated).toEqual({
      id: '799c4674-ab27-4bdf-9ff1-a79fd22ab31b',
      action: 'monitor-alert',
      name: 'Monitoreo de alertas',
      category: 'alert',
      statesman: true,
      monitoring: false,
    });
  });

  it('should fail if permission not found', async () => {
    prisma.permission.findUnique.mockResolvedValueOnce(null);

    await expect(
      service.update('799c4674-ab27-4bdf-9ff1-a79fd22ab31b', {
        statesman: true,
      }),
    ).rejects.toThrowError(errorCodes.PERMISSION_NOT_FOUND);
  });

  it('should throw error when update permission', async () => {
    const permission = {
      id: '799c4674-ab27-4bdf-9ff1-a79fd22ab31b',
      action: 'monitor-alert',
      name: 'Monitoreo de alertas',
      category: 'alert',
      statesman: false,
      monitoring: false,
    };
    prisma.permission.findUnique.mockResolvedValueOnce(permission);
    prisma.permission.update.mockRejectedValueOnce(new Error('Error'));
    await expect(
      service.update('799c4674-ab27-4bdf-9ff1-a79fd22ab31b', {
        statesman: true,
      }),
    ).rejects.toThrow('Error');
  });
});
