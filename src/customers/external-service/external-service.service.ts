import { Prisma } from '@prisma/client';
import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from '@src/database/prisma.service';
import { errorCodes } from './external-service.constants';
import { IEntityService, IPaginationArgs } from '@src/interfaces/types';
import { Service } from '@src/common/classes/service.class';
import { ExternalService, UpdateExternalService } from './types';

@Injectable()
export class ExternalServiceService extends Service implements IEntityService {
  constructor(readonly prisma: PrismaService) {
    super(prisma);
  }

  private async validateAlert(id: string) {
    const alert = await this.prisma.alert.count({
      where: {
        id,
      },
    });
    if (!alert) {
      throw new UnprocessableEntityException({
        statusCode: 422,
        message: errorCodes.INVALID_ALERT,
      });
    }
  }

  async findAll(params: IPaginationArgs<Prisma.ExternalServiceFindManyArgs>) {
    const { includeCount, skip, take, ...findAllParams } = params;
    return this.paginate(
      'externalService',
      {
        ...findAllParams,
      },
      { includeCount, skip, take },
    );
  }

  async create(data: ExternalService) {
    const { alertId, ...external } = data;

    await this.validateAlert(alertId);
    return await this.prisma.externalService.create({
      data: {
        ...external,
        alert: {
          connect: {
            id: alertId,
          },
        },
      },
    });
  }

  async update(id: string, data: UpdateExternalService) {
    if (data.alertId) {
      await this.validateAlert(data.alertId);
    }
    const externalServiceFound = await this.prisma.externalService.count({
      where: {
        id,
      },
    });

    if (!externalServiceFound) {
      throw new NotFoundException(errorCodes.SERVICE_NOT_FOUND);
    }

    return await this.prisma.externalService.update({
      where: {
        id,
      },
      data,
    });
  }
}
