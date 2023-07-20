import { PermissionsService } from '@src/permissions/permissions.service';
import { DeepMockProxy, mockDeep, mockReset } from 'jest-mock-extended';
import { Permission } from '../entities/permission.entity';

beforeEach(() => {
  mockReset(PermissionsServiceMock);

  PermissionsServiceMock.findAll.mockImplementation((filters): any => {
    let alerts = mockDeep<Permission[]>([
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
        statesman: false,
        monitoring: true,
      },
      {
        id: '86f1512e-93d9-4e2f-92c1-31002e83d1fb',
        action: 'modify-authorized-user',
        name: 'Modificar usuarios habilitados',
        category: 'user',
        statesman: false,
        monitoring: true,
      },
    ]);

    if (filters?.where) {
      if (filters.where.statesman) {
        alerts = alerts.filter((alert) => alert.statesman);
      }
      if (filters.where.monitoring) {
        alerts = alerts.filter((alert) => alert.monitoring);
      }
    }

    return Promise.resolve({
      results: alerts,
      pagination: {
        size: alerts.length,
        total: alerts.length,
        skip: 0,
        take: 100,
        hasMore: false,
      },
    });
  });
});

export type PermissionsServiceMock = DeepMockProxy<PermissionsService>;

export const PermissionsServiceMock =
  mockDeep<PermissionsService>() as unknown as DeepMockProxy<PermissionsService>;
