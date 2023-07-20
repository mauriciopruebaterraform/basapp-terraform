import { Prisma, EventState } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Service } from '@src/common/classes/service.class';
import { IEntityService, IPaginationArgs } from '@src/interfaces/types';
import { CreateEventState } from './dto/create-event-state.dto';
import { errorCodes } from './event-states.constants';
import { UpdateEventState } from './dto/update-event-state.dto';

@Injectable()
export class EventStatesService extends Service implements IEntityService {
  constructor(readonly prisma: PrismaService) {
    super(prisma);
  }

  private async findEventState(id: string) {
    const event = await this.prisma.eventState.findUnique({
      where: {
        id,
      },
    });

    if (!event) {
      throw new NotFoundException(errorCodes.EVENT_STATE_NOT_FOUND);
    }
    return event;
  }

  findAll(params: IPaginationArgs<Prisma.EventStateFindManyArgs>) {
    const { includeCount, skip, take, ...findAllParams } = params;
    return this.paginate(
      'eventState',
      {
        ...findAllParams,
      },
      { includeCount, skip, take },
    );
  }

  findOne(id: string, params: any): Promise<any> {
    throw new Error(`Method not implemented. ${id} ${params}`);
  }

  create(data: CreateEventState & { customerId: string }) {
    return this.prisma.eventState.create({
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
    data: UpdateEventState & { customerId: string },
  ): Promise<EventState> {
    const eventState = await this.findEventState(id);
    const { customerId, ...rest } = data;
    if (eventState.customerId !== customerId) {
      throw new ForbiddenException(errorCodes.NOT_ALLOWED_TO_MODIFY);
    }
    return await this.prisma.eventState.update({
      data: {
        ...rest,
      },
      where: {
        id,
      },
    });
  }

  delete(id: string): Promise<any> {
    throw new Error(`Method not implemented. ${id}`);
  }
}
