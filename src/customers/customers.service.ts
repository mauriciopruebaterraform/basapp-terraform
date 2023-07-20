import { Prisma } from '@prisma/client';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { errorCodes } from './customers.constants';
import { IEntityService, IPaginationArgs } from '@src/interfaces/types';
import { Service } from '@src/common/classes/service.class';
import { CustomerIntegrationsDto } from './dto/customer-integrations.dto';
import { UpdateCustomerEventCategoriesDto } from './dto/update-customer-event-categories.dto';
import { UpdateCustomerSettings } from './dto/update-settings.dto';
import { changeInputJsonObject, changeRelationTable } from '@src/utils';
import { Customer } from './entities/customer.entity';
import { Logger } from '@src/common/logger';
import { PrismaPromise } from '@prisma/client';

@Injectable()
export class CustomerService extends Service implements IEntityService {
  constructor(readonly prisma: PrismaService) {
    super(prisma);
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

  private async validateEventCategories(eventCategories?: string[]) {
    if (eventCategories?.length) {
      const existEvent = await this.prisma.eventCategory.count({
        where: { OR: eventCategories.map((event) => ({ id: event })) },
      });

      if (existEvent < eventCategories.length) {
        throw new UnprocessableEntityException(
          errorCodes.INVALID_EVENT_CATEGORY,
        );
      }
    }
  }
  private async validateCustomerNameOrKey({
    customerName,
    secretKey,
  }: {
    customerName?: string;
    secretKey?: string | null;
  }) {
    const customerExists = await this.prisma.customer.findMany({
      where: {
        OR: [
          {
            name: customerName || undefined,
          },
          {
            secretKey: secretKey || undefined,
          },
        ],
      },
    });
    if (customerExists.length) {
      for (const customer of customerExists) {
        if (customer.name === customerName) {
          throw new UnprocessableEntityException(errorCodes.INVALID_NAME);
        }
        if (customer.secretKey === secretKey) {
          throw new UnprocessableEntityException(errorCodes.INVALID_SECRET_KEY);
        }
      }
    }
  }

  private async validateCustomerParentId(parentId: string) {
    const customerExist = await this.prisma.customer.count({
      where: {
        id: parentId,
      },
    });
    if (!customerExist) {
      throw new UnprocessableEntityException({
        statusCode: 422,
        message: errorCodes.INVALID_CUSTOMER,
        error: 'There was an error processing parentId customer',
      });
    }
  }

  async findAll(params: IPaginationArgs<Prisma.CustomerFindManyArgs>) {
    const { includeCount, skip, take, ...findAllParams } = params;
    return this.paginate(
      'customer',
      {
        ...findAllParams,
      },
      { includeCount, skip, take },
      ['users', 'updatedBy'],
    );
  }

  async create(customer: CreateCustomerDto & { userId: string }) {
    await this.validateAlertTypes(customer.alertTypes);
    await this.validateEventCategories(customer.eventCategories || []);
    await this.validateCustomerNameOrKey({
      customerName: customer.name,
      secretKey: customer.secretKey,
    });
    let parent;
    if (customer.parent) {
      await this.validateCustomerParentId(customer.parent);
      parent = {
        connect: {
          id: customer.parent,
        },
      };
    }

    const { userId, ...createData } = customer;
    const customerCreated = await this.prisma.customer.create({
      data: {
        ...createData,
        parent,
        image: createData.image as unknown as Prisma.InputJsonObject,
        updatedBy: {
          connect: {
            id: userId,
          },
        },
        alertTypes: {
          createMany: {
            data: createData.alertTypes.map((alertType, idx) => ({
              alertTypeId: alertType,
              order: idx,
            })),
          },
        },
        eventCategories: createData.eventCategories && {
          createMany: {
            data: createData.eventCategories?.map((eventCategory) => ({
              categoryId: eventCategory,
              updatedById: userId,
            })),
          },
        },
        integrations: {
          create: {
            ...createData.integrations,
            updatedBy: {
              connect: {
                id: userId,
              },
            },
          },
        },
        settings: {
          create: {
            updatedBy: {
              connect: {
                id: userId,
              },
            },
          },
        },
        sections: {
          create: {
            ...createData.sections,
          },
        },
      },
      include: {
        integrations: true,
        settings: true,
        alertTypes: {
          include: {
            alertType: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
        eventCategories: {
          include: {
            category: true,
          },
        },
        sections: true,
      },
    });
    return customerCreated;
  }

  async update(
    customerId: string,
    customerData: UpdateCustomerDto & { userId: string },
  ) {
    const { userId, ...updateData } = customerData;

    const customer = await this.prisma.customer.findUnique({
      where: {
        id: customerId,
      },
      include: {
        alertTypes: {
          include: {
            alertType: true,
          },
        },
      },
    });
    if (!customer) {
      throw new NotFoundException(errorCodes.CUSTOMER_NOT_FOUND);
    }

    let alertTypes:
      | Prisma.CustomerAlertTypeUpdateManyWithoutCustomerNestedInput
      | undefined;

    if (customerData.alertTypes?.length) {
      await this.validateAlertTypes(customerData.alertTypes);
      alertTypes = {
        deleteMany: {},
        create: customerData.alertTypes.map((alertType, idx) => ({
          alertType: { connect: { id: alertType } },
          order: idx,
        })),
      };
    }

    await this.validateEventCategories(customerData.eventCategories);
    const listCustomerEvent = await this.prisma.customerEventCategory.findMany({
      where: {
        customerId,
        active: true,
      },
    });

    const toInactive = listCustomerEvent.filter((event) => {
      if (customerData.eventCategories?.length) {
        return !customerData.eventCategories?.includes(event.categoryId);
      }
      return true;
    });
    const toCreate = customerData.eventCategories?.filter((event) => {
      if (listCustomerEvent.length) {
        return !listCustomerEvent.find((i) => i.categoryId === event);
      }
      return true;
    });

    const eventCategories:
      | Prisma.CustomerEventCategoryUpdateManyWithoutCustomerNestedInput
      | undefined = {
      update: listCustomerEvent.map((event) => ({
        data: {
          active: !toInactive.some(
            (eventCategory) => event.id === eventCategory.id,
          ),
        },
        where: {
          id: event.id,
        },
      })),
      create: toCreate?.map((eventCategory) => ({
        category: { connect: { id: eventCategory } },
        updatedBy: {
          connect: {
            id: userId,
          },
        },
      })),
    };
    let customerName: string | undefined,
      customerSecretKey: string | null | undefined;

    if (customerData.name && customerData.name !== customer.name) {
      customerName = customerData.name;
    }
    if (
      customerData.secretKey &&
      customerData.secretKey !== customer.secretKey
    ) {
      customerSecretKey = customerData.secretKey;
    }

    if (customerName || customerSecretKey) {
      await this.validateCustomerNameOrKey({
        customerName,
        secretKey: customerSecretKey,
      });
    }
    if (customerData.parent) {
      await this.validateCustomerParentId(customerData.parent);
    }

    const data: Prisma.CustomerUpdateInput = {
      ...updateData,
      parent: changeRelationTable(customerData.parent),
      alertTypes,
      eventCategories: customerData.eventCategories
        ? eventCategories
        : undefined,
      image: changeInputJsonObject(updateData.image),
      updatedBy: {
        connect: {
          id: userId,
        },
      },
      sections: updateData.sections
        ? {
            update: {
              ...updateData.sections,
            },
          }
        : undefined,
      integrations: updateData.integrations
        ? {
            update: {
              ...updateData.integrations,
              updatedBy: {
                connect: {
                  id: userId,
                },
              },
            },
          }
        : undefined,
    };

    const transactions: PrismaPromise<any>[] = [
      this.prisma.customer.update({
        data,
        where: {
          id: customerId,
        },
        include: {
          alertTypes: {
            include: {
              alertType: true,
            },
            orderBy: {
              order: 'asc',
            },
          },
          eventCategories: {
            include: {
              category: true,
            },
            where: {
              active: true,
            },
          },
          integrations: true,
          sections: true,
        },
      }),
    ];

    if (customerData.alertTypes?.length) {
      const [listUsers, listContacts] = await this.prisma.$transaction([
        this.prisma.userPermission.findMany({
          where: {
            user: {
              role: 'monitoring',
              customerId,
            },
          },
          select: {
            id: true,
          },
        }),
        this.prisma.contact.findMany({
          where: {
            user: {
              role: 'user',
              customerId,
            },
          },
          select: {
            id: true,
          },
        }),
      ]);

      const alertToAddContact = customerData.alertTypes
        .filter(
          (alert) =>
            !customer.alertTypes.some(
              (customerAlert) => customerAlert.alertTypeId === alert,
            ),
        )
        .map((alertTypeId) => ({ alertTypeId }));

      const alertToRemoveContact = customer.alertTypes
        ?.filter(
          (alert) => !customerData.alertTypes?.includes(alert.alertTypeId),
        )
        .map(({ alertTypeId }) => ({ alertTypeId }));

      const alertToAddMonitoring = alertToAddContact
        .filter(
          ({ alertTypeId }) =>
            alertTypeId !== process.env.ARRIVED_WELL_ALERT_ID,
        )
        .map(({ alertTypeId }) => ({
          id: alertTypeId,
        }));

      const alertToRemoveMonitoring = alertToRemoveContact.map(
        ({ alertTypeId }) => ({
          id: alertTypeId,
        }),
      );

      for (const row of listUsers) {
        const userToUpdate = this.prisma.userPermission.update({
          where: {
            id: row.id,
          },
          data: {
            monitoringAlertTypes: {
              connect: alertToAddMonitoring.length
                ? alertToAddMonitoring
                : undefined,
              disconnect: alertToRemoveMonitoring.length
                ? alertToRemoveMonitoring
                : undefined,
            },
          },
        });

        transactions.push(userToUpdate);
      }

      for (const row of listContacts) {
        const prismaContact = this.prisma.contact.update({
          where: {
            id: row.id,
          },
          data: {
            contactAlertTypes: {
              deleteMany: alertToRemoveContact.length
                ? alertToRemoveContact
                : undefined,
              createMany: alertToAddContact.length
                ? {
                    data: alertToAddContact,
                  }
                : undefined,
            },
          },
        });

        transactions.push(prismaContact);
      }
    }

    const [customerUpdated] = await this.prisma.$transaction(transactions);

    return customerUpdated;
  }

  findOne(
    id: string,
    findArgs?: {
      include?: Prisma.CustomerInclude;
      select?: Prisma.CustomerSelect;
    },
  ) {
    const args: Prisma.CustomerFindUniqueArgs = {
      where: {
        id,
      },
      ...findArgs,
    };

    return this.get<Customer>('customer', args);
  }

  async delete(id: string): Promise<boolean> {
    Logger.debug(`Deleting customer ${id}`);
    return Promise.resolve(true);
  }

  async updateIntegrations(
    customerId: string,
    integrations: CustomerIntegrationsDto,
    userId: string,
  ) {
    const customer = await this.prisma.customer.findUnique({
      where: {
        id: customerId,
      },
    });
    if (!customer) {
      throw new NotFoundException(errorCodes.CUSTOMER_NOT_FOUND);
    }

    const data: Prisma.CustomerIntegrationUpdateInput = {
      ...integrations,
      updatedBy: {
        connect: {
          id: userId,
        },
      },
    };

    const integrationsUpdated = await this.prisma.customerIntegration.update({
      data,
      where: {
        customerId,
      },
    });

    return integrationsUpdated;
  }

  async updateSettings(
    customerId: string,
    customerSettings: UpdateCustomerSettings,
    userId: string,
  ) {
    const settings = await this.prisma.customerSettings.findUnique({
      where: {
        customerId: customerId,
      },
    });
    if (!settings) {
      throw new NotFoundException(errorCodes.CUSTOMER_NOT_FOUND);
    }

    const data: Prisma.CustomerSettingsUpdateInput = {
      ...customerSettings,
      panicKey: customerSettings.panicKey
        ? (customerSettings.panicKey as unknown as Prisma.InputJsonObject)
        : undefined,
      updatedBy: {
        connect: {
          id: userId,
        },
      },
    };

    return await this.prisma.customerSettings.update({
      data,
      where: {
        id: settings.id,
      },
    });
  }

  async findAllEvents(
    params: IPaginationArgs<Prisma.CustomerEventCategoryFindManyArgs>,
  ) {
    const { includeCount, skip, take, ...findAllParams } = params;
    return this.paginate(
      'customerEventCategory',
      {
        ...findAllParams,
      },
      { includeCount, skip, take },
    );
  }

  async updateEvent(
    id: string,
    data: UpdateCustomerEventCategoriesDto & {
      updatedById: string;
      customerId: string;
    },
  ) {
    const { updatedById, reservationTypeId, customerId, ...dataToUpdated } =
      data;
    const findEventCategory = await this.prisma.customerEventCategory.findFirst(
      {
        where: {
          id,
        },
      },
    );
    if (!findEventCategory?.id) {
      throw new NotFoundException({
        message: errorCodes.EVENT_NOT_FOUND,
      });
    }
    if (findEventCategory?.customerId !== customerId) {
      throw new ForbiddenException({
        error: 'Forbidden',
        statusCode: 403,
        message: errorCodes.INVALID_UPDATE_EVENT,
      });
    }
    return await this.prisma.customerEventCategory.update({
      data: {
        ...dataToUpdated,
        reservationType: changeRelationTable(reservationTypeId),
        updatedBy: {
          connect: {
            id: updatedById,
          },
        },
      },
      where: {
        id,
      },
    });
  }

  findFirst(
    where: Prisma.CustomerWhereInput,
    findArgs?: {
      include?: Prisma.CustomerInclude;
      select?: Prisma.CustomerSelect;
    },
  ) {
    const args: Prisma.CustomerFindFirstArgs = {
      where,
      ...findArgs,
    };

    return this.getFirst('customer', args);
  }
}
