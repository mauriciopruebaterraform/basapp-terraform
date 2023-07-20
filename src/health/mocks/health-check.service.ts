import { DeepMockProxy, mockDeep, mockReset } from 'jest-mock-extended';
import { HealthCheckService } from '@nestjs/terminus';

beforeEach(() => {
  mockReset(HealthCheckServiceMock);
});

export type HealthCheckServiceMock = DeepMockProxy<HealthCheckService>;

export const HealthCheckServiceMock =
  mockDeep<HealthCheckService>() as unknown as DeepMockProxy<HealthCheckService>;
