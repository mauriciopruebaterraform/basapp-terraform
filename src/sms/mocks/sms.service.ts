import { ConfigService } from '@nestjs/config';
import { SmsService } from '../sms.service';
import { DeepMockProxy, mockDeep, mockReset } from 'jest-mock-extended';

beforeEach(() => {
  mockReset(SmsServiceMock);
  mockReset(ConfigServiceMock);
  SmsServiceMock.send.mockResolvedValue('');
});

export type SmsServiceMock = DeepMockProxy<SmsService>;

export const SmsServiceMock =
  mockDeep<SmsService>() as unknown as DeepMockProxy<SmsService>;

export type ConfigServiceMock = DeepMockProxy<ConfigService>;

export const ConfigServiceMock =
  mockDeep<ConfigService>() as unknown as DeepMockProxy<ConfigService>;
