import { DeepMockProxy, mockDeep, mockReset } from 'jest-mock-extended';
import { HttpService } from '@nestjs/axios';

beforeEach(() => {
  mockReset(HttpServiceMock);
});

export type HttpServiceMock = DeepMockProxy<HttpService>;

export const HttpServiceMock =
  mockDeep<HttpService>() as unknown as DeepMockProxy<HttpService>;
