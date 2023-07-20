import { Prisma } from '@prisma/client';
import { Injectable, NotFoundException } from '@nestjs/common';
import { Service } from '@src/common/classes/service.class';
import { PrismaService } from '@src/database/prisma.service';
import { IEntityService, IPaginationArgs } from '@src/interfaces/types';
import { errorCodes } from './permissions.constants';
import { Logger } from '@src/common/logger';

@Injectable()
export class PermissionsService extends Service implements IEntityService {
  constructor(readonly prisma: PrismaService) {
    super(prisma);
  }

  async findAll(params: IPaginationArgs<Prisma.PermissionFindManyArgs>) {
    const { includeCount, skip, take, ...findAllParams } = params;
    return this.paginate('permission', findAllParams, {
      includeCount,
      skip,
      take,
    });
  }

  count(params?: Prisma.PermissionCountArgs) {
    return this.prisma.permission.count(params);
  }

  async update(id: string, data: Partial<Prisma.PermissionUpdateInput>) {
    const permission = await this.prisma.permission.findUnique({
      where: { id },
    });

    if (!permission) {
      throw new NotFoundException({
        statusCode: 404,
        error: 'Permission not found',
        message: errorCodes.PERMISSION_NOT_FOUND,
      });
    }

    return this.prisma.permission.update({
      where: { id },
      data,
    });
  }

  async updateByCategory(
    category: string,
    data: Partial<Prisma.PermissionUpdateInput>,
  ) {
    return this.prisma.permission.updateMany({
      where: { category },
      data,
    });
  }

  async create(data: Prisma.PermissionCreateInput) {
    Logger.log('Creating permission', data);
    return Promise.resolve(true);
  }

  async findOne(id: string, params: any): Promise<any> {
    Logger.debug(`Finding permission ${id} using params ${params}`);
    return Promise.resolve(true);
  }

  async delete(id: string): Promise<boolean> {
    Logger.debug(`Deleting permission ${id}`);
    return Promise.resolve(true);
  }
}
