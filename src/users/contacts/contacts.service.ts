import { Prisma, User } from '@prisma/client';
import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from '@src/database/prisma.service';
import { errorCodes } from './contacts.constants';
import {
  ICustomerWithAlertTypes,
  IEntityService,
  IPaginatedResult,
  IPaginationArgs,
} from '@src/interfaces/types';
import { Service } from '@src/common/classes/service.class';
import { changeInputJsonObject, changeRelationTable } from '@src/utils';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';

@Injectable()
export class ContactsService extends Service implements IEntityService {
  constructor(readonly prisma: PrismaService) {
    super(prisma);
  }
  findAll(): Promise<IPaginatedResult<any>> {
    throw new Error('Method not implemented.');
  }

  private async verifyUserId(
    id: string,
    include?: Prisma.UserInclude,
  ): Promise<(User & { customer: ICustomerWithAlertTypes | null }) | User> {
    const user = await this.prisma.user.findUnique({
      where: {
        id,
      },
      include,
    });

    if (!user) {
      throw new NotFoundException(errorCodes.USER_NOT_FOUND);
    }

    return user;
  }

  private async validateAlertTypes(alertTypes: string[]) {
    const alertTypeExist = await this.prisma.alertType.count({
      where: {
        OR: alertTypes.map((alertType) => ({ id: alertType })),
      },
    });

    if (alertTypeExist < alertTypes.length) {
      throw new UnprocessableEntityException(errorCodes.INVALID_ALERT_TYPE);
    }
  }

  async findAllContacts(
    params: IPaginationArgs<Prisma.ContactFindManyArgs>,
    customerId: string,
    id: string,
  ) {
    const { includeCount, skip, take, ...findAllParams } = params;
    const user = await this.prisma.user.findFirst({
      where: {
        id,
        customerId,
      },
    });
    if (!user) {
      throw new NotFoundException(errorCodes.USER_NOT_FOUND);
    }
    const pagination = await this.paginate(
      'contact',
      findAllParams,
      {
        includeCount,
        skip,
        take,
      },
      ['contactUser', 'user'],
    );

    return pagination;
  }

  async create(contact: CreateContactDto & { userId: string }) {
    const { deviceContact, userId, ...properties } = contact;

    const existContact = await this.prisma.contact.count({
      where: {
        phoneNumber: contact.phoneNumber,
        userId,
      },
    });

    if (existContact) {
      throw new UnprocessableEntityException(errorCodes.EXIST_CONTACT);
    }

    const user = (await this.verifyUserId(userId, {
      customer: {
        include: {
          alertTypes: true,
        },
      },
    })) as User & { customer: ICustomerWithAlertTypes | null };

    if (user.username === contact.phoneNumber) {
      throw new UnprocessableEntityException(
        errorCodes.CONTACT_AND_USERNAME_ARE_THE_SAME,
      );
    }

    const contactUser = await this.prisma.user.findFirst({
      where: {
        username: contact.phoneNumber,
        customerType: user.customerType,
      },
    });

    // check for emojis
    if (typeof deviceContact.name === 'string') {
      deviceContact.name = deviceContact.name?.replace(
        /[^0-9a-zA-Z_\-\.\,\(\)\ü\ ]/g,
        '',
      );
      deviceContact.LastName = deviceContact.LastName?.replace(
        /[^0-9a-zA-Z_\-\.\,\(\)\ü\ ]/g,
        '',
      );
      deviceContact.firstName = deviceContact.firstName?.replace(
        /[^0-9a-zA-Z_\-\.\,\(\)\ü\ ]/g,
        '',
      );
    }
    return await this.prisma.contact.create({
      data: {
        ...properties,
        deviceContact: deviceContact as unknown as Prisma.InputJsonObject,
        contactUser: contactUser
          ? {
              connect: {
                id: contactUser.id,
              },
            }
          : undefined,
        user: {
          connect: {
            id: user.id,
          },
        },
        contactAlertTypes: user?.customer?.alertTypes.length
          ? {
              createMany: {
                data: user.customer.alertTypes.map((alertType) => ({
                  alertTypeId: alertType.alertTypeId,
                })),
              },
            }
          : undefined,
      },
      include: {
        contactAlertTypes: {
          include: {
            alertType: true,
          },
        },
      },
    });
  }

  async update(
    contactId: string,
    contact: UpdateContactDto & { userId: string },
  ) {
    const { alertTypes, deviceContact, userId, ...properties } = contact;
    const contactFound = await this.prisma.contact.findUnique({
      where: {
        id: contactId,
      },
    });

    if (!contactFound) {
      throw new NotFoundException(errorCodes.CONTACT_NOT_FOUND);
    }

    const user = await this.verifyUserId(userId);

    let contactUser;
    if (contact.phoneNumber) {
      contactUser = await this.prisma.user.findFirst({
        where: {
          username: contact.phoneNumber,
          customerType: user.customerType,
        },
      });
    }

    await this.validateAlertTypes(alertTypes);

    return this.prisma.contact.update({
      data: {
        ...properties,
        contactAlertTypes: {
          deleteMany: {},
          createMany:
            alertTypes.length > 0
              ? {
                  data: alertTypes.map((id) => ({
                    alertTypeId: id,
                  })),
                }
              : undefined,
        },
        deviceContact: changeInputJsonObject(deviceContact),
        contactUser: changeRelationTable(contactUser),
      },
      include: {
        contactAlertTypes: true,
      },
      where: {
        id: contactId,
      },
    });
  }

  async deleteContact(contactId: string, userId: string) {
    const belongsUser = await this.prisma.contact.findFirst({
      where: {
        id: contactId,
        userId,
      },
    });

    if (!belongsUser) {
      throw new NotFoundException(errorCodes.CONTACT_NOT_FOUND);
    }
    await this.prisma.contactAlertType.deleteMany({
      where: {
        contactId,
      },
    });
    await this.prisma.contact.deleteMany({
      where: {
        id: contactId,
      },
    });
    return;
  }
}
