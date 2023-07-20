import {
  PrismaService,
  PrismaGirovisionService,
} from '@src/database/prisma.service';
import { DeepMockProxy, mockDeep, mockReset } from 'jest-mock-extended';

beforeEach(() => {
  mockReset(PrismaServiceMock);
});

export type PrismaServiceMock = DeepMockProxy<PrismaService>;
export type PrismaGirovisionServiceMock =
  DeepMockProxy<PrismaGirovisionService>;

export const PrismaServiceMock =
  mockDeep<PrismaService>() as unknown as DeepMockProxy<PrismaService>;

export const PrismaGirovisionServiceMock =
  mockDeep<PrismaGirovisionService>() as unknown as DeepMockProxy<PrismaGirovisionService>;
