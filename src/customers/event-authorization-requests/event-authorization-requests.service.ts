import { Prisma, NotificationType, EventType } from '@prisma/client';
import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from '@src/database/prisma.service';
import {
  IEntityService,
  IPaginationArgs,
  IRequestUser,
} from '@src/interfaces/types';
import { Service } from '@src/common/classes/service.class';
import { CreateEventAuthorizationRequest } from './dto/event-authorization-request.dto';
import { errorCodes as errorCodesAuth } from '@src/auth/auth.constants';
import { errorCodes } from './event-authorization-requests.constants';
import { PushNotificationService } from '@src/push-notification/push-notification.service';
import * as dayjs from 'dayjs';
import { ChangeLog } from '../events/entities/change-log.entity';
import { User } from '@prisma/client';
import { EventAuthorizationRequest } from '@prisma/client';
import { FirebaseService } from '@src/firebase/firebase.service';
import { EventsService } from '../events/events.service';

@Injectable()
export class EventAuthorizationRequestService
  extends Service
  implements IEntityService
{
  constructor(
    readonly prisma: PrismaService,
    private firebaseService: FirebaseService,
    private pushNotificationService: PushNotificationService,
    private eventsService: EventsService,
  ) {
    super(prisma);
  }
  async create({
    data,
    userId,
    customerId,
  }: {
    data: CreateEventAuthorizationRequest;
    userId: string;
    customerId: string;
  }) {
    const currentUser = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        userPermissions: {
          select: {
            visitorsQueue: true,
            requestAuthorization: true,
            visitorsEventTypeId: true,
            authorizationEventTypeId: true,
          },
        },
        customer: {
          select: {
            id: true,
            countryCode: true,
            trialPeriod: true,
          },
        },
      },
    });

    if (
      !currentUser?.userPermissions?.visitorsQueue &&
      !currentUser?.userPermissions?.requestAuthorization
    ) {
      throw new UnprocessableEntityException(errorCodesAuth.ACTION_NOT_ALLOWED);
    }

    const users = await this.prisma.user.findMany({
      where: {
        // verify that users are active
        active: true,
        lot: data.lot,
        customerId,
        authorizedUser: {
          sendEvents: true,
        },
      },
      include: {
        authorizedUser: true,
      },
    });

    if (!users.length) {
      throw new UnprocessableEntityException(
        errorCodes.USERS_WITH_LOT_NOT_FOUND,
      );
    }

    let eventTypeId = currentUser?.userPermissions?.authorizationEventTypeId;
    if (currentUser?.userPermissions?.visitorsQueue) {
      eventTypeId = currentUser.userPermissions?.visitorsEventTypeId;
    }
    if (!eventTypeId) {
      throw new UnprocessableEntityException(errorCodes.EVENT_NOT_ASSIGNED);
    }

    const text = `${data.authorized} se encuentra esperando en la Guardia. Por favor ingrese a Basapp CyB para autorizarlo.`;

    const authorization: Prisma.EventAuthorizationRequestCreateInput = {
      lot: data.lot,
      authorized: data.authorized,
      trialPeriod: currentUser.customer?.trialPeriod || false,
      monitor: {
        connect: {
          id: currentUser.id,
        },
      },
      customer: {
        connect: {
          id: customerId,
        },
      },
      eventType: {
        connect: {
          id: eventTypeId,
        },
      },
      text,
    };

    const request = await this.prisma.eventAuthorizationRequest.create({
      data: authorization,
    });

    await this.sendPushNotification(
      currentUser.id,
      users,
      customerId,
      request,
      text,
    );

    return request;
  }

  private async sendPushNotification(
    currentUserId: string,
    user: User[],
    customerId: string,
    request: EventAuthorizationRequest,
    requestText: string,
  ) {
    const notificationCreated = await this.prisma.notification.create({
      data: {
        title: 'Ud. tiene una visita esperando en la guardia',
        description: requestText,
        emergency: false,
        notificationType: NotificationType.authorization,
        toUsers: {
          createMany: {
            data: user.map((i) => ({
              userId: i.id,
            })),
          },
        },
        customer: {
          connect: {
            id: customerId,
          },
        },
        user: {
          connect: {
            id: currentUserId,
          },
        },
        authorizationRequest: {
          connect: {
            id: request.id,
          },
        },
      },
    });

    const pushList = user
      .filter((i) => i.pushId)
      .map((i) => i.pushId as string);

    await this.pushNotificationService.pushNotification(
      {
        title: notificationCreated.title,
        description: notificationCreated.description,
        channelId: 'auth-request-notifications',
        data: {
          userId: notificationCreated.userId,
        },
      },
      pushList,
    );

    return;
  }

  private async findEventAuthorizationRequest(id: string, customerId: string) {
    const request = await this.prisma.eventAuthorizationRequest.findFirst({
      where: {
        id,
        customerId,
      },
    });

    if (!request) {
      throw new NotFoundException(
        errorCodes.EVENT_AUTHORIZATION_REQUEST_NOT_FOUND,
      );
    }

    return request;
  }

  private async findUser(id: string) {
    const userFound = await this.prisma.user.findUnique({
      where: {
        id,
      },
      include: {
        customer: true,
      },
    });

    if (!userFound) {
      throw new InternalServerErrorException();
    }

    if (!userFound.customer) {
      throw new InternalServerErrorException();
    }

    return {
      ...userFound,
      customer: userFound.customer,
    };
  }

  update(): Promise<any> {
    throw new Error('Method not implemented.');
  }

  async findAll(
    params: IPaginationArgs<Prisma.EventAuthorizationRequestFindManyArgs>,
  ) {
    const { includeCount, skip, take, ...findAllParams } = params;
    return this.paginate(
      'eventAuthorizationRequest',
      {
        ...findAllParams,
      },
      { includeCount, skip, take },
      ['user', 'monitor'],
    );
  }

  async confirm(id: string, customerId: string, userRequest: IRequestUser) {
    const request = await this.findEventAuthorizationRequest(id, customerId);

    const from = dayjs().toDate();
    const to = dayjs(from).add(2, 'hours').toDate();

    if (request.confirmed) {
      throw new UnprocessableEntityException(errorCodes.ALREADY_CONFIRMED);
    }
    if (request.rejected) {
      throw new UnprocessableEntityException(errorCodes.ALREADY_REJECTED);
    }

    await this.eventsService.create({
      data: {
        fullName: request.authorized || undefined,
        from,
        to,
        eventTypeId: request.eventTypeId,
      },
      customerId,
      userRequest: userRequest,
    });

    return await this.prisma.eventAuthorizationRequest.update({
      where: {
        id: request.id,
      },
      data: {
        confirmed: true,
      },
    });
  }

  async reject(id: string, customerId: string, userId: string) {
    const request = await this.findEventAuthorizationRequest(id, customerId);
    const user = await this.findUser(userId);

    const from = dayjs().toDate();

    if (request.confirmed) {
      throw new UnprocessableEntityException(errorCodes.ALREADY_CONFIRMED);
    }
    if (request.rejected) {
      throw new UnprocessableEntityException(errorCodes.ALREADY_REJECTED);
    }

    const eventState = await this.prisma.eventState.findFirst({
      where: { name: 'Rechazado', customerId: null },
    });

    if (!eventState) {
      throw new InternalServerErrorException();
    }

    const changeLog: ChangeLog[] = [];

    changeLog.push({
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      state: {
        id: eventState.id,
        name: eventState.name,
      },
      observations: '',
      updatedAt: from,
    });

    const eventCreated = await this.prisma.event.create({
      data: {
        fullName: request.authorized,
        from,
        to: from,
        lot: user.lot,
        trialPeriod: user.customer.trialPeriod || false,
        changeLog: JSON.stringify(changeLog),
        customer: {
          connect: {
            id: customerId,
          },
        },
        user: {
          connect: {
            id: userId,
          },
        },
        eventType: {
          connect: {
            id: request.eventTypeId,
          },
        },
        eventState: {
          connect: {
            id: eventState.id,
          },
        },
      },
      include: {
        eventType: true,
      },
    });

    // notify to firebase has been updated
    this.firebaseService.pushEventFirebase({
      id: eventCreated.id,
      customerId,
      eventType: eventCreated.eventType as EventType,
      eventStateId: eventState.id,
      user,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return await this.prisma.eventAuthorizationRequest.update({
      where: {
        id: request.id,
      },
      data: {
        rejected: true,
      },
    });
  }
}
