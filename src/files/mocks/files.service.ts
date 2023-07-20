import { DeepMockProxy, mockDeep, mockReset } from 'jest-mock-extended';
import { FilesUploadService } from '../files.service';

beforeEach(() => {
  mockReset(FilesUploadServiceMock);
});

export type FilesUploadServiceMock = DeepMockProxy<FilesUploadService>;

export const FilesUploadServiceMock =
  mockDeep<FilesUploadService>() as unknown as DeepMockProxy<FilesUploadService>;
