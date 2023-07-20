import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Service } from '@src/common/classes/service.class';
import { PrismaService } from '@src/database/prisma.service';
import { IEntityService, IPaginationArgs } from '@src/interfaces/types';
import { changeInputJsonObject, changeRelationTable } from '@src/utils';
import { ReservationSpaceDto } from './dto/reservation-space.dto';
import { UpdateReservationSpaceDto } from './dto/update-reservation-space.dto';
import { errorCodes } from './reservation-space.constants';

@Injectable()
export class ReservationSpaceService extends Service implements IEntityService {
  constructor(readonly prisma: PrismaService) {
    super(prisma);
  }

  private async validateEventType(eventTypeId: string, customerId: string) {
    const existEvent = await this.prisma.eventType.count({
      where: { id: eventTypeId, customerId },
    });
    if (!existEvent) {
      throw new UnprocessableEntityException(errorCodes.INVALID_EVENT_TYPE);
    }
  }

  private async validateReservationType(
    reservationType: string,
    customerId: string,
  ) {
    const existReservationType = await this.prisma.reservationType.count({
      where: { id: reservationType, customerId },
    });
    if (!existReservationType) {
      throw new UnprocessableEntityException(
        errorCodes.INVALID_RESERVATION_TYPE,
      );
    }
  }
  findAll(params: IPaginationArgs<Prisma.ReservationSpaceFindManyArgs>) {
    const { includeCount, skip, take, ...findAllParams } = params;
    return this.paginate(
      'reservationSpace',
      {
        ...findAllParams,
      },
      { includeCount, skip, take },
    );
  }

  async create(data: ReservationSpaceDto & { customerId: string }) {
    const {
      customerId,
      eventTypeId,
      reservationTypeId,
      schedule,
      ...reservationSpace
    } = data;

    await this.validateEventType(eventTypeId, customerId);
    await this.validateReservationType(reservationTypeId, customerId);

    return await this.prisma.reservationSpace.create({
      data: {
        ...reservationSpace,
        schedule: schedule as unknown as Prisma.InputJsonObject,
        eventType: {
          connect: {
            id: eventTypeId,
          },
        },
        reservationType: {
          connect: {
            id: reservationTypeId,
          },
        },
        customer: {
          connect: {
            id: customerId,
          },
        },
      },
    });
  }

  async update(
    id: string,
    data: UpdateReservationSpaceDto & { customerId: string },
  ) {
    const { customerId, eventTypeId, reservationTypeId, ...reservationSpace } =
      data;
    const reservationSpaceFound = await this.prisma.reservationSpace.findUnique(
      {
        where: {
          id,
        },
      },
    );

    if (!reservationSpaceFound) {
      throw new NotFoundException(errorCodes.RESERVATION_SPACE_NOT_FOUND);
    }
    if (eventTypeId) {
      await this.validateEventType(eventTypeId, customerId);
    }
    if (reservationTypeId) {
      await this.validateReservationType(reservationTypeId, customerId);
    }

    return await this.prisma.reservationSpace.update({
      where: {
        id,
      },
      data: {
        ...reservationSpace,
        eventType: changeRelationTable(eventTypeId),
        reservationType: changeRelationTable(reservationTypeId),
        schedule: changeInputJsonObject(reservationSpace.schedule),
      },
    });
  }
}
