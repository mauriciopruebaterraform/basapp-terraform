import { Prisma } from '@prisma/client';
import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from '@src/database/prisma.service';
import { errorCodes } from './reservation-locks.constants';
import { IEntityService, IPaginationArgs } from '@src/interfaces/types';
import { Service } from '@src/common/classes/service.class';
import { ReservationLockDto } from './dto/reservation-lock.dto';
import { UpdateReservationLockDto } from './dto/update-reservation-lock.dto';
import { changeInputJsonObject, changeRelationTable } from '@src/utils';

@Injectable()
export class ReservationLocksService extends Service implements IEntityService {
  constructor(readonly prisma: PrismaService) {
    super(prisma);
  }
  private async validateReservationSpace(
    reservationSpace: string,
    customerId: string,
  ) {
    const exist = await this.prisma.reservationSpace.count({
      where: { id: reservationSpace, customerId },
    });
    if (!exist) {
      throw new UnprocessableEntityException(
        errorCodes.INVALID_RESERVATION_SPACE,
      );
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

  async findAll(params: IPaginationArgs<Prisma.ReservationLockFindManyArgs>) {
    const { includeCount, skip, take, ...findAllParams } = params;
    return this.paginate(
      'reservationLock',
      {
        ...findAllParams,
      },
      { includeCount, skip, take },
    );
  }

  private getReservationLock(reservationLock: UpdateReservationLockDto) {
    return {
      active: reservationLock.active,
      name: reservationLock.name,
      ignoreIfHoliday: reservationLock.ignoreIfHoliday,
      date: reservationLock.date,
      mon: changeInputJsonObject(reservationLock.mon),
      tue: changeInputJsonObject(reservationLock.tue),
      wed: changeInputJsonObject(reservationLock.wed),
      thu: changeInputJsonObject(reservationLock.thu),
      fri: changeInputJsonObject(reservationLock.fri),
      sat: changeInputJsonObject(reservationLock.sat),
      sun: changeInputJsonObject(reservationLock.sun),
      holiday: changeInputJsonObject(reservationLock.holiday),
      holidayEve: changeInputJsonObject(reservationLock.holidayEve),
    };
  }

  async create(data: ReservationLockDto & { customerId: string }) {
    const reservationLock = this.getReservationLock(data);

    await this.validateReservationType(data.reservationTypeId, data.customerId);
    await this.validateReservationSpace(
      data.reservationSpaceId,
      data.customerId,
    );

    return await this.prisma.reservationLock.create({
      data: {
        ...reservationLock,
        reservationSpace: {
          connect: {
            id: data.reservationSpaceId,
          },
        },
        reservationType: {
          connect: {
            id: data.reservationTypeId,
          },
        },
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
    data: UpdateReservationLockDto & {
      customerId: string;
    },
  ) {
    const reservationLockFound = await this.prisma.reservationLock.findUnique({
      where: {
        id,
      },
    });

    if (!reservationLockFound) {
      throw new NotFoundException(errorCodes.RESERVATION_LOCK_NOT_FOUND);
    }

    const reservationLock = this.getReservationLock(data);

    if (data.reservationTypeId) {
      await this.validateReservationType(
        data.reservationTypeId,
        data.customerId,
      );
    }

    if (data.reservationSpaceId) {
      await this.validateReservationSpace(
        data.reservationSpaceId,
        data.customerId,
      );
    }

    return await this.prisma.reservationLock.update({
      where: {
        id,
      },
      data: {
        ...reservationLock,
        reservationType: changeRelationTable(data.reservationTypeId),
        reservationSpace: changeRelationTable(data.reservationSpaceId),
      },
    });
  }
}
