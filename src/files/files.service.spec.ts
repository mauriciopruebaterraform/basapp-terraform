import '../__test__/winston';
import { S3ServiceMock } from './mocks/s3.service';
/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Test, TestingModule } from '@nestjs/testing';
import { DeepMockProxy, mock } from 'jest-mock-extended';
import { errorCodes } from './files.constants';
import { FilesUploadService } from './files.service';
import * as sharp from 'sharp';
import { FILE_ADAPTER } from '@src/app.constants';
import { FileAdapter } from '@src/interfaces/types';

jest.mock('sharp');

describe('FileUploadService', () => {
  let fileAdapter: DeepMockProxy<FileAdapter>;
  let provider: FilesUploadService;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: FILE_ADAPTER,
          useValue: S3ServiceMock,
        },
        FilesUploadService,
      ],
    }).compile();
    provider = module.get<FilesUploadService>(FilesUploadService);
    fileAdapter = module.get<S3ServiceMock>(FILE_ADAPTER);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });

  it('should generate thumbnail', async () => {
    const file = mock<Express.Multer.File>({
      buffer: Buffer.from('error'),
      mimetype: 'image/jpeg',
    });

    (sharp as unknown as jest.Mock).mockReturnValue({
      resize: jest.fn().mockReturnValue({
        withMetadata: jest.fn().mockReturnValue({
          toBuffer: jest
            .fn()
            .mockImplementation(() => Buffer.from('thumbnail')),
        }),
      }),
    });

    const thumbnail = await provider.generateThumbnail(file, 100, 100);
    expect(thumbnail).toEqual(Buffer.from('thumbnail'));
  });

  it('should throw if cannot generate thumbnail', async () => {
    const file = mock<Express.Multer.File>();
    (sharp as unknown as jest.Mock).mockReturnValue({
      resize: jest.fn().mockImplementation(() => {
        throw new Error('error');
      }),
    });

    await expect(provider.generateThumbnail(file, 100, 100)).rejects.toThrow(
      errorCodes.THUMBNAIL_GENERATION_ERROR,
    );
  });

  it('should upload file and thumbnail', async () => {
    const file = mock<Express.Multer.File>({
      buffer: Buffer.from('file'),
      originalname: 'file.jpg',
      mimetype: 'image/jpeg',
    });

    (sharp as unknown as jest.Mock).mockReturnValue({
      resize: jest.fn().mockReturnValue({
        withMetadata: jest.fn().mockReturnValue({
          toBuffer: jest
            .fn()
            .mockImplementation(() => Buffer.from('thumbnail')),
        }),
      }),
    });

    fileAdapter.upload.mockResolvedValueOnce({
      url: 'https://s3.amazonaws.com/bucket/file.jpg',
    });

    fileAdapter.upload.mockResolvedValueOnce({
      url: 'https://s3.amazonaws.com/bucket/file-thumbnail.jpg',
    });

    const result = await provider.upload(file);

    expect(result.name).toBeDefined();
    // split extension
    const [name, extension] = result.name.split('.');

    // check if name is a uuid v4 string
    expect(name).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );

    // check if extension is jpg
    expect(extension).toEqual('jpg');

    expect(result).toEqual({
      name: expect.any(String),
      url: expect.any(String),
      thumbnailUrl: expect.any(String),
    });

    expect(result.url).toEqual(expect.stringContaining(extension));
    expect(result.thumbnailUrl).toEqual(
      expect.stringContaining(`-thumbnail.${extension}`),
    );

    expect(fileAdapter.upload).toHaveBeenCalledTimes(2);
  });

  it('should upload a file without thumbnail', async () => {
    const file = mock<Express.Multer.File>({
      buffer: Buffer.from('file'),
      originalname: 'file.jpg',
      mimetype: 'image/jpeg',
    });

    fileAdapter.upload.mockResolvedValueOnce({
      url: 'https://s3.amazonaws.com/bucket/file.jpg',
    });

    const result = await provider.upload(file, undefined, false);

    expect(result.name).toBeDefined();
    // split extension
    const [name, extension] = result.name.split('.');

    // check if name is a uuid v4 string
    expect(name).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );

    // check if extension is jpg
    expect(extension).toEqual('jpg');

    expect(result).toEqual({
      name: expect.any(String),
      url: expect.any(String),
      thumbnailUrl: null,
    });

    expect(result.url).toEqual(expect.stringContaining(extension));
    expect(result.thumbnailUrl).toBeNull();

    expect(fileAdapter.upload).toHaveBeenCalledTimes(1);
  });

  it('should upload a pdf file', async () => {
    const file = mock<Express.Multer.File>({
      buffer: Buffer.from('file'),
      originalname: 'file.pdf',
      mimetype: 'application/pdf',
    });

    fileAdapter.upload.mockResolvedValueOnce({
      url: 'https://s3.amazonaws.com/bucket/file.pdf',
    });

    const result = await provider.upload(file, undefined, false);

    expect(result.name).toBeDefined();
    // split extension
    const [name, extension] = result.name.split('.');

    // check if name is a uuid v4 string
    expect(name).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );

    // check if extension is pdf
    expect(extension).toEqual('pdf');

    expect(result).toEqual({
      name: expect.any(String),
      url: expect.any(String),
      thumbnailUrl: null,
    });

    expect(result.url).toEqual(expect.stringContaining(extension));
    expect(result.thumbnailUrl).toBeNull();

    expect(fileAdapter.upload).toHaveBeenCalledTimes(1);
  });

  it('should throw UPLOAD ERROR if cannot upload file', async () => {
    const file = mock<Express.Multer.File>({
      buffer: Buffer.from('file'),
      originalname: 'file.jpg',
      mimetype: 'image/jpeg',
    });

    (sharp as unknown as jest.Mock).mockReturnValue({
      resize: jest.fn().mockReturnValue({
        withMetadata: jest.fn().mockReturnValue({
          toBuffer: jest
            .fn()
            .mockImplementation(() => Buffer.from('thumbnail')),
        }),
      }),
    });

    // fail uploading file
    fileAdapter.upload.mockRejectedValueOnce('error');
    // success on thumbnail
    fileAdapter.upload.mockResolvedValueOnce({
      url: 'https://s3.amazonaws.com/bucket/file.jpg',
    });

    fileAdapter.delete.mockResolvedValueOnce({});

    await expect(provider.upload(file)).rejects.toThrow(
      errorCodes.UPLOAD_FILE_ERROR,
    );

    expect(fileAdapter.upload).toHaveBeenCalledTimes(2);
    expect(fileAdapter.delete).toHaveBeenCalledTimes(1);
  });

  it('should throw UPLOAD ERROR if cannot upload thumbnail', async () => {
    const file = mock<Express.Multer.File>({
      buffer: Buffer.from('file'),
      originalname: 'file.jpg',
      mimetype: 'image/jpeg',
    });

    (sharp as unknown as jest.Mock).mockReturnValue({
      resize: jest.fn().mockReturnValue({
        withMetadata: jest.fn().mockReturnValue({
          toBuffer: jest
            .fn()
            .mockImplementation(() => Buffer.from('thumbnail')),
        }),
      }),
    });

    // success on file
    fileAdapter.upload.mockResolvedValueOnce({
      url: 'https://s3.amazonaws.com/bucket/file.jpg',
    });

    // fail uploading thumbnail
    fileAdapter.upload.mockRejectedValueOnce('error');

    fileAdapter.delete.mockResolvedValueOnce({});

    await expect(provider.upload(file)).rejects.toThrow(
      errorCodes.UPLOAD_FILE_ERROR,
    );

    expect(fileAdapter.upload).toHaveBeenCalledTimes(2);
    expect(fileAdapter.delete).toHaveBeenCalledTimes(1);
  });

  it('should throw UPLOAD ERROR when both file and thumbnail could not be uploaded', async () => {
    const file = mock<Express.Multer.File>({
      buffer: Buffer.from('file'),
      originalname: 'file.jpg',
      mimetype: 'image/jpeg',
    });

    (sharp as unknown as jest.Mock).mockReturnValue({
      resize: jest.fn().mockReturnValue({
        withMetadata: jest.fn().mockReturnValue({
          toBuffer: jest
            .fn()
            .mockImplementation(() => Buffer.from('thumbnail')),
        }),
      }),
    });

    // fail uploading file
    fileAdapter.upload.mockRejectedValueOnce('file error');
    // fail uploading thumbnail
    fileAdapter.upload.mockRejectedValueOnce('thumbnail error');

    await expect(provider.upload(file)).rejects.toThrow(
      errorCodes.UPLOAD_FILE_ERROR,
    );

    expect(fileAdapter.upload).toHaveBeenCalledTimes(2);
    expect(fileAdapter.delete).not.toHaveBeenCalled();
  });

  it('should throw UPLOAD ERROR and warn when file is uploaded and thumbnail cannot uploaded and file cannot be deleted', async () => {
    const file = mock<Express.Multer.File>({
      buffer: Buffer.from('file'),
      originalname: 'file.jpg',
      mimetype: 'image/jpeg',
    });

    (sharp as unknown as jest.Mock).mockReturnValue({
      resize: jest.fn().mockReturnValue({
        withMetadata: jest.fn().mockReturnValue({
          toBuffer: jest
            .fn()
            .mockImplementation(() => Buffer.from('thumbnail')),
        }),
      }),
    });

    // success on file
    fileAdapter.upload.mockResolvedValueOnce({
      url: 'https://s3.amazonaws.com/bucket/file.jpg',
    });

    // fail uploading thumbnail
    fileAdapter.upload.mockRejectedValueOnce('thumbnail error');

    fileAdapter.delete.mockRejectedValueOnce('delete error');

    await expect(provider.upload(file)).rejects.toThrow(
      errorCodes.UPLOAD_FILE_ERROR,
    );

    expect(fileAdapter.upload).toHaveBeenCalledTimes(2);
    expect(fileAdapter.delete).toHaveBeenCalledTimes(1);
  });

  it('should throw UPLOAD ERROR and warn when thumbnail is uploaded and file cannot uploaded and thumbnail cannot be deleted', async () => {
    const file = mock<Express.Multer.File>({
      buffer: Buffer.from('file'),
      originalname: 'file.jpg',
      mimetype: 'image/jpeg',
    });

    (sharp as unknown as jest.Mock).mockReturnValue({
      resize: jest.fn().mockReturnValue({
        withMetadata: jest.fn().mockReturnValue({
          toBuffer: jest
            .fn()
            .mockImplementation(() => Buffer.from('thumbnail')),
        }),
      }),
    });

    // fail uploading file
    fileAdapter.upload.mockRejectedValueOnce('file error');
    // success on thumbnail
    fileAdapter.upload.mockResolvedValueOnce({
      url: 'https://s3.amazonaws.com/bucket/file.jpg',
    });

    fileAdapter.delete.mockRejectedValueOnce('delete error');

    await expect(provider.upload(file)).rejects.toThrow(
      errorCodes.UPLOAD_FILE_ERROR,
    );

    expect(fileAdapter.upload).toHaveBeenCalledTimes(2);
    expect(fileAdapter.delete).toHaveBeenCalledTimes(1);
  });
});
