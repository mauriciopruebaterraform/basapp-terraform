import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { Service } from '@src/common/classes/service.class';
import { IEntityService, IPaginationArgs } from '@src/interfaces/types';
import { errorCodes } from './alert-states.constants';
import { AlertState } from './entities/alert-states.entity';
import { UpdateAlertStateDto } from './dto/update-alert-state.dto';
import { CreateAlertState } from './dto/create-alert-state.dto';

@Injectable()
export class AlertStateService extends Service implements IEntityService {
  constructor(readonly prisma: PrismaService) {
    super(prisma);
  }

  private async validateUpdateAlerts({ id }) {
    const exitsAlert = await this.prisma.alertState.count({
      where: {
        id,
      },
    });
    if (!exitsAlert) {
      throw new UnprocessableEntityException(errorCodes.ALERT_STATE_NOT_FOUND);
    }
  }

  findOne(id: string, params: any): Promise<any> {
    throw new Error(`Method not implemented. ${id} ${params}`);
  }
  async create(data: CreateAlertState & { customerId: string }) {
    return await this.prisma.alertState.create({
      data: {
        name: data.name,
        customer: {
          connect: {
            id: data.customerId,
          },
        },
      },
    });
  }

  async update(
    id: string,
    data: { edit: UpdateAlertStateDto; role: string; customerId: string },
  ): Promise<AlertState> {
    await this.validateUpdateAlerts({ id });

    if (data.role !== 'admin') {
      const alertState = await this.prisma.alertState.findUnique({
        where: {
          id,
        },
      });
      if (alertState && alertState.customerId !== data.customerId) {
        throw new UnprocessableEntityException(
          errorCodes.NOT_ALLOWED_TO_MODIFY,
        );
      }
    }

    return await this.prisma.alertState.update({
      data: {
        ...data.edit,
      },
      where: {
        id,
      },
    });
  }
  delete(id: string): Promise<any> {
    throw new Error(`Method not implemented. ${id}`);
  }

  async findAll(params: IPaginationArgs<Prisma.CustomerSettingsFindManyArgs>) {
    const { includeCount, skip, take, ...findAllParams } = params;
    return this.paginate(
      'alertState',
      {
        ...findAllParams,
      },
      { includeCount, skip, take },
    );
  }
}
