import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Service } from '@src/common/classes/service.class';
import { PrismaService } from '@src/database/prisma.service';
import { IEntityService, IPaginationArgs } from '@src/interfaces/types';
import { ReservationTypeDto } from './dto/reservation-type.dto';
import { UpdateReservationTypeDto } from './dto/update-reservation-type.dto';
import { errorCodes } from './reservation-type.constants';

@Injectable()
export class ReservationTypeService extends Service implements IEntityService {
  constructor(readonly prisma: PrismaService) {
    super(prisma);
  }
  findAll(params: IPaginationArgs<Prisma.ReservationTypeFindManyArgs>) {
    const { includeCount, skip, take, ...findAllParams } = params;
    return this.paginate(
      'reservationType',
      {
        ...findAllParams,
      },
      { includeCount, skip, take },
    );
  }
  async create(data: ReservationTypeDto & { customerId: string }) {
    const { customerId, ...reservationType } = data;
    const reservationTypeExist = await this.prisma.reservationType.count({
      where: {
        code: reservationType.code,
        customerId,
      },
    });
    if (reservationTypeExist) {
      throw new UnprocessableEntityException(errorCodes.INVALID_CODE);
    }
    return await this.prisma.reservationType.create({
      data: {
        ...reservationType,
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
    data: UpdateReservationTypeDto & { customerId: string },
  ) {
    const { customerId, ...reservationType } = data;
    const reservationTypeFound = await this.prisma.reservationType.findUnique({
      where: {
        id,
      },
    });
    if (!reservationTypeFound) {
      throw new NotFoundException(errorCodes.RESERVATION_TYPE_NOT_FOUND);
    }
    if (
      reservationType.code &&
      reservationType.code !== reservationTypeFound?.code
    ) {
      const existDuplicate = await this.prisma.reservationType.count({
        where: {
          code: reservationType.code,
          customerId,
        },
      });
      if (existDuplicate) {
        throw new UnprocessableEntityException(errorCodes.INVALID_CODE);
      }
    }

    return await this.prisma.reservationType.update({
      where: {
        id,
      },
      data: {
        ...data,
      },
    });
  }
}
