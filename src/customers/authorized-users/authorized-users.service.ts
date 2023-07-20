import { Prisma } from '@prisma/client';
import {
  flatten,
  Injectable,
  InternalServerErrorException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from '@src/database/prisma.service';
import { IEntityService, IPaginationArgs } from '@src/interfaces/types';
import { Service } from '@src/common/classes/service.class';
import { AuthorizedUserDto } from './dto/authorized-user.dto';
import { errorCodes } from './authorized-users.constants';
import { UpdateAuthorizedUserDto } from './dto/update-authorized-user.dto';
import { CsvParser } from 'nest-csv-parser';
import { Readable } from 'stream';

class Entity {
  firstName: string;
  lastName: string;
  lot: string;
  username: string;
  description: string;
  sendEvents: boolean;
}

@Injectable()
export class AuthorizedUsersService extends Service implements IEntityService {
  constructor(
    readonly prisma: PrismaService,
    private readonly csvParser: CsvParser,
  ) {
    super(prisma);
  }
  private transformToBoolean = (value: string) => value.toLowerCase() === 'si';

  private async validateUsername(username: string, customerId: string) {
    const existUsername = await this.prisma.authorizedUser.count({
      where: {
        username,
        customerId,
      },
    });

    if (existUsername) {
      throw new UnprocessableEntityException(errorCodes.USERNAME_EXISTENT);
    }
  }

  private async validateReservationTypes(
    reservationTypes: string[],
    customerId: string,
  ) {
    for await (const reservationType of reservationTypes) {
      const existEvent = await this.prisma.reservationType.count({
        where: { id: reservationType, customerId },
      });
      if (!existEvent) {
        throw new UnprocessableEntityException(
          errorCodes.INVALID_RESERVATION_TYPE,
        );
      }
    }
  }

  async findAll(params: IPaginationArgs<Prisma.AuthorizedUserFindManyArgs>) {
    const { includeCount, skip, take, ...findAllParams } = params;
    return this.paginate(
      'authorizedUser',
      {
        ...findAllParams,
      },
      { includeCount, skip, take },
      ['updatedBy'],
    );
  }

  async create(
    data: AuthorizedUserDto & { customerId: string; userId: string },
  ) {
    const {
      reservationTypes,
      customerId,
      userId,
      additionalLots,
      ...authorizedUser
    } = data;

    await this.validateUsername(authorizedUser.username, customerId);

    if (reservationTypes) {
      await this.validateReservationTypes(reservationTypes, customerId);
    }
    return await this.prisma.authorizedUser.create({
      data: {
        ...authorizedUser,
        additionalLots: additionalLots ? additionalLots : null,
        reservationTypes: {
          create: reservationTypes
            ? reservationTypes.map((reservation) => ({
                reservationType: {
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
      },
      include: {
        reservationTypes: true,
      },
    });
  }

  async update(
    id: string,
    data: UpdateAuthorizedUserDto & { customerId: string; userId: string },
  ) {
    const { customerId, reservationTypes, userId, ...authorizedUser } = data;
    let newReservationTypes:
      | Prisma.AuthorizedUserReservationTypeUpdateManyWithoutAuthorizedUserNestedInput
      | undefined;
    const authorizedUserExist = await this.prisma.authorizedUser.findFirst({
      where: {
        id,
        customerId,
      },
    });
    if (!authorizedUserExist) {
      throw new UnprocessableEntityException(
        errorCodes.AUTHORIZED_USER_NOT_FOUND,
      );
    }
    if (
      authorizedUser.username &&
      authorizedUser.username !== authorizedUserExist.username
    ) {
      await this.validateUsername(authorizedUser.username, customerId);
    }
    if (reservationTypes) {
      await this.validateReservationTypes(reservationTypes, customerId);
      newReservationTypes = {
        deleteMany: {},
        create: reservationTypes.map((reservation) => ({
          reservationType: {
            connect: {
              id: reservation,
            },
          },
        })),
      };
    }
    const authorizedUserUpdated = await this.prisma.authorizedUser.update({
      where: {
        id,
      },
      data: {
        ...authorizedUser,
        reservationTypes: newReservationTypes,
        updatedBy: {
          connect: {
            id: userId,
          },
        },
      },
      include: {
        reservationTypes: true,
        userAuthorizedUser: true,
      },
    });

    if (authorizedUserUpdated.userAuthorizedUser.length) {
      const fullName =
        authorizedUserUpdated.firstName && authorizedUserUpdated.lastName
          ? `${authorizedUserUpdated.firstName} ${authorizedUserUpdated.lastName}`
          : undefined;
      await this.prisma.user.update({
        where: {
          id: authorizedUserUpdated.userAuthorizedUser[0].id,
        },
        data: {
          firstName: authorizedUserUpdated.firstName || undefined,
          lastName: authorizedUserUpdated.lastName || undefined,
          fullName,
          lot: authorizedUserUpdated.lot,
        },
      });
    }

    return authorizedUserUpdated;
  }

  async loadCsv(
    file: Express.Multer.File,
    data: { reservationTypes?: string[]; customerId: string; userId: string },
  ) {
    try {
      const { customerId, userId, reservationTypes } = data;
      let emptyFields = false;

      const stream = Readable.from(file.buffer.toString());

      const authorizedUser = await this.csvParser.parse(stream, Entity, 0, 0, {
        headers: [
          'firstName',
          'lastName',
          'lot',
          'username',
          'description',
          'sendEvents',
          'additionalLots',
        ],
        mapValues: ({ header, value }) => {
          if (header === 'additionalLots' && value) {
            return JSON.stringify(value.split('-'));
          }
          if (header === 'sendEvents') {
            return value ? this.transformToBoolean(value) : null;
          }
          if (!value && header === 'username') {
            emptyFields = true;
            return;
          }
          return value || null;
        },
      });

      if (emptyFields) {
        throw new UnprocessableEntityException(errorCodes.EMPTY_FIELD_USERNAME);
      }
      const existUsernames = await this.prisma.authorizedUser.findMany({
        where: {
          customerId,
          OR: authorizedUser.list.map((authorized) => ({
            username: authorized.username,
          })),
        },
        select: {
          username: true,
        },
      });

      const usernamesToCreate = authorizedUser.list.filter(
        (authorized) =>
          !existUsernames.some(
            (exist) => exist.username == authorized.username,
          ),
      );

      const toCreate: Prisma.AuthorizedUserCreateManyInput[] =
        usernamesToCreate.map((authorized) => ({
          ...authorized,
          customerId,
          updatedById: userId,
        }));

      const amountCreated = await this.prisma.authorizedUser.createMany({
        data: toCreate,
        skipDuplicates: true,
      });

      const created = await this.prisma.authorizedUser.findMany({
        where: {
          OR: toCreate.map((reserve) => ({
            username: reserve.username,
          })),
        },
        select: {
          id: true,
        },
      });

      if (reservationTypes) {
        const relationTable = created.map((authorizedUser) => {
          return reservationTypes.map((reserve) => ({
            reservationTypeId: reserve,
            authorizedUserId: authorizedUser.id,
          }));
        });
        await this.prisma.authorizedUserReservationType.createMany({
          data: flatten(relationTable),
        });
      }

      return amountCreated;
    } catch (err) {
      if (err.errors) {
        throw new UnprocessableEntityException(errorCodes.EMPTY_FIELDS);
      } else if (err.response) {
        throw err;
      } else {
        throw new InternalServerErrorException();
      }
    }
  }
}
