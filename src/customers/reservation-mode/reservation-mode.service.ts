import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Service } from '@src/common/classes/service.class';
import { PrismaService } from '@src/database/prisma.service';
import { IEntityService, IPaginationArgs } from '@src/interfaces/types';
import { ReservationModeDto } from './dto/reservation-mode.dto';
import { UpdateReservationModeDto } from './dto/update-reservation-space.dto';
import { errorCodes } from './reservation-mode.constants';

@Injectable()
export class ReservationModeService extends Service implements IEntityService {
  constructor(readonly prisma: PrismaService) {
    super(prisma);
  }

  private async validateReservationSpaces(
    reservationSpaces: string[],
    customerId: string,
    reservationTypeId: string,
  ) {
    for await (const reservationSpace of reservationSpaces) {
      const exist = await this.prisma.reservationSpace.count({
        where: {
          customerId,
          reservationTypeId,
          id: reservationSpace,
        },
      });
      if (!exist) {
        throw new UnprocessableEntityException(
          errorCodes.INVALID_RESERVATION_SPACE,
        );
      }
    }
  }

  private async validateReservationType(
    reservationType: string,
    customerId: string,
  ) {
    const exist = await this.prisma.reservationType.count({
      where: {
        customerId,
        id: reservationType,
      },
    });
    if (!exist) {
      throw new UnprocessableEntityException(
        errorCodes.INVALID_RESERVATION_TYPE,
      );
    }
  }
  findAll(params: IPaginationArgs<Prisma.ReservationModeFindManyArgs>) {
    const { includeCount, skip, take, ...findAllParams } = params;
    return this.paginate(
      'reservationMode',
      {
        ...findAllParams,
      },
      { includeCount, skip, take },
      ['updatedBy'],
    );
  }

  async create(
    data: ReservationModeDto & { customerId: string; userId: string },
  ) {
    const {
      customerId,
      reservationTypeId,
      reservationSpaces,
      userId,
      email,
      ...reservationMode
    } = data;
    await this.validateReservationType(reservationTypeId, customerId);

    if (reservationSpaces) {
      await this.validateReservationSpaces(
        reservationSpaces,
        customerId,
        reservationTypeId,
      );
    }

    return await this.prisma.reservationMode.create({
      data: {
        ...reservationMode,
        email: email ? email : null,
        reservationSpaces: {
          create: reservationSpaces
            ? reservationSpaces.map((reservation) => ({
                reservationSpace: {
                  connect: {
                    id: reservation,
                  },
                },
              }))
            : undefined,
        },
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
        reservationType: {
          connect: {
            id: reservationTypeId,
          },
        },
      },
      include: {
        reservationSpaces: true,
      },
    });
  }
  async update(
    id: string,
    data: UpdateReservationModeDto & { customerId: string; userId: string },
  ) {
    const {
      customerId,
      reservationTypeId,
      reservationSpaces,
      userId,
      ...reservationMode
    } = data;
    const find = await this.prisma.reservationMode.findUnique({
      where: {
        id,
      },
    });

    if (!find) {
      throw new NotFoundException(errorCodes.RESERVATION_MODE_NOT_FOUND);
    }

    let newReservationSpaces;
    let newReservationType = find?.reservationTypeId || '';

    if (reservationTypeId) {
      await this.validateReservationType(reservationTypeId, customerId);
      newReservationType = reservationTypeId;
      newReservationSpaces = {
        deleteMany: {},
      };
    }

    if (reservationSpaces) {
      await this.validateReservationSpaces(
        reservationSpaces,
        customerId,
        newReservationType,
      );
      newReservationSpaces = {
        ...newReservationSpaces,
        create: reservationSpaces.map((reservation) => ({
          reservationSpace: {
            connect: {
              id: reservation,
            },
          },
        })),
      };
    }
    return await this.prisma.reservationMode.update({
      where: {
        id,
      },
      data: {
        ...reservationMode,
        reservationType: reservationTypeId
          ? {
              connect: {
                id: newReservationType,
              },
            }
          : undefined,
        reservationSpaces: newReservationSpaces,
        updatedBy: {
          connect: {
            id: userId,
          },
        },
      },
      include: {
        reservationSpaces: true,
      },
    });
  }
}
