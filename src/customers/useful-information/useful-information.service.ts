import { Prisma } from '@prisma/client';
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@src/database/prisma.service';
import { IEntityService, IPaginationArgs } from '@src/interfaces/types';
import { Service } from '@src/common/classes/service.class';
import { UsefulInformationDto } from './dto/useful-information.dto';
import { errorCodes } from './useful-information.constants';
import { UpdateUsefulInformationDto } from './dto/update-useful-information.dto';
import { changeInputJsonObject, changeRelationTable } from '@src/utils';

@Injectable()
export class UsefulInformationService
  extends Service
  implements IEntityService
{
  constructor(readonly prisma: PrismaService) {
    super(prisma);
  }

  private cleanPropertiesUsefulInformation(
    usefulInformation: UpdateUsefulInformationDto,
    isCategory?: boolean,
  ): Omit<Prisma.UsefulInformationUpdateInput, 'customer' | 'updatedBy'> {
    if (!isCategory) {
      return {
        link: usefulInformation.link,
        description: usefulInformation.description,
        category: changeRelationTable(usefulInformation.categoryId),
        attachment: changeInputJsonObject(usefulInformation.attachment),
      };
    } else {
      return {
        link: null,
        description: null,
        category: {
          disconnect: true,
        },
        attachment: Prisma.DbNull,
      };
    }
  }

  async findAll(params: IPaginationArgs<Prisma.UsefulInformationFindManyArgs>) {
    const { includeCount, skip, take, ...findAllParams } = params;
    return this.paginate(
      'usefulInformation',
      {
        ...findAllParams,
      },
      { includeCount, skip, take },
      ['updatedBy'],
    );
  }

  async create(
    data: UsefulInformationDto & { customerId: string; userId: string },
  ) {
    const { userId, customerId, categoryId, ...usefulInformation } = data;
    let newUsefulInformation: Omit<
      Prisma.UsefulInformationCreateInput,
      'customer' | 'updatedBy'
    > = {
      title: usefulInformation.title,
      code: usefulInformation.code,
      isCategory: usefulInformation.isCategory,
    };
    if (!usefulInformation.isCategory) {
      newUsefulInformation = {
        ...usefulInformation,
        category: categoryId
          ? {
              connect: {
                id: categoryId,
              },
            }
          : undefined,
        attachment: usefulInformation.attachment
          ? (usefulInformation.attachment as unknown as Prisma.InputJsonObject)
          : undefined,
      };
    }
    return await this.prisma.usefulInformation.create({
      data: {
        ...newUsefulInformation,
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
    data: UpdateUsefulInformationDto & {
      userId: string;
    },
  ) {
    const { userId, categoryId, ...usefulInformation } = data;
    let updateUsefulInformation: Omit<
      Prisma.UsefulInformationUpdateInput,
      'customer' | 'updatedBy'
    >;
    const usefulFound = await this.prisma.usefulInformation.findUnique({
      where: {
        id,
      },
    });

    if (!usefulFound) {
      throw new NotFoundException(errorCodes.USEFUL_INFORMATION_NOT_FOUND);
    }

    if (typeof usefulInformation.isCategory === 'boolean') {
      updateUsefulInformation = this.cleanPropertiesUsefulInformation(
        {
          ...usefulInformation,
          categoryId,
        },
        usefulInformation.isCategory,
      );
    } else {
      updateUsefulInformation = this.cleanPropertiesUsefulInformation(
        {
          ...usefulInformation,
          categoryId,
        },
        usefulFound.isCategory,
      );
    }
    return await this.prisma.usefulInformation.update({
      where: {
        id,
      },
      data: {
        ...updateUsefulInformation,
        active: usefulInformation.active,
        title: usefulInformation.title,
        code: usefulInformation.code,
        isCategory: usefulInformation.isCategory,
        updatedBy: {
          connect: {
            id: userId,
          },
        },
      },
    });
  }
}
