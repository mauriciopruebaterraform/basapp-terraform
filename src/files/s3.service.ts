import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@src/common/logger';
import { FileAdapter, FileUploadSuccess } from '@src/interfaces/types';
import { S3 } from 'aws-sdk';

@Injectable()
export class S3Service implements FileAdapter {
  constructor(private readonly config: ConfigService) {}

  async upload(
    fileBuffer: Buffer,
    name: string,
    mimetype: string,
    path?: string,
  ) {
    const bucket = `${this.config.get('s3.bucket')}${path ? '/' + path : ''}`;

    const params = {
      Bucket: bucket,
      Key: String(name),
      Body: fileBuffer,
      ACL: 'public-read',
      ContentType: mimetype,
    };

    if (process.env.NODE_ENV === 'integration-testing') {
      return {
        url: 'https://s3.amazonaws.com/uploads.countries.basapp.com.ar/customers/image/4053ee9a-401c-4cb0-8f0a-4a9ef4811e21.png',
      };
    }

    const s3 = new S3({
      accessKeyId: this.config.get('s3.accessKeyId'),
      secretAccessKey: this.config.get('s3.secretAccessKey'),
    });

    return new Promise<FileUploadSuccess>((resolve, reject) => {
      s3.upload(params, (err, data) => {
        if (err) {
          Logger.error(err);
          reject(err.message);
        }
        resolve({
          url: data.Location,
        });
      });
    });
  }

  async delete(name: string) {
    const bucket = this.config.get('s3.bucket');
    const params = {
      Bucket: bucket,
      Key: name,
    };

    const s3 = new S3({
      accessKeyId: this.config.get('s3.accessKeyId'),
      secretAccessKey: this.config.get('s3.secretAccessKey'),
    });

    return new Promise((resolve, reject) => {
      s3.deleteObject(params, (err, data) => {
        if (err) {
          Logger.error(err);
          reject(err.message);
        }
        resolve(data);
      });
    });
  }
}
