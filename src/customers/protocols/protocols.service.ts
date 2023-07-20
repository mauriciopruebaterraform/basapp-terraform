import { Prisma } from '@prisma/client';
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@src/database/prisma.service';
import { IEntityService, IPaginationArgs } from '@src/interfaces/types';
import { Service } from '@src/common/classes/service.class';
import { ProtocolDto } from './dto/protocol.dto';
import { errorCodes } from './protocols.constants';
import { UpdateProtocolDto } from './dto/update-protocol.dto';
import { changeInputJsonObject } from '@src/utils';

@Injectable()
export class ProtocolsService extends Service implements IEntityService {
  constructor(readonly prisma: PrismaService) {
    super(prisma);
  }

  async findAll(params: IPaginationArgs<Prisma.ProtocolFindManyArgs>) {
    const { includeCount, skip, take, ...findAllParams } = params;
    return this.paginate(
      'protocol',
      {
        ...findAllParams,
      },
      { includeCount, skip, take },
      ['updatedBy'],
    );
  }

  async create(data: ProtocolDto & { customerId: string; userId: string }) {
    const { userId, customerId, ...protocol } = data;
    return await this.prisma.protocol.create({
      data: {
        ...protocol,
        attachment: protocol.attachment
          ? (protocol.attachment as unknown as Prisma.InputJsonObject)
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
    });
  }

  async update(
    id: string,
    data: UpdateProtocolDto & {
      userId: string;
    },
  ) {
    const { userId, ...protocol } = data;
    const protocolFound = await this.prisma.protocol.findUnique({
      where: {
        id,
      },
    });

    if (!protocolFound) {
      throw new NotFoundException(errorCodes.PROTOCOL_NOT_FOUND);
    }

    return await this.prisma.protocol.update({
      where: {
        id,
      },
      data: {
        ...protocol,
        attachment: changeInputJsonObject(protocol.attachment),
        updatedBy: {
          connect: {
            id: userId,
          },
        },
      },
    });
  }
}
