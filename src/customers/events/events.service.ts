import { Lot, Prisma, EventType, EventState, User, Role } from '@prisma/client';
import {
  Injectable,
  UnprocessableEntityException,
  InternalServerErrorException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import {
  PrismaGirovisionService,
  PrismaService,
} from '@src/database/prisma.service';
import { Prisma as PrismaGirovision } from '@prisma/girovision-client';
import {
  IEntityService,
  IPaginationArgs,
  IRequestUser,
} from '@src/interfaces/types';
import { Service } from '@src/common/classes/service.class';
import { UpdateEventStateDto } from './dto/update-event-state.dto';
import { errorCodes } from './events.constants';
import { ChangeLog } from './entities/change-log.entity';
import { File } from '@src/common/dto/file.dto';
import * as dayjs from 'dayjs';
import * as utc from 'dayjs/plugin/utc';
import { flattenDeep, head, toNumber, toUpper } from 'lodash';
import { v1 as uuidv1, v4 as uuidv4 } from 'uuid';
import { toBuffer } from 'bwip-js';
import { AuthorizedDto } from './dto/authorized.dto';
import {
  AuthorizedUserEvent,
  CreateEvent,
  CreateEventParams,
  CustomerRelated,
  EventCreateManyInput,
} from './events.controller.types';
import { PushNotificationService } from '@src/push-notification/push-notification.service';
import { FirebaseService } from '@src/firebase/firebase.service';
import { Event } from './entities/event.entity';
import { QrCodeDto } from './dto/qr-code.dto';
import { ReservationService } from '../reservations/reservations.service';
import { ExternalService } from '@src/common/services/external.service';
import { Logger } from '@src/common/logger';
import { ListQueryArgsDto } from '@src/common/dto/list-query-args.dto';
import { validateCustomers } from '@src/utils';

dayjs.extend(utc);

@Injectable()
export class EventsService extends Service implements IEntityService {
  static defaultUTCOffset = -180;

  constructor(
    readonly prisma: PrismaService,
    readonly prismaGirovision: PrismaGirovisionService,
    private readonly externalService: ExternalService,
    private firebaseService: FirebaseService,
    private readonly pushNotificationService: PushNotificationService,
    private readonly reservationService: ReservationService,
  ) {
    super(prisma);
  }

  private async alertOnNewEvents(
    events: EventCreateManyInput[],
    eventType: EventType,
    customer: CustomerRelated,
    eventState: EventState,
  ) {
    const { settings } = customer;
    const players: string[] = [];
    let userToNotify: { username: string }[] = [];
    if (eventType.notifySecurityChief && settings.securityChief) {
      userToNotify.push({ username: settings.securityChief });
    }
    if (eventType.notifySecurityGuard && settings.securityGuard) {
      userToNotify.push({ username: settings.securityGuard });
    }

    if (eventType.additionalNotifications) {
      const additional = eventType.additionalNotifications.split(',');
      userToNotify = userToNotify.concat(
        additional.map((number) => ({
          username: `${customer.countryCode}${number}`,
        })),
      );
    }
    if (userToNotify.length) {
      const users = await this.prisma.user.findMany({
        where: {
          customerId: customer.id,
          /// verify that users are active
          active: true,
          OR: userToNotify,
        },
      });

      if (users.length) {
        users.forEach((user) => {
          if (user.pushId) {
            players.push(user.pushId);
          }
        });
      }
    }

    if (players.length) {
      this.pushNotificationService.pushNotification(
        {
          title: eventState.name,
          description: eventType.title,
          channelId: 'event-notifications',
          data: {
            events: events.map((event) => event.id),
          },
        },
        players,
      );
    }
  }

  private async alertOnEventUpdates(event: Event, userId: string) {
    const players: string[] = [];
    const ids: string[] = [];
    if (event.eventType?.notifyUser) {
      if (event.user?.pushId) {
        players.push(event.user.pushId);
      }
      if (event.userId) {
        ids.push(event.userId);
      }
    }

    if (event.eventType?.additionalNotifications) {
      const additional = event.eventType.additionalNotifications.split(',');
      const userToNotify = additional.map((number) => ({
        username: `${event?.customer?.countryCode}${number}`,
      }));

      if (userToNotify.length) {
        const users = await this.prisma.user.findMany({
          where: {
            customerId: event.customerId,
            /// verify that users are active
            active: true,
            OR: userToNotify,
          },
        });

        if (users.length) {
          users.forEach((user) => {
            if (user.pushId) {
              players.push(user.pushId);
              ids.push(user.id);
            }
          });
        }
      }
    }

    if (ids.length) {
      const notificationCreated = await this.prisma.notification.create({
        data: {
          title: `Evento de ${event.eventType!.title}`,
          description: `Su evento informando a ${
            event.fullName
          } cambio de estado a ${event.eventState!.name}`,
          customer: {
            connect: {
              id: event.customerId,
            },
          },
          user: {
            connect: {
              id: userId,
            },
          },
          toUsers: {
            createMany: {
              data: ids.map((i) => ({
                userId: i,
              })),
            },
          },
          event: {
            connect: {
              id: event.id,
            },
          },
          notificationType: 'event',
        },
      });

      if (players.length) {
        await this.pushNotificationService.pushNotification(
          {
            title: notificationCreated.title,
            description: notificationCreated.description,
            channelId: 'event-notifications',
            data: {
              eventId: event.id,
            },
          },
          players,
        );
      }
    }
  }

  private async sendEventToICM(
    lot: string | null,
    events: EventCreateManyInput[],
    customer: CustomerRelated,
    eventType: EventType,
  ) {
    try {
      const {
        integrations: { icmToken, icmUrl },
      } = customer;

      if (icmUrl && icmToken && lot) {
        const customerLot = await this.prisma.customerLot.findFirst({
          where: {
            lot,
            customerId: customer.id,
          },
        });

        if (customerLot) {
          const eventsDelivered: Prisma.EventWhereInput[] = [];
          for (const event of events) {
            let id: string | null | undefined;

            if (eventType.isDelivery && eventType.icmDeliveryType) {
              id = await this.externalService.createDeliveryInvitation({
                event,
                icmToken,
                icmUrl,
                icmUid: customerLot.icmUid,
                icmDeliveryType: eventType.icmDeliveryType,
              });
            } else {
              id = await this.externalService.createGuestInvitation({
                event,
                icmToken,
                icmUrl,
                icmUid: customerLot.icmUid,
              });
            }
            if (id) {
              eventsDelivered.push({ id });
            }
          }

          await this.prisma.event.updateMany({
            data: {
              isDelivery: true,
            },
            where: {
              OR: eventsDelivered,
            },
          });
        }
      }
    } catch (err) {
      Logger.error(err);
      return err;
    }
  }

  private async sendEventToGiroVision(
    events: EventCreateManyInput[],
    customer: CustomerRelated,
    eventType: EventType,
  ) {
    try {
      const { integrations } = customer;
      const listToCreated: PrismaGirovision.invitadosCreateInput[] = [];
      if (integrations.giroVisionId) {
        for (const event of events) {
          if (event.lot) {
            const uf =
              event.lot.length < 3
                ? '0'.repeat(3 - event.lot.length) + event.lot
                : event.lot;

            listToCreated.push({
              id_consorcio: parseInt(integrations.giroVisionId),
              uf: uf,
              txt_nombre: event.fullName,
              txt_documento: event.dni || '0',
              txt_patente: event.patent,
              txt_motivo: event.description,
              fec_valido_desde: event.from,
              cant_dias_valido: 1,
              id_tipo_entrada: eventType.gvEntryTypeId,
              id_tipo_invitado: eventType.gvGuestTypeId,
              id_tipo_reingreso: 1,
              fec_carga: new Date(),
              avisar_propietario: 'N',
              basapp_id: event.externalId,
            });
          }
        }

        if (listToCreated.length) {
          await this.prismaGirovision.invitados.createMany({
            data: listToCreated,
          });
        }
      }
    } catch (err) {
      Logger.error(err);
    }
  }

  private getCodeData(
    qrFormat: number | null,
    utcOffset: number,
    event: {
      from: Date;
      lastName?: string | null;
      firstName?: string | null;
      patent?: string | null;
      dni?: string | null;
    },
    user: User,
    customer: CustomerRelated,
  ) {
    const dateFrom = dayjs
      .utc(event.from)
      .utcOffset(utcOffset)
      .format('DD/MM/YYYY');
    const dateTo = dayjs
      .utc(event.from)
      .utcOffset(utcOffset)
      .format('DD/MM/YYYY');
    const lot = user.lot;
    const customerName = customer.name;
    let data = '';
    let patent;
    switch (qrFormat) {
      case 1:
        data =
          '0@' +
          event.lastName +
          '@' +
          event.firstName +
          '@M@' +
          event.dni +
          '@A@' +
          dateFrom +
          '@' +
          dateTo +
          '\r';
        break;
      case 2:
        patent = event.patent || 'a';
        data =
          '@' +
          event.dni +
          '    @A@1@' +
          event.lastName +
          '@' +
          event.firstName +
          '@' +
          patent +
          '@' +
          dateFrom +
          '@F@' +
          dateTo +
          '@' +
          customerName +
          '@' +
          lot;
        break;
      case 3:
      case 4:
        patent = event.patent || 'ARGENTINA';
        data =
          '@' +
          event.dni +
          '    @A@1@' +
          event.lastName +
          '@' +
          event.firstName +
          '@' +
          patent +
          '@' +
          dateFrom +
          '@F@' +
          dateTo +
          '@' +
          customerName +
          '@' +
          lot +
          '@31/12/2099@999@0@ILR:9.99 C:999999.99 (No Cap.)@UNIDAD #99 || S/N: 0099>2999>>9999';
        break;
      default:
        break;
    }

    return data;
  }

  private async findCustomer(customerId: string): Promise<CustomerRelated> {
    const customer = await this.prisma.customer.findUnique({
      where: {
        id: customerId,
      },
      include: {
        settings: true,
        integrations: true,
      },
    });

    if (!customer) {
      throw new InternalServerErrorException(errorCodes.CUSTOMER_NOT_FOUND);
    }
    if (!customer.integrations || !customer.settings) {
      throw new InternalServerErrorException(
        errorCodes.CUSTOMER_RELATIONS_NOT_EXIST,
      );
    }

    return {
      ...customer,
      integrations: customer.integrations,
      settings: customer.settings,
    };
  }

  private async findEventType(
    eventTypeId: string,
    customerId: string,
  ): Promise<EventType> {
    const eventType = await this.prisma.eventType.findFirst({
      where: {
        id: eventTypeId,
        customerId,
      },
    });

    if (!eventType) {
      throw new UnprocessableEntityException(errorCodes.EVENT_TYPE_NOT_FOUND);
    }
    return eventType;
  }

  private async findUser(where: Prisma.UserWhereInput): Promise<User> {
    const user = await this.prisma.user.findFirst({
      where,
      include: {
        customer: {
          include: {
            settings: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnprocessableEntityException(errorCodes.USER_NOT_FOUND);
    }

    if (!user.active) {
      throw new UnprocessableEntityException(errorCodes.INACTIVE_USER);
    }

    return user;
  }

  private async findAuthorizedUser(where: Prisma.AuthorizedUserWhereInput) {
    const authorizedUser = await this.prisma.authorizedUser.findFirst({
      where,
      include: {
        customer: {
          select: {
            countryCode: true,
          },
        },
      },
    });

    if (!authorizedUser) {
      throw new UnprocessableEntityException(
        errorCodes.AUTHORIZED_USER_NOT_FOUND,
      );
    }

    return authorizedUser;
  }

  private async validateRequiredFields(
    eventType: EventType,
    event: { description?: string | null; file?: File | null },
  ) {
    if (eventType.description && !event.description) {
      throw new BadRequestException(errorCodes.DESCRIPTION_NOT_ADDED);
    }

    if (eventType.attachment && !event.file) {
      throw new BadRequestException(errorCodes.FILE_NOT_ADDED);
    }
  }

  private setFullName(
    events: Prisma.EventCreateManyInput[],
    authorized: AuthorizedDto[] | undefined,
  ): EventCreateManyInput[] {
    if (!authorized?.length) {
      return events.map((event) => ({
        ...event,
        id: uuidv4(),
        externalId: uuidv1(),
      })) as any;
    }
    const eventsDivided = authorized.map((person) => {
      return events.map((event) => ({
        ...event,
        fullName: person.name || '',
        id: uuidv4(),
        dni: person.dni || '',
        externalId: uuidv1(),
      }));
    });

    return flattenDeep(eventsDivided) as any;
  }

  private divideEventIntoDays(event: CreateEvent, utcOffset: number) {
    const dateFrom = dayjs.utc(event.from).utcOffset(utcOffset, true);
    const dateTo = dayjs.utc(event.to).utcOffset(utcOffset, true);

    const diff = dateTo.diff(dateFrom, 'days');
    const events: Prisma.EventCreateManyInput[] = [
      {
        ...event,
        file: event.file as unknown as Prisma.InputJsonObject,
        from: dateFrom.toDate(),
        to: dateTo.toDate(),
      },
    ];
    let count = 0;
    if (diff > 0 && !event.isPermanent) {
      //Es de más de un día
      while (count < diff) {
        count++;
        events.push({
          ...event,
          from: dateFrom.add(count, 'days').startOf('day').toDate(),
          to: dateFrom.add(count, 'days').endOf('day').toDate(),
          file: event.file as unknown as Prisma.InputJsonObject,
        });
      }
      // Al último evento le seteo la fecha y hora de fin original
      events[events.length - 1].to = dateTo.toDate();

      // Modifico la fecha hasta del evento original
      events[0].to = dateFrom.endOf('day').toDate();
    }
    //setFullName
    return events;
  }

  private async validatePermanent(event: {
    isCopy?: boolean;
    dni?: string;
    eventStateId: string;
    lot?: string | null;
    from: Date;
    userId?: string;
    authorizedUserId?: string;
    utcOffset: number;
  }) {
    if (
      !event.isCopy &&
      event.dni &&
      (event.userId || event.authorizedUserId)
    ) {
      const exist = await this.prisma.event.count({
        where: {
          dni: event.dni,
          eventStateId: event.eventStateId,
          lot: event.lot,
          to: {
            gte: dayjs
              .utc(event.from)
              .utcOffset(event.utcOffset, true)
              .toDate(),
          },
          from: {
            lte: dayjs
              .utc(event.from)
              .utcOffset(event.utcOffset, true)
              .toDate(),
          },
          OR: [
            { userId: event.userId },
            { authorizedUserId: event.authorizedUserId },
          ],
        },
      });

      if (exist) {
        throw new BadRequestException(errorCodes.DUPLICATE_PERMANENT_EVENT);
      }
    }
  }

  private messageTokenQR(fullName: string, customer: string, date: string) {
    return `${fullName} te envió esta invitación a ${customer} para acceder el día ${date}`;
  }

  private async validateEvent(id: string, customerId: string) {
    const eventExist = await this.prisma.event.findFirst({
      where: {
        id,
        customerId,
      },
      include: {
        customer: {
          include: {
            integrations: true,
          },
        },
      },
    });

    if (!eventExist) {
      throw new UnprocessableEntityException(errorCodes.EVENT_NOT_FOUND);
    }
    return eventExist;
  }

  update(): Promise<any> {
    //before saveStateId = esto es para analizar en el UPDATE
    //after validateState = esto para analizar en el UPDATE
    //after alertOnEventUpdates = esto es para analizar en el UPDATE
    throw new Error('Method not implemented.');
  }

  async findAll(params: IPaginationArgs<Prisma.EventFindManyArgs>) {
    const { includeCount, skip, take, ...findAllParams } = params;
    return this.paginate(
      'event',
      {
        ...findAllParams,
      },
      { includeCount, skip, take },
      ['user', 'statesman', 'monitor'],
    );
  }

  findOne(
    id: string,
    customerId: string,
    findArgs?: {
      include?: Prisma.EventInclude;
      select?: Prisma.EventSelect;
    },
  ) {
    const args: Prisma.EventFindFirstArgs = {
      where: {
        id,
        customerId,
      },
      ...findArgs,
    };

    return this.getFirst('event', args);
  }

  async generateQR(qr: QrCodeDto) {
    try {
      const eventFound = await this.prisma.event.findFirst({
        where: {
          token: qr.token,
        },
        include: {
          user: true,
          customer: {
            include: {
              settings: true,
              integrations: true,
            },
          },
          eventState: true,
          eventType: true,
        },
      });

      if (!eventFound) {
        return null;
      }

      const { customer, lot, from, user, eventType } = eventFound;

      if (!customer || !eventType || !user) {
        return null;
      }

      if (
        !customer.settings ||
        !customer.integrations ||
        !eventType.generateQr
      ) {
        throw new InternalServerErrorException();
      }

      let lotFound: Lot | undefined | null;

      if (lot) {
        lotFound = await this.prisma.lot.findFirst({
          where: {
            lot,
            customerId: customer.id,
            active: true,
          },
        });
      }

      const codeType =
        eventType.qrFormat === 1 || eventType.qrFormat === 4
          ? 'pdf417'
          : 'qrcode';

      const utcOffset = customer.timezone
        ? toNumber(customer.timezone)
        : EventsService.defaultUTCOffset;

      const text = this.getCodeData(
        eventType.qrFormat,
        utcOffset,
        {
          from: eventFound.from,
          lastName: eventFound.lastName,
          firstName: eventFound.firstName,
          patent: qr.patent,
          dni: qr.dni,
        },
        user,
        {
          ...customer,
          settings: customer.settings,
          integrations: customer.integrations,
        },
      );
      const buffer = await toBuffer({
        bcid: codeType, // qrcode || pdf417
        scaleX: 4,
        text,
      });

      const qrCode = 'data:image/png;base64,' + buffer.toString('base64');
      const date = dayjs(from)
        .utcOffset(utcOffset)
        .format('DD/MM/YYYY')
        .toString();

      await this.prisma.event.update({
        data: {
          dni: qr.dni,
          patent: qr.patent,
          qrCode,
        },
        where: {
          id: eventFound.id,
        },
      });

      return {
        eventStateId: eventFound.eventStateId,
        qrCode,
        qrPending: false,
        message: this.messageTokenQR(user.fullName, customer.name, date),
        lot: lotFound,
      };
    } catch (err) {
      Logger.error(err);
      return err;
    }
  }

  async findByToken(token: string) {
    const eventFound = await this.prisma.event.findFirst({
      where: {
        token,
      },
      include: {
        user: true,
        customer: true,
        eventState: {
          select: {
            id: true,
            name: true,
          },
        },
        eventType: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    if (!eventFound) {
      return null;
    }

    const { customer, lot, from, user } = eventFound;

    if (user && lot && customer) {
      const lotFound = await this.prisma.lot.findFirst({
        where: {
          lot,
          customerId: customer.id,
          active: true,
        },
      });

      const utcOffset = customer.timezone
        ? toNumber(customer.timezone)
        : EventsService.defaultUTCOffset;

      const date = dayjs(from)
        .utcOffset(utcOffset)
        .format('DD/MM/YYYY')
        .toString();

      return {
        eventId: eventFound.id,
        eventType: eventFound.eventType,
        eventState: eventFound.eventState,
        qrCode: eventFound.qrCode,
        qrPending: eventFound.qrPending,
        patent: eventFound.patent,
        message: this.messageTokenQR(user.fullName, customer.name, date),
        lot: lotFound,
      };
    }

    return null;
  }

  async eventUpdateState(
    data: UpdateEventStateDto,
    id: string,
    userId: string,
    customerId: string,
  ) {
    const state = await this.prisma.eventState.findFirst({
      where: {
        id: data.eventStateId,
        OR: [{ customerId }, { customerId: null }],
      },
      select: {
        id: true,
        name: true,
      },
    });

    if (!state) {
      throw new UnprocessableEntityException(errorCodes.EVENT_STATE_NOT_FOUND);
    }

    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        customerId,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
    });

    if (!user) {
      throw new UnprocessableEntityException(errorCodes.USER_NOT_FOUND);
    }

    const event = await this.validateEvent(id, customerId);
    let changeLog: ChangeLog[] = [];
    if (event.changeLog) {
      changeLog = JSON.parse(event.changeLog);
    }

    changeLog.push({
      user,
      state,
      observations: data.observations,
      updatedAt: new Date(),
    });

    const eventUpdated = await this.prisma.event.update({
      data: {
        changeLog: JSON.stringify(changeLog),
        eventState: {
          connect: {
            id: data.eventStateId,
          },
        },
        observations: data.observations,
      },
      where: { id },
      include: {
        user: true,
        eventState: true,
        eventType: true,
        customer: true,
      },
    });

    await this.alertOnEventUpdates(eventUpdated, userId);

    if (eventUpdated.eventType) {
      // notify to firebase has been updated
      this.firebaseService.updateEventFirebase({
        id: eventUpdated.id,
        customerId,
        eventType: eventUpdated.eventType,
        createdAt: eventUpdated.createdAt,
        eventStateId: data.eventStateId,
        updatedAt: eventUpdated.updatedAt,
        user: {
          id: user.id,
          fullName: `${user.firstName} ${user.lastName}`,
        },
      });
    }

    if (state.name === 'Cancelado' || state.name === 'Usuario canceló') {
      if (eventUpdated.isDelivery) {
        await this.externalService.cancelDeliveryInvitation({
          ...eventUpdated,
          customer: event.customer,
        });
      } else {
        await this.externalService.cancelGuestInvitation({
          ...eventUpdated,
          customer: event.customer,
        });
      }
    }

    return eventUpdated;
  }

  async create({ data, userRequest, customerId }: CreateEventParams) {
    const {
      file,
      authorized,
      utcOffset = EventsService.defaultUTCOffset,
      ...res
    } = data;
    const event: CreateEvent = {
      ...res,
      lot: null,
      changeLog: '',
      token: undefined,
      qrCode: undefined,
      qrPending: false,
      isPermanent: false,
      file: file ? file : undefined,
      customerId,
      trialPeriod: false,
      eventStateId: undefined,
      userId: undefined,
      //transformToUpperCase
      firstName: toUpper(res.firstName),
      lastName: toUpper(res.lastName),
      patent: toUpper(res.patent),
      fullName: toUpper(res.fullName),
    };

    if (userRequest.role === 'monitoring') {
      event.monitorId = userRequest.id;
    } else if (userRequest.role === 'statesman') {
      event.statesmanId = userRequest.id;
    }

    const customer: CustomerRelated = await this.findCustomer(customerId);

    if (customer.trialPeriod) {
      event.trialPeriod = customer.trialPeriod;
    }
    // concatenateFullName
    if (event.firstName && event.lastName) {
      event.fullName = `${event.firstName} ${event.lastName}`;
    }
    // validateRequiredFields
    const eventType = await this.findEventType(event.eventTypeId, customerId);
    await this.validateRequiredFields(eventType, {
      description: event.description,
      file,
    });

    //setUserId
    let user: User | null | undefined;
    if (!event.statesmanId && !event.monitorId) {
      user = await this.findUser({ id: userRequest.id, customerId });
    }

    //setIsPermanent
    event.isPermanent = eventType.isPermanent;
    //setTimeStamp
    if (!event.from) {
      event.from = new Date();
    }
    if (!event.to) {
      event.to = new Date();
    }
    // validateDates = valida fecha con en create-event.dto.ts
    if (dayjs(event.from).isAfter(event.to)) {
      throw new BadRequestException(errorCodes.DATES_ARE_INCORRECT);
    }

    let authorizedUser: AuthorizedUserEvent;
    //setCustomerId = el customer ya viene desde el request, solo buscamos el lote
    if (event.authorizedUserId) {
      authorizedUser = await this.findAuthorizedUser({
        id: event.authorizedUserId,
        customerId,
      });
      event.lot = authorizedUser.lot;
      if (!user) {
        user = await this.prisma.user.findFirst({
          where: {
            username:
              authorizedUser.customer.countryCode + authorizedUser.username,
            customerId,
          },
        });
      }
    } else if (user && user?.authorizedUserId) {
      authorizedUser = await this.findAuthorizedUser({
        id: user.authorizedUserId,
        customerId,
      });
    }

    if (user) {
      event.userId = user.id;
      if (user.lot) {
        event.lot = user.lot;
      }
    }
    // setDefaultState
    const eventState = await this.prisma.eventState.findFirst({
      where: {
        name: 'Emitido',
        customerId: null,
      },
    });

    if (!eventState) {
      throw new InternalServerErrorException();
    }
    event.eventStateId = eventState.id;
    //blockInactiveUser
    if (!event.statesmanId && !event.monitorId) {
      if (!authorizedUser?.sendEvents) {
        throw new UnprocessableEntityException(errorCodes.CANNOT_SEND_EVENTS);
      }
    }

    //generateQr
    if (user) {
      if (eventType.generateQr) {
        event.token = uuidv1();
        if (event.dni) {
          const text = this.getCodeData(
            eventType.qrFormat,
            utcOffset,
            {
              from: event.from,
              lastName: event.lastName,
              firstName: event.firstName,
              patent: event.patent,
              dni: event.dni,
            },
            user,
            customer,
          );
          let codeType = 'qrcode';
          if (eventType.qrFormat === 1 || eventType.qrFormat === 4) {
            codeType = 'pdf417';
          }

          try {
            const buffer = await toBuffer({
              bcid: codeType, // qrcode || pdf417
              scaleX: 4,
              text,
            });
            event.qrCode = 'data:image/png;base64,' + buffer.toString('base64');
          } catch (err) {
            throw new InternalServerErrorException(
              errorCodes.QR_CODE_NOT_GENERATED,
            );
          }
        } else {
          event.qrPending = true;
        }
      }
    }
    //validatePermanent
    await this.validatePermanent({
      isCopy: event.isCopy,
      eventStateId: eventState.id,
      from: event.from,
      userId: user?.id,
      lot: event.lot,
      dni: event.dni,
      authorizedUserId: authorizedUser?.id,
      utcOffset,
    });

    //divideEventIntoDays
    const eventsWithoutId = this.divideEventIntoDays(event, utcOffset);

    //setFullName = les seteo el id y external ID.
    const events = this.setFullName(eventsWithoutId, authorized);

    const eventsCreated = await this.prisma.event.createMany({
      data: events,
    } as any);

    const eventOfTheDay = events.find((i) => dayjs().isSame(i.from, 'day'));

    if (eventOfTheDay) {
      const userInfoRequest = await this.prisma.user.findUnique({
        where: { id: userRequest.id },
        select: {
          id: true,
          fullName: true,
        },
      });

      if (userInfoRequest) {
        this.firebaseService.pushEventFirebase({
          id: eventOfTheDay.id,
          customerId,
          eventType,
          eventStateId: event.eventStateId,
          user: userInfoRequest,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }
    //alertOnNewEvent
    if (!event.isCopy) {
      this.alertOnNewEvents(events, eventType, customer, eventState);
    }

    //sendEventToICM
    if (event.dni && !event.isCopy) {
      this.sendEventToICM(event.lot, events, customer, eventType);
    }

    //sendEventToGiroVision
    this.sendEventToGiroVision(events, customer, eventType);

    const firstEventCreated = head(events);

    return {
      ...firstEventCreated,
      created: eventsCreated.count,
    };
  }

  async cancelEvent({ id, user }: { id: string; user: IRequestUser }) {
    const event = await this.prisma.event.findUnique({
      where: {
        id,
      },
      include: {
        user: true,
        customer: {
          include: {
            integrations: true,
          },
        },
      },
    });

    if (!event) {
      throw new NotFoundException(errorCodes.EVENT_NOT_FOUND);
    }

    if (event.userId !== user.id && user.role === Role.user) {
      throw new UnprocessableEntityException(errorCodes.EVENT_NOT_OWNER);
    }

    const eventState = await this.prisma.eventState.findFirst({
      where: { name: 'Usuario canceló', customerId: null },
    });

    if (!eventState) {
      throw new InternalServerErrorException();
    }

    let chLog: ChangeLog[] = [];

    if (event.changeLog) {
      chLog = JSON.parse(event.changeLog);
    }

    chLog.push({
      user: {
        id: event.user?.id || '',
        firstName: event.user?.firstName || '',
        lastName: event.user?.lastName || '',
      },
      state: {
        id: eventState.id,
        name: eventState.name,
      },
      observations: 'Cancelado por el usuario',
      updatedAt: new Date(),
    });

    const eventUpdated = await this.prisma.event.update({
      where: {
        id,
      },
      data: {
        eventStateId: eventState.id,
        changeLog: JSON.stringify(chLog),
      },
    });

    if (event.reservationId) {
      await this.reservationService.cancelReservation({
        id: event.reservationId,
        eventStateId: eventState.id,
        userId: user.id,
      });
    }

    if (eventUpdated.isDelivery) {
      await this.externalService.cancelDeliveryInvitation({
        ...eventUpdated,
        customer: event.customer,
      });
    } else {
      await this.externalService.cancelGuestInvitation({
        ...eventUpdated,
        customer: event.customer,
      });
    }

    return eventUpdated;
  }

  async attendEventGV(id: string, customerId: string, userId: string) {
    await this.findCustomer(customerId);
    const event = await this.prisma.event.findUnique({
      where: {
        id,
      },
    });

    if (!event) {
      throw new NotFoundException(errorCodes.EVENT_NOT_FOUND);
    }

    const eventState = await this.prisma.eventState.findFirst({
      where: {
        name: 'Atendido',
        customerId: null,
      },
    });

    if (!eventState) {
      throw new InternalServerErrorException(errorCodes.EVENT_STATE_NOT_FOUND);
    }

    let changeLog: ChangeLog[] = [];
    if (event.changeLog) {
      changeLog = JSON.parse(event.changeLog);
    }

    changeLog.push({
      user: {
        id: '',
        firstName: '',
        lastName: '',
      },
      state: {
        id: eventState.id,
        name: eventState.name,
      },
      observations: 'Atendido por GiroVision',
      updatedAt: new Date(),
    });

    const eventUpdated = await this.prisma.event.update({
      data: {
        changeLog: JSON.stringify(changeLog),
        eventState: {
          connect: {
            id: eventState.id,
          },
        },
      },
      where: {
        id,
      },
      include: {
        user: true,
        eventState: true,
        eventType: true,
        customer: true,
      },
    });

    await this.alertOnEventUpdates(eventUpdated, userId);

    if (eventUpdated.eventType) {
      // notify to firebase has been updated
      this.firebaseService.updateEventFirebase({
        id: eventUpdated.id,
        customerId,
        eventType: eventUpdated.eventType,
        createdAt: eventUpdated.createdAt,
        eventStateId: eventState.id,
        updatedAt: eventUpdated.updatedAt,
        user: {
          id: 'girovision',
          fullName: 'transactor girovision',
        },
      });
    }

    return {
      name: 'Ok',
      statusCode: 200,
      message: 'Evento actualizado',
    };
  }

  async getIcmType(customerId: string) {
    const customer = await this.prisma.customer.findUnique({
      where: {
        id: customerId,
      },
      include: {
        integrations: true,
      },
    });

    if (!customer) {
      throw new InternalServerErrorException(errorCodes.CUSTOMER_NOT_FOUND);
    }

    if (!customer.integrations) {
      throw new InternalServerErrorException(
        errorCodes.CUSTOMER_RELATIONS_NOT_EXIST,
      );
    }

    if (customer.integrations.icmToken && customer.integrations.icmUrl) {
      return await this.externalService.getDeliveryTypes(
        customer.integrations.icmUrl,
        customer.integrations.icmToken,
      );
    }

    throw new UnprocessableEntityException(errorCodes.CUSTOMER_NOT_SET_UP);
  }

  async getStatistics(
    customerId: string,
    params: Pick<ListQueryArgsDto, 'where'>,
  ) {
    const { prisma } = this;
    const where = params.where || {};
    const eventTypeIds: string[] = []; // Para guardar los ids de tipos que suman a estadísiticas
    let totalCount = 0; // Incializo en 0 el número total de eventos

    const customerIds: { customerId: string }[] = await validateCustomers(
      this.prisma,
      customerId,
      params.where,
    );

    const eventTypes = await prisma.eventType.findMany({
      where: {
        OR: customerIds,
        addToStatistics: true,
      },
    });

    if (eventTypes.length > 0) {
      eventTypes.forEach((etype) => {
        eventTypeIds.push(etype.id);
      });
    }

    // Totales por estado de eventos
    const totalByState = new Promise(async (resolve, reject) => {
      try {
        if (!eventTypeIds.length) {
          return resolve([]);
        }

        const eventStates = await prisma.eventState.findMany({
          where: {
            OR: [{ customerId: null }, ...customerIds],
          },
          orderBy: {
            name: 'asc',
          },
        });

        const group = await prisma.event.groupBy({
          by: ['eventStateId'],
          where: {
            ...where,
            eventTypeId: { in: eventTypeIds },
          },
          orderBy: {
            eventStateId: 'asc',
          },
          _count: {
            _all: true,
          },
        });
        let total = 0;

        const percentageByState = group.map(({ eventStateId, _count }) => {
          total += _count._all;
          return {
            name: '',
            state: eventStateId,
            count: _count._all,
            percentage: 0,
          };
        });

        percentageByState.forEach((stat) => {
          if (total > 0)
            stat.percentage =
              Math.round(((stat.count * 100) / total) * 100) / 100;

          const stateName = eventStates.find((state) => {
            return stat.state === state.id;
          });

          if (stateName) {
            stat.name = stateName.name;
          }
        });

        totalCount += total;

        resolve(percentageByState);
      } catch (err) {
        reject(err);
      }
    });

    // Totales de tipos de eventos
    const totalByType = new Promise(async (resolve, reject) => {
      try {
        if (!eventTypeIds.length) {
          return resolve([]);
        }

        const group = await prisma.event.groupBy({
          by: ['eventTypeId'],
          where: {
            ...where,
            eventTypeId: { in: eventTypeIds },
          },
          orderBy: {
            eventTypeId: 'asc',
          },
          _count: {
            _all: true,
          },
        });
        let total = 0;

        const percentageByType = group.map(({ eventTypeId, _count }) => {
          total += _count._all;
          return {
            title: '',
            type: eventTypeId,
            count: _count._all,
            percentage: 0,
          };
        });

        percentageByType.forEach((stat) => {
          if (total > 0)
            stat.percentage =
              Math.round(((stat.count * 100) / total) * 100) / 100;
          const typeName = eventTypes.find((type) => {
            return stat.type === type.id;
          });
          if (typeName) {
            stat.title = typeName.title;
          }
        });
        totalCount += total;

        resolve(percentageByType);
      } catch (err) {
        reject(err);
      }
    });

    const values = await Promise.all([totalByState, totalByType]);

    return {
      totalByState: values[0],
      totalByType: values[1],
      totalEvents: totalCount / 2, // Se divide por dos porque hay dos grupos (totalByState y totalByType)
    };
  }
}
