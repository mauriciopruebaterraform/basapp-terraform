import { Prisma, CustomerType, NotificationType, Role } from '@prisma/client';
import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from '@src/database/prisma.service';
import { IEntityService, IPaginationArgs } from '@src/interfaces/types';
import { Service } from '@src/common/classes/service.class';
import { NotificationDto } from './dto/notification.dto';
import { changeRelationTable } from '@src/utils';
import { errorCodes } from './notifications.constants';
import { PushNotificationService } from '@src/push-notification/push-notification.service';
import { forEach } from 'lodash';
import { SendMessageDto } from './dto/send-message.dto';
import {
  Customer,
  Notification,
  CustomerSettings,
  NotificationCustomer,
  CustomerSections,
} from '@prisma/client';

@Injectable()
export class NotificationsService extends Service implements IEntityService {
  constructor(
    readonly prisma: PrismaService,
    private pushNotificationService: PushNotificationService,
  ) {
    super(prisma);
  }

  private async validateCustomer(customers: string[], parentId: string) {
    for (const customer of customers) {
      const children = await this.prisma.customer.count({
        where: { parentId, id: customer },
      });

      if (!children) {
        throw new UnprocessableEntityException({
          statusCode: 422,
          message: errorCodes.INVALID_CUSTOMER,
        });
      }
    }
  }

  private async validateLocation(locationId: string, customerId: string) {
    const exist = await this.prisma.location.count({
      where: { customerId, id: locationId },
    });

    if (!exist) {
      throw new UnprocessableEntityException({
        statusCode: 422,
        message: errorCodes.LOCATION_NOT_FOUND,
      });
    }
  }

  private async validateNotification(id: string, userId: string) {
    const exist = await this.prisma.notificationUser.count({
      where: { id, userId },
    });

    if (!exist) {
      throw new NotFoundException({
        statusCode: 404,
        message: errorCodes.NOTIFICATION_NOT_FOUND,
      });
    }
  }
  private async notifyUserByFilter(
    notification: Notification & {
      additionalNotifications: (NotificationCustomer & {
        customer: Customer & {
          sections: CustomerSections | null;
          settings: CustomerSettings | null;
        };
      })[];
    },
    customerType: CustomerType,
  ) {
    let where: Prisma.UserWhereInput = {};
    if (notification.locationId && customerType === 'government') {
      const location = await this.prisma.location.findUnique({
        where: {
          id: notification.locationId,
        },
        select: {
          type: true,
          name: true,
          id: true,
        },
      });

      if (!location) {
        throw new UnprocessableEntityException(errorCodes.LOCATION_NOT_FOUND);
      }

      if (location.type === 'locality') {
        const json = {
          path: '$.fullAddress.city',
          equals: location.name,
        };
        where = {
          OR: [{ homeAddress: json }, { workAddress: json }],
        };
      }

      if (location.type === 'neighborhood') {
        where = {
          homeAddress: {
            path: '$.neighborhoodId',
            equals: location.id,
          },
        };
      }
    }

    if (
      notification.fromLot &&
      notification.toLot &&
      customerType === 'business'
    ) {
      where = {
        lot: {
          gte: notification.fromLot,
          lte: notification.toLot,
        },
      };
    }

    const findUser = await this.prisma.user.findMany({
      where: {
        ...where,
        role: Role.user,
        /// verify that users are active
        active: true,
        customerId: notification.customerId,
      },
      select: {
        id: true,
        pushId: true,
      },
    });

    const pushIdList: string[] = findUser
      .filter((i) => i.pushId)
      .map((i) => i.pushId as string);

    await this.prisma.notificationUser.createMany({
      data: findUser.map(({ id }) => ({
        userId: id,
        notificationId: notification.id,
      })),
    });

    if (notification.additionalNotifications) {
      const users: { username: string }[] = [];

      notification.additionalNotifications.forEach((i) => {
        const additionalNumber =
          i.customer?.settings?.additionalNotifications?.split(',');

        if (additionalNumber && additionalNumber.length) {
          additionalNumber.forEach((i) => users.push({ username: i }));
        }
      });

      const findUser = await this.prisma.user.findMany({
        where: {
          OR: users,
          role: Role.user,
          customerType,
          /// verify that users are active
          active: true,
        },
        select: {
          pushId: true,
        },
      });

      if (findUser.length) {
        findUser.forEach((i) => {
          if (i.pushId) {
            pushIdList.push(i.pushId);
          }
        });
      }
    }

    if (pushIdList.length) {
      this.pushNotificationService.pushNotification(
        {
          title: notification.title,
          description: notification.description,
          channelId: notification.emergency
            ? 'emergency-notifications'
            : 'general-notifications',
          data: {},
        },
        pushIdList,
      );
    }
  }

  async create(data: NotificationDto & { customerId: string; userId: string }) {
    const {
      additionalNotifications,
      locationId,
      userId,
      customerId,
      image,
      ...notification
    } = data;
    const customer = await this.prisma.customer.findUnique({
      where: {
        id: customerId,
      },
      select: {
        type: true,
      },
    });

    if (!customer) {
      throw new InternalServerErrorException();
    }

    let additional:
      | Prisma.NotificationCustomerUncheckedCreateNestedManyWithoutNotificationInput
      | undefined;
    if (additionalNotifications) {
      await this.validateCustomer(additionalNotifications, customerId);
      additional = {
        create: additionalNotifications.map((id) => ({
          customerId: id,
        })),
      };
    }
    const createNotification: Prisma.NotificationCreateInput = {
      ...notification,
      image: image ? (image as unknown as Prisma.InputJsonObject) : undefined,
      customer: { connect: { id: customerId } },
      user: { connect: { id: userId } },
      additionalNotifications: additional,
      location: undefined,
      notificationType: NotificationType.massive,
    };

    if (customer.type === CustomerType.government) {
      if (locationId) {
        await this.validateLocation(locationId, customerId);
        createNotification.location = changeRelationTable(locationId);
      }
      createNotification.fromLot = undefined;
      createNotification.toLot = undefined;
    }
    const notificationCreated = await this.prisma.notification.create({
      data: createNotification,
      include: {
        additionalNotifications: {
          include: {
            customer: {
              include: {
                sections: true,
                settings: true,
              },
            },
          },
        },
      },
    });

    await this.notifyUserByFilter(notificationCreated, customer.type);

    return notificationCreated;
  }

  async createMessage(
    data: SendMessageDto & { customerId: string; userId: string },
  ) {
    const users = await this.prisma.user.findMany({
      where: {
        lot: data.lot,
        customerId: data.customerId,
        /// verify that users are active
        active: true,
      },
      select: {
        id: true,
        pushId: true,
      },
    });

    if (!users.length) {
      throw new UnprocessableEntityException(errorCodes.USERS_LOT_NOT_FOUND);
    }

    const players: string[] = [];
    const ids: string[] = [];

    users.forEach((user) => {
      ids.push(user.id);
      if (user.pushId) {
        players.push(user.pushId);
      }
    });

    const notificationCreated = await this.prisma.notification.create({
      data: {
        title: 'Mensaje de la Guardia/Adm.',
        description: data.description,
        fromLot: data.lot,
        toLot: data.lot,
        notificationType: NotificationType.monitoring,
        customer: {
          connect: {
            id: data.customerId,
          },
        },
        toUsers: {
          createMany: {
            data: ids.map((id) => ({
              userId: id,
            })),
          },
        },
        user: {
          connect: {
            id: data.userId,
          },
        },
      },
    });

    if (players.length) {
      await this.pushNotificationService.pushNotification(
        {
          title: notificationCreated.title,
          description: notificationCreated.description,
          data: {},
          channelId: 'general-notifications',
        },
        players,
      );
    }

    return notificationCreated;
  }

  update(): Promise<any> {
    throw new Error('Method not implemented.');
  }

  async findAll(params: IPaginationArgs<Prisma.NotificationFindManyArgs>) {
    const { includeCount, skip, take, ...findAllParams } = params;
    return this.paginate(
      'notification',
      {
        ...findAllParams,
      },
      { includeCount, skip, take },
      ['user'],
    );
  }

  async findOne(
    id: string,
    customerId: string,
    findArgs?: {
      include?: Prisma.NotificationInclude;
      select?: Prisma.NotificationSelect;
    },
  ) {
    const args: Prisma.NotificationFindFirstArgs = {
      where: {
        id,
        customerId,
      },
      ...findArgs,
    };

    return this.getFirst('notification', args);
  }

  async notificationRead(id: string, customerId: string, userId: string) {
    await this.validateNotification(id, userId);

    return this.prisma.notificationUser.update({
      data: {
        read: true,
      },
      where: {
        id,
      },
      select: {
        id: true,
        read: true,
        notificationId: true,
      },
    });
  }

  async panic(id: string) {
    const userIds: Prisma.UserWhereInput[] = [];
    const playerIds: string[] = [];
    const user = await this.prisma.user.findUnique({
      where: {
        id,
      },
      include: {
        customer: {
          include: {
            settings: true,
          },
        },
      },
    });

    if (!user || !user.customer || !user.customer.settings) {
      return;
    }

    const customer = user.customer;

    const panicNotifications =
      customer.settings?.panicNotifications?.split(',');

    const description =
      'Ha pulsado el botón de pánico el usuario ' +
      user.fullName +
      ' de ' +
      customer.name;

    if (panicNotifications && panicNotifications.length) {
      forEach(panicNotifications, (notifyCel) => {
        userIds.push({ username: notifyCel });
      });
    }

    if (!userIds.length) {
      return;
    }
    const users = await this.prisma.user.findMany({
      where: {
        OR: userIds,
        customerType: customer.type,
        /// verfiy that users are active
        active: true,
      },
      select: {
        id: true,
        pushId: true,
      },
    });

    if (!users.length) {
      return;
    }

    forEach(users, function (user) {
      if (user.pushId) {
        playerIds.push(user.pushId);
      }
    });

    const notification = await this.prisma.notification.create({
      data: {
        title: 'Se pulsó el botón de pánico',
        description,
        createdAt: new Date(),
        customer: {
          connect: {
            id: customer.id,
          },
        },
        user: {
          connect: {
            id: user.id,
          },
        },
        toUsers: {
          createMany: {
            data: users.map(({ id }) => ({
              userId: id,
            })),
          },
        },
        notificationType: 'panic',
      },
    });

    if (playerIds.length) {
      this.pushNotificationService.pushNotification(
        {
          title: notification.title,
          description: notification.description,
          channelId: notification.emergency
            ? 'emergency-notifications'
            : 'general-notifications',
          data: {
            emergency: true,
            panicFromUser: user.id,
          },
        },
        playerIds,
      );
    }

    return {
      message: 'users notified',
    };
  }
}
