import { Prisma } from '@prisma/client';
import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from '@src/database/prisma.service';
import { errorCodes } from './event-types.constants';
import { IEntityService, IPaginationArgs } from '@src/interfaces/types';
import { Service } from '@src/common/classes/service.class';
import { EventTypeDto } from './dto/event-type.dto';
import { UpdateEventTypeDto } from './dto/update-event-type.dto';

@Injectable()
export class EventTypesService extends Service implements IEntityService {
  constructor(readonly prisma: PrismaService) {
    super(prisma);
  }

  private async validateCustomerEventCategory(customerEventCategory: string) {
    const customerEventExist = await this.prisma.customerEventCategory.count({
      where: {
        id: customerEventCategory,
      },
    });
    if (!customerEventExist) {
      throw new UnprocessableEntityException({
        statusCode: 422,
        message: errorCodes.INVALID_CUSTOMER_EVENT_CATEGORY,
      });
    }
  }
  private async existEventType(customerId: string, code: string) {
    const eventType = await this.prisma.eventType.count({
      where: {
        code,
        customerId,
      },
    });
    if (eventType) {
      throw new UnprocessableEntityException(errorCodes.ER_DUP_ENTRY);
    }
  }

  async findAll(params: IPaginationArgs<Prisma.EventTypeFindManyArgs>) {
    const { includeCount, skip, take, ...findAllParams } = params;
    return this.paginate(
      'eventType',
      {
        ...findAllParams,
      },
      { includeCount, skip, take },
      ['updatedBy'],
    );
  }

  async create(data: EventTypeDto & { customerId: string; userId: string }) {
    const { userId, customerId, eventCategoryId, ...eventType } = data;
    await this.existEventType(customerId, eventType.code);
    if (eventCategoryId) {
      await this.validateCustomerEventCategory(eventCategoryId);
    }
    return await this.prisma.eventType.create({
      data: {
        ...eventType,
        eventCategory: eventCategoryId
          ? {
              connect: {
                id: eventCategoryId,
              },
            }
          : undefined,
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
      include: {
        eventCategory: true,
      },
    });
  }

  async update(
    id: string,
    data: UpdateEventTypeDto & {
      userId: string;
      customerId: string;
    },
  ) {
    const { userId, customerId, eventCategoryId, ...eventType } = data;
    if (eventCategoryId) {
      await this.validateCustomerEventCategory(eventCategoryId);
    }
    const eventTypeFound = await this.prisma.eventType.findUnique({
      where: {
        id,
      },
    });

    if (!eventTypeFound) {
      throw new NotFoundException(errorCodes.EVENT_TYPE_NOT_FOUND);
    }

    if (eventType.code && eventTypeFound.code !== eventType.code) {
      const exitsTypeWithCode = await this.prisma.eventType.count({
        where: {
          customerId,
          code: eventType.code,
        },
      });
      if (exitsTypeWithCode) {
        throw new UnprocessableEntityException(errorCodes.ER_DUP_ENTRY);
      }
    }

    return await this.prisma.eventType.update({
      where: {
        id,
      },
      data: {
        ...eventType,
        eventCategory: eventCategoryId
          ? { connect: { id: eventCategoryId } }
          : { disconnect: true },
        updatedBy: {
          connect: {
            id: userId,
          },
        },
      },
      include: {
        eventCategory: true,
      },
    });
  }
}
