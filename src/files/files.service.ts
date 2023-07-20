import {
  Injectable,
  InternalServerErrorException,
  Inject,
} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import * as sharp from 'sharp';
import { errorCodes } from './files.constants';
import { FileAdapter, FileUploadSuccess } from '@src/interfaces/types';
import { FILE_ADAPTER } from '@src/app.constants';
import { Logger } from '@src/common/logger';

@Injectable()
export class FilesUploadService {
  @Inject(FILE_ADAPTER)
  private readonly adapter: FileAdapter;

  async generateThumbnail(
    file: Express.Multer.File,
    width = 250,
    height = 250,
  ): Promise<Buffer> {
    try {
      const thumbnail = sharp(file.buffer);
      return thumbnail.resize(width, height).withMetadata().toBuffer();
    } catch (error) {
      throw new InternalServerErrorException({
        statusCode: 500,
        error: error.message,
        message: errorCodes.THUMBNAIL_GENERATION_ERROR,
      });
    }
  }

  async upload(file: Express.Multer.File, path?: string, thumbnail = true) {
    const extension: string = file.originalname.split('.').pop() || '';
    const name = uuidv4();
    let thumbnailBuffer;

    if (thumbnail) {
      thumbnailBuffer = await this.generateThumbnail(file);
    }

    const filename = `${name}.${extension}`;
    const thumbnailFilename = `${name}-thumbnail.${extension}`;

    const [uploadedFile, thumbnailFile] = await Promise.allSettled([
      this.adapter.upload(file.buffer, filename, file.mimetype, path),
      thumbnail
        ? this.adapter.upload(
            thumbnailBuffer,
            thumbnailFilename,
            file.mimetype,
            path,
          )
        : Promise.resolve(null),
    ]);

    let uploadError = false;
    if (
      uploadedFile.status === 'rejected' &&
      thumbnailFile.status === 'fulfilled'
    ) {
      uploadError = true;
      await this.adapter
        .delete(thumbnailFilename)
        .catch((error) => Logger.warn(error));
    } else if (
      thumbnailFile.status === 'rejected' &&
      uploadedFile.status === 'fulfilled'
    ) {
      uploadError = true;
      await this.adapter.delete(filename).catch((error) => Logger.warn(error));
    } else if (
      thumbnailFile.status === 'rejected' &&
      uploadedFile.status === 'rejected'
    ) {
      uploadError = true;
    }

    if (uploadError) {
      const reason =
        (uploadedFile as PromiseRejectedResult).reason ||
        (thumbnailFile as PromiseRejectedResult).reason;

      Logger.error(reason);
      throw new InternalServerErrorException(errorCodes.UPLOAD_FILE_ERROR);
    }

    return {
      name: filename,
      url: (uploadedFile as PromiseFulfilledResult<FileUploadSuccess>).value
        .url,
      thumbnailUrl: thumbnail
        ? (thumbnailFile as PromiseFulfilledResult<FileUploadSuccess>).value.url
        : null,
    };
  }
}
