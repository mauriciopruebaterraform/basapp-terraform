import { EventCategory, Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { Injectable } from '@nestjs/common';
import { Service } from '@src/common/classes/service.class';
import { IEntityService, IPaginationArgs } from '@src/interfaces/types';
import { CreateEventCategoryDto } from './dto/create-event-categor.dto';
import { UpdateEventCategoryDto } from './dto/update-event-category.dto';

@Injectable()
export class EventCategoryService extends Service implements IEntityService {
  constructor(readonly prisma: PrismaService) {
    super(prisma);
  }

  findOne(id: string, params: any): Promise<any> {
    throw new Error(`Method not implemented. ${id} ${params}`);
  }

  async update(
    eventCategoryId: string,
    data: UpdateEventCategoryDto,
  ): Promise<EventCategory> {
    const eventCategory = await this.prisma.eventCategory.update({
      where: {
        id: eventCategoryId,
      },
      data: {
        ...data,
        image: data.image
          ? (data.image as unknown as Prisma.InputJsonObject)
          : undefined,
      },
    });

    if (data.active === false) {
      await this.prisma.customerEventCategory.updateMany({
        data: {
          active: false,
        },
        where: {
          categoryId: eventCategoryId,
        },
      });
    }

    return eventCategory;
  }

  delete(id: string): Promise<any> {
    throw new Error(`Method not implemented. ${id}`);
  }

  async findAll(params: IPaginationArgs<Prisma.CustomerSettingsFindManyArgs>) {
    const { includeCount, skip, take, ...findAllParams } = params;
    return this.paginate(
      'eventCategory',
      {
        ...findAllParams,
      },
      { includeCount, skip, take },
      ['updatedBy'],
    );
  }

  async create(categoryEvent: CreateEventCategoryDto) {
    const categoryEventCreated = await this.prisma.eventCategory.create({
      data: {
        ...categoryEvent,
        image: categoryEvent.image as unknown as Prisma.InputJsonObject,
      },
    });
    return categoryEventCreated;
  }
}
