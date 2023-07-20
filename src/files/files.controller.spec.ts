import '../__test__/winston';
import { mock } from 'jest-mock-extended';
import { Test, TestingModule } from '@nestjs/testing';
import { FilesController } from './files.controller';
import { FilesUploadService } from './files.service';
import { FilesUploadServiceMock } from './mocks/files.service';

describe('FilesController', () => {
  let controller: FilesController;
  let fileUploadService: FilesUploadServiceMock;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FilesController],
      providers: [
        {
          provide: FilesUploadService,
          useValue: FilesUploadServiceMock,
        },
      ],
    }).compile();

    controller = module.get<FilesController>(FilesController);
    fileUploadService = module.get(FilesUploadService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should upload file successfully', async () => {
    const file = mock<Express.Multer.File>({
      buffer: Buffer.from('file.jpg'),
      mimetype: 'image/jpeg',
    });

    const fileObject = {
      name: 'f4d9f9d0-c9b0-4b3f-b8b8-f9d9f9d0c9b0.jpg',
      url: 'https://s3.amazonaws.com/basapp-files/f4d9f9d0-c9b0-4b3f-b8b8-f9d9f9d0c9b0.jpg',
      thumbnailUrl:
        'https://s3.amazonaws.com/basapp-files/f4d9f9d0-c9b0-4b3f-b8b8-f9d9f9d0c9b0-thumbnail.jpg',
    };

    fileUploadService.upload.mockResolvedValue(fileObject);

    const result = await controller.uploadFile(file, { path: 'test' });
    expect(result).toEqual(fileObject);
  });

  it('should throw if cannot upload file', async () => {
    const file = mock<Express.Multer.File>({
      buffer: Buffer.from('file.jpg'),
      mimetype: 'image/jpeg',
    });

    fileUploadService.upload.mockRejectedValue(new Error('error'));

    await expect(controller.uploadFile(file, { path: 'test' })).rejects.toThrow(
      'error',
    );
  });
});
