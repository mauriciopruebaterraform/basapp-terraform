import { Prisma } from '@prisma/client';
import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from '@src/database/prisma.service';
import { errorCodes } from './cameras.constants';
import { IEntityService, IPaginationArgs } from '@src/interfaces/types';
import { Service } from '@src/common/classes/service.class';
import { CameraDto } from './dto/camera.dto';
import { UpdateCameraDto } from './dto/update-camera.dto';
import { changeInputJsonObject } from '@src/utils';

@Injectable()
export class CamerasService extends Service implements IEntityService {
  constructor(readonly prisma: PrismaService) {
    super(prisma);
  }

  private async existCamera(customerId: string, code: string) {
    const camera = await this.prisma.camera.count({
      where: {
        code,
        customerId,
      },
    });
    if (camera) {
      throw new UnprocessableEntityException(errorCodes.ER_DUP_ENTRY);
    }
  }

  async findAll(params: IPaginationArgs<Prisma.CameraFindManyArgs>) {
    const { includeCount, skip, take, ...findAllParams } = params;
    return this.paginate(
      'camera',
      {
        ...findAllParams,
      },
      { includeCount, skip, take },
      ['updatedBy'],
    );
  }

  async create(data: CameraDto & { customerId: string; userId: string }) {
    const { userId, customerId, ...camera } = data;
    await this.existCamera(customerId, camera.code);
    return await this.prisma.camera.create({
      data: {
        ...camera,
        geolocation: camera.geolocation as unknown as Prisma.InputJsonObject,
        customer: {
          connect: {
            id: customerId,
          },
        },
        updatedBy: {
          connect: {
            id: userId,
          },
        },
      },
    });
  }

  async update(
    id: string,
    data: UpdateCameraDto & {
      userId: string;
      customerId: string;
    },
  ) {
    const { userId, customerId, ...camera } = data;

    const cameraFound = await this.prisma.camera.findUnique({
      where: {
        id,
      },
    });

    if (!cameraFound) {
      throw new NotFoundException(errorCodes.CAMERA_NOT_FOUND);
    }

    if (camera.code && cameraFound.code !== camera.code) {
      const existCode = await this.prisma.camera.count({
        where: {
          customerId,
          code: camera.code,
        },
      });
      if (existCode) {
        throw new UnprocessableEntityException(errorCodes.ER_DUP_ENTRY);
      }
    }
    return await this.prisma.camera.update({
      where: {
        id,
      },
      data: {
        ...camera,
        geolocation: changeInputJsonObject(camera.geolocation),
        updatedBy: {
          connect: {
            id: userId,
          },
        },
      },
    });
  }
}
