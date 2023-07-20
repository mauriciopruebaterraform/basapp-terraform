import { DeepMockProxy, mockDeep, mockReset } from 'jest-mock-extended';
import { S3Service } from '../s3.service';

beforeEach(() => {
  mockReset(S3ServiceMock);
});

export type S3ServiceMock = DeepMockProxy<S3Service>;

export const S3ServiceMock =
  mockDeep<S3Service>() as unknown as DeepMockProxy<S3Service>;
