import { Prisma } from '@prisma/client';
import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from '@src/database/prisma.service';
import { errorCodes } from './locations.constants';
import { IEntityService, IPaginationArgs } from '@src/interfaces/types';
import { Service } from '@src/common/classes/service.class';
import { LocationDto } from './dto/location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';

@Injectable()
export class LocationsService extends Service implements IEntityService {
  constructor(readonly prisma: PrismaService) {
    super(prisma);
  }
  private async existLocation(customerId: string, name: string) {
    const location = await this.prisma.location.count({
      where: {
        name,
        customerId,
      },
    });
    if (location) {
      throw new UnprocessableEntityException(errorCodes.ER_DUP_ENTRY);
    }
  }

  async findAll(params: IPaginationArgs<Prisma.LocationFindManyArgs>) {
    const { includeCount, skip, take, ...findAllParams } = params;
    return this.paginate(
      'location',
      {
        ...findAllParams,
      },
      { includeCount, skip, take },
      ['updatedBy'],
    );
  }

  async create(data: LocationDto & { customerId: string; userId: string }) {
    const { userId, customerId, ...location } = data;
    await this.existLocation(customerId, location.name);
    return await this.prisma.location.create({
      data: {
        ...location,
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
    });
  }

  async update(
    id: string,
    data: UpdateLocationDto & {
      userId: string;
      customerId: string;
    },
  ) {
    const { userId, customerId, ...location } = data;

    const locationFound = await this.prisma.location.findUnique({
      where: {
        id,
      },
    });

    if (!locationFound) {
      throw new NotFoundException(errorCodes.LOCATION_NOT_FOUND);
    }

    if (location.name && locationFound.name !== location.name) {
      const existCode = await this.prisma.location.count({
        where: {
          customerId,
          name: location.name,
        },
      });
      if (existCode) {
        throw new UnprocessableEntityException(errorCodes.ER_DUP_ENTRY);
      }
    }
    return await this.prisma.location.update({
      where: {
        id,
      },
      data: {
        ...location,
        updatedBy: {
          connect: {
            id: userId,
          },
        },
      },
    });
  }
}
