import '../__test__/winston';
/* eslint-disable @typescript-eslint/ban-ts-comment */
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { S3 } from 'aws-sdk';
import { S3Service } from './s3.service';

jest.mock('aws-sdk');

const configuration = () => ({
  s3: {
    bucket: 'https://s3.amazonaws.com/bucket',
  },
});

describe('S3 service', () => {
  let provider: S3Service;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          load: [configuration],
        }),
      ],
      providers: [S3Service],
    }).compile();
    provider = module.get<S3Service>(S3Service);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });

  it('should upload to s3 successfully', async () => {
    const file = mock<Express.Multer.File>({
      buffer: Buffer.from('file'),
      mimetype: 'image/jpeg',
    });

    // @ts-ignore
    S3.mockImplementationOnce(() => {
      return {
        upload: (params, callback) =>
          callback(null, {
            Location: `${params.Bucket}/${params.Key}`,
            Key: params.Key,
          }),
      };
    });

    const result = await provider.upload(
      file.buffer,
      'file.jpg',
      file.mimetype,
    );

    expect(result).toEqual({
      url: 'https://s3.amazonaws.com/bucket/file.jpg',
    });
  });

  it('should upload to a custom path in s3 successfully', async () => {
    const file = mock<Express.Multer.File>({
      buffer: Buffer.from('file'),
      mimetype: 'image/jpeg',
    });

    // @ts-ignore
    S3.mockImplementationOnce(() => {
      return {
        upload: (params, callback) =>
          callback(null, {
            Location: `${params.Bucket}/${params.Key}`,
            Key: params.Key,
          }),
      };
    });

    const result = await provider.upload(
      file.buffer,
      'file.jpg',
      file.mimetype,
      'custom/path',
    );

    expect(result).toEqual({
      url: 'https://s3.amazonaws.com/bucket/custom/path/file.jpg',
    });
  });

  it('should reject if cannot upload to s3', async () => {
    const file = mock<Express.Multer.File>({
      buffer: Buffer.from('file'),
      mimetype: 'image/jpeg',
    });

    // @ts-ignore
    S3.mockImplementationOnce(() => {
      return {
        upload: (params, callback) => callback(new Error('error'), null),
      };
    });

    await expect(
      provider.upload(file.buffer, 'file.jpg', file.mimetype),
    ).rejects.toEqual('error');
  });

  it('should delete from s3 successfully', async () => {
    // @ts-ignore
    S3.mockImplementationOnce(() => {
      return {
        deleteObject: (params, callback) =>
          callback(null, {
            DeleteMarker: true,
            VersionId: 'versionId',
          }),
      };
    });

    const result = await provider.delete('file.jpg');

    expect(result).toEqual({
      DeleteMarker: true,
      VersionId: 'versionId',
    });
  });

  it('should reject if cannot delete from s3', async () => {
    // @ts-ignore
    S3.mockImplementationOnce(() => {
      return {
        deleteObject: (params, callback) => callback(new Error('error'), null),
      };
    });

    await expect(provider.delete('file.jpg')).rejects.toEqual('error');
  });
});
