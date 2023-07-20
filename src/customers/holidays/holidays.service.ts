import { Prisma } from '@prisma/client';
import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from '@src/database/prisma.service';
import { errorCodes } from './holidays.constants';
import { IEntityService, IPaginationArgs } from '@src/interfaces/types';
import { Service } from '@src/common/classes/service.class';
import { HolidayDto } from './dto/holiday.dto';
import { UpdateHolidayDto } from './dto/update-holiday.dto';

@Injectable()
export class HolidaysService extends Service implements IEntityService {
  constructor(readonly prisma: PrismaService) {
    super(prisma);
  }
  private async existHoliday(customerId: string, date: Date) {
    const holiday = await this.prisma.customerHolidays.count({
      where: {
        date,
        customerId,
      },
    });
    if (holiday) {
      throw new UnprocessableEntityException(errorCodes.HOLIDAY_EXIST);
    }
  }

  async findAll(params: IPaginationArgs<Prisma.CustomerHolidaysFindManyArgs>) {
    const { includeCount, skip, take, ...findAllParams } = params;
    return this.paginate(
      'customerHolidays',
      {
        ...findAllParams,
      },
      { includeCount, skip, take },
    );
  }

  async create(data: HolidayDto & { customerId: string }) {
    const { customerId, ...holiday } = data;
    await this.existHoliday(customerId, holiday.date);
    return await this.prisma.customerHolidays.create({
      data: {
        ...holiday,
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
    data: UpdateHolidayDto & {
      customerId: string;
    },
  ) {
    const { customerId, ...holiday } = data;

    const holidayFound = await this.prisma.customerHolidays.findUnique({
      where: {
        id,
      },
    });

    if (!holidayFound) {
      throw new NotFoundException(errorCodes.HOLIDAY_NOT_FOUND);
    }

    if (holiday.date) {
      await this.existHoliday(customerId, holiday.date);
    }

    return await this.prisma.customerHolidays.update({
      where: {
        id,
      },
      data: {
        ...holiday,
      },
    });
  }
}
