import { Prisma } from '@prisma/client';
import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from '@src/database/prisma.service';
import { IEntityService, IPaginationArgs } from '@src/interfaces/types';
import { Service } from '@src/common/classes/service.class';
import { LotDto } from './dto/lot.dto';
import { errorCodes } from './lots.constants';
import { UpdateLotDto } from './dto/update-lot.dto';
import { CsvParser } from 'nest-csv-parser';
import { Readable } from 'stream';

class Entity {
  lot: string;
  latitude: string;
  longitude: string;
  isArea: string;
  customer: any;
  updatedBy: any;
}

@Injectable()
export class LotsService extends Service implements IEntityService {
  constructor(
    readonly prisma: PrismaService,
    private readonly csvParser: CsvParser,
  ) {
    super(prisma);
  }

  private async validateLotField(lot: string, customerId: string) {
    const customerExist = await this.prisma.lot.count({
      where: {
        lot,
        customerId,
      },
    });
    if (customerExist) {
      throw new UnprocessableEntityException(errorCodes.INVALID_DUPLICATED_LOT);
    }
  }

  private transformToBoolean = (value: string) => value.toLowerCase() === 'si';

  async findAll(params: IPaginationArgs<Prisma.LotFindManyArgs>) {
    const { includeCount, skip, take, ...findAllParams } = params;
    return this.paginate(
      'lot',
      {
        ...findAllParams,
      },
      { includeCount, skip, take },
      ['updatedBys'],
    );
  }

  async create(data: LotDto & { customerId: string; userId: string }) {
    const { userId, customerId, ...lot } = data;
    await this.validateLotField(data.lot, data.customerId);

    return await this.prisma.lot.create({
      data: {
        ...lot,
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
    data: UpdateLotDto & {
      userId: string;
    },
  ) {
    const { userId, ...lot } = data;
    const lotFound = await this.prisma.lot.findUnique({
      where: {
        id,
      },
    });
    if (data.lot && data.lot !== lotFound?.lot) {
      await this.validateLotField(data.lot, lotFound?.customerId || '');
    }
    if (!lotFound) {
      throw new NotFoundException(errorCodes.LOT_NOT_FOUND);
    }

    return await this.prisma.lot.update({
      where: {
        id,
      },
      data: {
        ...lot,
        updatedBy: {
          connect: {
            id: userId,
          },
        },
      },
    });
  }

  async loadCsv(file: Express.Multer.File, customerId: string, userId: string) {
    let emptyFields = false;
    const stream = Readable.from(file.buffer.toString());

    const lots = await this.csvParser.parse(stream, Entity, 0, 0, {
      headers: ['lot', 'latitude', 'longitude', 'isArea'],
      mapValues: ({ header, value }) => {
        if (header === 'isArea') {
          return this.transformToBoolean(value);
        } else if (!value) {
          emptyFields = true;
        } else {
          return value;
        }
      },
    });

    if (emptyFields) {
      throw new UnprocessableEntityException(errorCodes.INVALID_FILE);
    }
    return await this.prisma.lot.createMany({
      data: lots.list.map((lot) => ({
        ...lot,
        customerId,
        updatedById: userId,
      })),
      skipDuplicates: true,
    });
  }
}
