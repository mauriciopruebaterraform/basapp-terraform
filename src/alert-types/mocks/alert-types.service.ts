import { AlertTypesService } from '@src/alert-types/alert-types.service';
import { DeepMockProxy, mockDeep, mockReset } from 'jest-mock-extended';
import { AlertType } from '../entities/alert-type.entity';

beforeEach(() => {
  mockReset(AlertTypesServiceMock);

  AlertTypesServiceMock.findAll.mockImplementation((): any => {
    const alerts = mockDeep<AlertType[]>([
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
    return Promise.resolve(alerts);
  });
});

export type AlertTypesServiceMock = DeepMockProxy<AlertTypesService>;

export const AlertTypesServiceMock =
  mockDeep<AlertTypesService>() as unknown as DeepMockProxy<AlertTypesService>;
