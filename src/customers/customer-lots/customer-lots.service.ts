import { Prisma } from '@prisma/client';
import {
  Injectable,
  UnprocessableEntityException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@src/database/prisma.service';
import { IEntityService, IPaginationArgs } from '@src/interfaces/types';
import { Service } from '@src/common/classes/service.class';
import { CustomerLotDto } from './dto/customer-lot.dto';
import { UpdateCustomerLotDto } from './dto/update-customer-lot.dto';
import { errorCodes } from './customer-lots.constants';
import { CsvParser } from 'nest-csv-parser';
import { Readable } from 'stream';

class Entity {
  lot: string;
  icmLot: string;
  icmUid: string;
}

@Injectable()
export class CustomerLotsService extends Service implements IEntityService {
  constructor(
    readonly prisma: PrismaService,
    private readonly csvParser: CsvParser,
  ) {
    super(prisma);
  }

  async validCustomer(customerId: string) {
    const customerExist = await this.prisma.customer.count({
      where: {
        id: customerId,
      },
    });
    if (!customerExist) {
      throw new UnprocessableEntityException({
        statusCode: 422,
        error: 'Unprocessable Entity',
        message: errorCodes.INVALID_CUSTOMER,
      });
    }
  }
  async findAll(params: IPaginationArgs<Prisma.CustomerLotFindManyArgs>) {
    const { includeCount, skip, take, ...findAllParams } = params;
    return this.paginate(
      'customerLot',
      {
        ...findAllParams,
      },
      { includeCount, skip, take },
    );
  }

  async create(data: CustomerLotDto) {
    if (data.customerId) {
      await this.validCustomer(data.customerId);
    }
    return await this.prisma.customerLot.create({
      data,
    });
  }

  async update(id: string, customerLot: UpdateCustomerLotDto) {
    const customerLotFound = await this.prisma.customerLot.findUnique({
      where: {
        id,
      },
    });

    if (!customerLotFound) {
      throw new NotFoundException(errorCodes.CUSTOMER_LOT_NOT_FOUND);
    }
    if (customerLot.customerId) {
      await this.validCustomer(customerLot.customerId);
    }
    return await this.prisma.customerLot.update({
      where: {
        id,
      },
      data: customerLot,
    });
  }

  async loadCsv(file: Express.Multer.File, customerId: string) {
    await this.validCustomer(customerId);
    let emptyFields = false;

    const stream = Readable.from(file.buffer.toString());

    const lots = await this.csvParser.parse(stream, Entity, 0, 0, {
      headers: ['lot', 'icmLot', 'icmUid'],
      mapValues: ({ header, value }) => {
        if (!value && header !== 'lot') {
          emptyFields = true;
        } else {
          return value;
        }
      },
    });

    if (emptyFields) {
      throw new UnprocessableEntityException(errorCodes.INVALID_FILE);
    }

    const data = lots.list.map((lot) => ({
      ...lot,
      lot: lot.lot || lot.icmLot.substring(lot.icmLot.length - 3),
      customerId,
    }));

    return await this.prisma.customerLot.createMany({
      data,
      skipDuplicates: true,
    });
  }
}
