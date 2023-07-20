import { UploadFileDto } from './dto/upload-file.dto';
import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { FilesUploadService } from './files.service';
import { FileEntity } from './entities/file.entity';

@ApiTags('files')
@ApiBearerAuth()
@Controller({
  path: '/files',
  version: '1',
})
export class FilesController {
  constructor(private filesService: FilesUploadService) {}

  @ApiOperation({
    servers: [{ url: '/v1' }],
    summary: 'Upload file',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
        },
        useThumbnail: {
          type: 'string',
          enum: ['true', 'false'],
        },
        file: {
          type: 'string',
          format: 'binary',
        },
      },
      required: ['path', 'file'],
    },
  })
  @ApiConsumes('multipart/form-data')
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: UploadFileDto,
  ): Promise<FileEntity> {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const { path, useThumbnail } = body;
    const thumbnail = useThumbnail === 'true';
    return this.filesService.upload(file, path, thumbnail);
  }
}
