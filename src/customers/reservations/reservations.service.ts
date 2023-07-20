import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AuthorizedUserReservationType,
  CustomerHolidays,
  Event,
  Prisma,
  PrismaPromise,
  ReservationGuests,
  ReservationLock,
  ReservationSpace,
  ReservationType,
  User,
} from '@prisma/client';
import { Service } from '@src/common/classes/service.class';
import { PrismaService } from '@src/database/prisma.service';
import { IEntityService, IPaginationArgs } from '@src/interfaces/types';
import { PushNotificationService } from '@src/push-notification/push-notification.service';
import { ChangeLog } from '../events/entities/change-log.entity';
import { startOfYear } from 'date-fns';
import * as dayjs from 'dayjs';
import * as utc from 'dayjs/plugin/utc';
import { assign, find, forEach, isNil, remove, set, toNumber } from 'lodash';
import { ChangeStateReservationDto } from './dto/change-state-reservation.dto';
import { ConfirmReservationDto } from './dto/confirm-reservation.dto';
import { LastYearReservationDto } from './dto/last-year-reservation.dto';
import { ReservationDto } from './dto/reservation.dto';
import {
  CANCELLED,
  EMITTED,
  errorCodes,
  listDays,
} from './reservations.constants';
import {
  AuthorizedExtended,
  Participant,
  ReservationExtended,
  SetData,
  SetParticipants,
  SetUserId,
  ValidateDate,
  ValidateLock,
  ValidateMode,
  ValidatePendingReservations,
} from './types';
import { ConfigurationService } from '@src/configuration/configuration.service';
import { Parser } from '@json2csv/plainjs';
import { GetQueryReservationDetailDto } from './dto/get-query-reservation-detail.dto';
import { validateCustomers } from '@src/utils';
import { ListQueryArgsDto } from '@src/common/dto/list-query-args.dto';
import { Reservation } from '@prisma/client';
dayjs.extend(utc);

@Injectable()
export class ReservationService extends Service implements IEntityService {
  static defaultUTCOffset = -180;

  constructor(
    readonly prisma: PrismaService,
    readonly configuration: ConfigurationService,
    readonly pushNotificationService: PushNotificationService,
    private readonly configService: ConfigService,
  ) {
    super(prisma);
  }

  private async findReservationType(id: string) {
    const reservationType = await this.prisma.reservationType.findUnique({
      where: {
        id,
      },
    });

    if (!reservationType) {
      throw new UnprocessableEntityException(
        errorCodes.RESERVATION_TYPE_NOT_FOUND,
      );
    }

    return reservationType;
  }

  private async findReservationMode(id: string) {
    const reservationMode = await this.prisma.reservationMode.findUnique({
      where: {
        id,
      },
    });

    if (!reservationMode) {
      throw new UnprocessableEntityException(
        errorCodes.RESERVATION_MODE_NOT_FOUND,
      );
    }

    return reservationMode;
  }

  private async findReservationSpace(id: string) {
    const reservationSpace = await this.prisma.reservationSpace.findUnique({
      where: {
        id,
      },
    });

    if (!reservationSpace) {
      throw new UnprocessableEntityException(
        errorCodes.RESERVATION_SPACE_NOT_FOUND,
      );
    }

    return reservationSpace;
  }

  private async findUser(id: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id,
      },
      include: { authorizedUser: true },
    });

    if (!user) {
      throw new NotFoundException(errorCodes.USER_NOT_FOUND);
    }

    return user;
  }

  private async findAuthorizedUser(id: string) {
    const authorizedUser = await this.prisma.authorizedUser.findUnique({
      where: {
        id,
      },
      include: {
        userAuthorizedUser: true,
      },
    });

    if (!authorizedUser) {
      throw new UnprocessableEntityException(
        errorCodes.AUTHORIZED_USER_NOT_FOUND,
      );
    }

    return authorizedUser;
  }

  private async findCustomer(id?: string) {
    const customer = await this.prisma.customer.findUnique({
      where: {
        id,
      },
      include: {
        settings: true,
      },
    });

    if (!customer) {
      throw new UnprocessableEntityException(errorCodes.CUSTOMER_NOT_FOUND);
    }

    return customer;
  }

  private async findParticipant(type: string, OR: Record<string, any>[]) {
    const valid = await this.prisma[type].count({
      where: {
        OR,
      },
    });
    if (valid !== OR.length) {
      throw new UnprocessableEntityException(errorCodes.INVALID_PARTICIPANT);
    }
  }

  private async setParticipants({
    participants,
    user,
    authorizedUser,
  }: SetParticipants) {
    if (participants?.length) {
      const userIds = participants
        .filter((i) => i.userId)
        .map((i) => ({ id: i.userId }));

      const authorizedUserIds = participants
        .filter((i) => i.authorizedUserId)
        .map((i) => ({ id: i.authorizedUserId }));

      if (authorizedUserIds.length) {
        await this.findParticipant('authorizedUser', authorizedUserIds);
      }

      if (userIds.length) {
        await this.findParticipant('user', userIds);
      }

      return participants;
    } else if (user) {
      return [
        {
          fullName: user.fullName,
          userId: user.id,
          authorizedUserId: authorizedUser?.id,
        },
      ];
    } else if (authorizedUser) {
      return [
        {
          fullName: `${authorizedUser?.firstName} ${authorizedUser?.lastName}`,
          userId: null,
          authorizedUserId: authorizedUser.id,
        },
      ];
    } else {
      return null;
    }
  }

  private getValue(value: number) {
    if (value < 10) {
      return '0' + value;
    }
    return '' + value;
  }

  private getWeekDay(date: dayjs.Dayjs) {
    const day = date.day();
    return listDays[day];
  }

  private shouldIgnore(lock: ReservationLock, isHoliday?: CustomerHolidays) {
    return isHoliday && lock.ignoreIfHoliday;
  }

  private setUserId({ user, authorizedUser, noUser, customerId }: SetUserId) {
    const reservation: any = {};

    if (noUser) {
      set(reservation, 'customer.connect.id', customerId);
    } else if (authorizedUser) {
      // La reserva la genero el estadista, obtengo los datos del usuario

      reservation.lot = authorizedUser.lot;

      const userFound = find(authorizedUser.userAuthorizedUser, {
        customerId: authorizedUser.customerId,
      });

      if (userFound && !userFound.active) {
        throw new ForbiddenException({
          message: errorCodes.NOT_ACTIVE_USER,
        });
      }

      if (userFound) {
        set(reservation, 'user.connect.id', userFound?.id);
      }
      set(reservation, 'authorizedUser.connect.id', authorizedUser.id);
    } else {
      // La reserva la genero el usuario, obtengo sus datos
      if (!user.active) {
        throw new ForbiddenException({
          message: errorCodes.NOT_ACTIVE_USER,
        });
      }

      set(reservation, 'user.connect.id', user.id);
      set(reservation, 'customer.connect.id', user.customerId);
      reservation.lot = user.lot;

      if (user.authorizedUserId) {
        set(reservation, 'authorizedUser.connect.id', user.authorizedUserId);
      }
    }

    return reservation;
  }

  private async setStateId(reservationType: ReservationType) {
    const eventState = await this.prisma.eventState.findFirst({
      where: {
        customerId: null,
        name: reservationType?.requireConfirmation ? 'A confirmar' : 'Emitido',
      },
    });

    if (!eventState) {
      throw new InternalServerErrorException(errorCodes.EVENT_STATE_NOT_FOUND);
    }

    if (reservationType?.requireConfirmation) {
      return {
        eventState: {
          connect: {
            id: eventState.id,
          },
        },
      };
    } else {
      return {
        eventState: {
          connect: {
            id: eventState.id,
          },
        },
      };
    }
  }

  private async setData({
    participants,
    reservationMode,
    dateFrom,
    dateTo,
  }: SetData) {
    let fromDate;
    let toDate; // fecha desde + tiempo de inactividad de la modalidad
    if (dayjs(dateFrom).isBefore(dateTo)) {
      fromDate = dateFrom;
      toDate = dateTo;
    } else {
      fromDate = dateTo;
      toDate = dateFrom;
    }

    const inactiveToDate = new Date(fromDate);
    inactiveToDate.setMinutes(
      inactiveToDate.getMinutes() + (reservationMode?.inactivityTime || 0),
    );

    return {
      numberOfGuests: participants?.length || 0,
      fromDate: fromDate,
      toDate: toDate,
      inactiveToDate: inactiveToDate,
    };
  }

  private async validateLock(data: ValidateLock) {
    const { customer, reservationSpace } = data;
    const { prisma, getValue, getWeekDay, shouldIgnore } = this;

    const utcOffset = customer.timezone ? toNumber(customer.timezone) : -180;

    const fromDate = dayjs.utc(data.fromDate).utcOffset(utcOffset);
    const toDate = dayjs.utc(data.toDate).utcOffset(utcOffset);

    const today = fromDate.startOf('day');
    const tomorrow = today.add(1, 'day');

    const holidays = await prisma.customerHolidays.findMany({
      where: {
        AND: [
          { customerId: customer.id },
          { active: true },
          {
            OR: [{ date: today.toDate() }, { date: tomorrow.toDate() }],
          },
        ],
      },
    });

    const isHoliday = find(holidays, function (value) {
      return new Date(value.date).getTime() === today.toDate().getTime();
    });

    const isHolidayEve = find(holidays, function (value) {
      return new Date(value.date).getTime() === tomorrow.toDate().getTime();
    });

    const reservationLocks = await prisma.reservationLock.findMany({
      where: {
        AND: [
          { active: true },
          { reservationSpaceId: reservationSpace.id },
          {
            OR: [{ date: today.toDate() }, { date: null }],
          },
        ],
      },
    });

    const toCompare = {
      from: getValue(fromDate.hour()) + ':' + getValue(fromDate.minute()),
      to: getValue(toDate.hour()) + ':' + getValue(toDate.minute()),
    };

    const weekDay = getWeekDay(fromDate);

    let holidayWeekDay;

    if (isHoliday) {
      holidayWeekDay = 'holiday';
    } else if (isHolidayEve) {
      holidayWeekDay = 'holidayEve';
    }

    let hasLock = false;

    reservationLocks.forEach((lock) => {
      if (lock[weekDay] && !this.shouldIgnore(lock, isHoliday)) {
        forEach(lock[weekDay], function (schedule) {
          if (
            schedule.from === toCompare.from &&
            schedule.to === toCompare.to
          ) {
            hasLock = true;
          }
        });
      }
      if (
        holidayWeekDay &&
        lock[holidayWeekDay] &&
        !shouldIgnore(lock, isHoliday)
      ) {
        forEach(lock[holidayWeekDay], function (schedule) {
          if (
            schedule.from === toCompare.from &&
            schedule.to === toCompare.to
          ) {
            hasLock = true;
          }
        });
      }
    });

    if (hasLock) {
      throw new BadRequestException({
        message: errorCodes.INVALID_RESERVATION_TIME,
      });
    }
  }

  // Si existe otra reserva a la misma hora en el mismo espacio, entonces no puede reservar
  private async validateTime({
    customerId,
    reservationSpaceId,
    reservationModeId,
    numberOfGuests,
    fromDate,
  }) {
    const reservations = await this.prisma.reservation.findMany({
      where: {
        customerId: customerId,
        reservationSpaceId: reservationSpaceId,
        fromDate: fromDate,
        cancelDate: null,
      },
      include: {
        reservationMode: true,
      },
    });
    if (reservations.length > 0) {
      /*
					Valido  la modalidad de las reservas del espacio, puedo usar la primera porque no puede haber dos reservas
					de distinta modalidad en el mismo espacio a la misma hora
					- Si la modalidad es distinta > devuelve error (no puede haber dos reservas de distinta modalidad en el
					mismo espacio a la misma hora)
					- Si la modalidad es la misma entonces se fija si requiere todos los participantes (allParticipantsRequired)
							- Si requiere todos los participantes > devuelve error (no puede haber dos reservas en el mismo espacio
							cuando todos los participantes son requeridos)
							- Si no requiere todos los participantes > se fija si hay lugar disponible para los participantes
							de la reserva que se intenta crear
				*/
      const reservation = reservations[0];
      const { reservationMode } = reservation;
      if (
        reservation.reservationModeId === reservationModeId &&
        !reservationMode.allParticipantsRequired
      ) {
        let participants = 0;
        forEach(reservations, (r) => {
          if (r.reservationModeId === reservationModeId) {
            participants = participants + (reservation?.numberOfGuests || 0);
          }
        });
        if (participants + numberOfGuests <= (reservationMode.maxPeople || 0)) {
          return;
        }
      }
      throw new BadRequestException({
        message: errorCodes.INVALID_RESERVATION_TIME,
      });
    }
    return;
  }

  private async findAuthorizedUsers(
    participantsUserIds: string[],
    participantsAuthorizedIds: string[],
  ) {
    if (!participantsUserIds) {
      return [];
    }
    const appUsers = await this.prisma.user.findMany({
      where: {
        OR: participantsAuthorizedIds.map((i: string) => ({ id: i })),
      },
      include: {
        customer: true,
      },
    });
    if (!appUsers.length) {
      return [];
    }
    const customer = appUsers[0].customer;
    if (!customer) {
      throw new InternalServerErrorException();
    }
    const countryCode = customer?.countryCode || '';

    const usernames: string[] = [];
    forEach(appUsers, function (appUser) {
      usernames.push(appUser.username.substring(countryCode.length));
    });

    const authorizedUsers = await this.prisma.authorizedUser.findMany({
      where: {
        customerId: customer.id,
        OR: usernames.map((i) => ({ username: i })),
      },
      select: {
        id: true,
      },
    });
    if (!authorizedUsers.length) {
      return [];
    }

    const ids: string[] = [];
    forEach(authorizedUsers, function (authorizedUser) {
      ids.push(authorizedUser.id);
    });

    return ids;
  }

  private async findUsers(participantsAuthorizedIds: string[]) {
    if (!participantsAuthorizedIds) {
      return [];
    }
    const authorizedUsers = await this.prisma.authorizedUser.findMany({
      where: {
        OR: participantsAuthorizedIds.map((i) => ({ id: i })),
      },
      include: {
        customer: true,
      },
    });

    if (!authorizedUsers.length) {
      return [];
    }
    const customer = authorizedUsers[0].customer;
    const countryCode = customer.countryCode;

    const usernames: string[] = [];

    forEach(authorizedUsers, function (authorizedUser) {
      usernames.push(`${countryCode}${authorizedUser.username}`);
    });

    const appUsers = await this.prisma.user.findMany({
      where: {
        customerId: customer.id,
        OR: usernames.map((i) => ({ username: i })),
      },
      select: {
        id: true,
      },
    });

    if (!appUsers.length) {
      return [];
    }

    const ids: string[] = [];

    forEach(appUsers, function (appUser) {
      ids.push(appUser.id);
    });

    return ids;
  }

  private async findMaxAnticipation(customerId: string) {
    const reservationTypes = await this.prisma.reservationType.findMany({
      where: {
        customerId: customerId,
      },
    });

    let max = 0;

    forEach(reservationTypes, function (rType) {
      if (rType?.days && rType?.days > max) {
        max = rType.days || 0;
      }
    });

    return max;
  }
  // Si el usuario esta como owner de otra reserva a la misma hora, entonces no puede reservar
  // Si el usuario esta como invitado de otra reserva a la misma hora, entonces no puede reservar
  // Si alguno de los invitados esta como owner de otra reserva a la misma hora, entonces no puede reservar
  // Si alguno de los invitados esta como invitado de otra reserva a la misma hora, entonces no puede reservar
  private async validateDate({
    userId, // Puede ser null si la reserva la hace un estadista
    authorizedUserId, // Si el usuario no esta registrado uso este
    customerId,
    participants,
    fromDate,
    toDate,
    reservationType,
  }: ValidateDate) {
    // Si el tipo de reserva permite reservar en simultaneo,
    // entonces no valido si tiene otra reserva a la misma hora
    if (reservationType.allowsSimultaneous) {
      return;
    }

    // Obtengo el ID de usuario del creador y de los Invitados
    // Obtengo el ID de autorizado del creador y de los Invitados
    // Necesito tener los dos IDs de todos (si existen) para poder filtrar
    const participantsAuthorizedIds: string[] = [];
    const participantsUserIds: string[] = [];

    if (userId) {
      // Agrego el ID del usuario a la lista para buscar las reservas todas juntas
      participantsUserIds.push(userId);
    }

    if (authorizedUserId) {
      // Agrego el ID del autorizado a la lista para buscar las reservas todas juntas
      participantsAuthorizedIds.push(authorizedUserId);
    }

    forEach(participants, function (p) {
      if (p.userId) {
        participantsUserIds.push(p.userId);
      } else if (p.authorizedUserId) {
        participantsAuthorizedIds.push(p.authorizedUserId);
      }
    });

    // Busco el ID de autorizado de todos los usuarios participantes (owner + invitados)
    const authorizedUsers = await this.findAuthorizedUsers(
      participantsUserIds,
      participantsAuthorizedIds,
    );
    // Busco el ID de usuario de todos los autorizados participantes (owner + invitados)
    const users = await this.findUsers(participantsAuthorizedIds);

    // Obtengo el máximo tiempo de anticipación en todos los tipos de reservas del cliente
    // para buscar reservas a partir de esa fecha
    const maxAnticipation = await this.findMaxAnticipation(customerId);

    const createdAt = dayjs().subtract(maxAnticipation, 'days').toDate();

    let OR: Prisma.ReservationGuestsWhereInput['OR'] = authorizedUsers.map(
      (i) => ({
        authorizedUserId: i,
      }),
    );

    OR = OR.concat(
      users.map((i: string) => ({
        userId: i,
      })),
    );

    OR = OR.concat(
      participantsAuthorizedIds.map((i: string) => ({
        authorizedUserId: i,
      })),
    );
    OR = OR.concat(participantsUserIds.map((i: string) => ({ userId: i })));

    // Obtengo todos los IDs de las reservas en las que participan el socio y los invitados
    // a traves de la tabla ReservationGuest
    const guests = await this.prisma.reservationGuests.findMany({
      where: {
        OR,
        AND: [{ createdAt: { gte: new Date(createdAt) } }],
      },
    });
    const ids: string[] = [];
    forEach(guests, function (g) {
      ids.push(g.reservationId);
    });

    // Obtengo todas las reservas pertenecientes a esos IDs para comenzar a validar las fechas
    const reservations = await this.prisma.reservation.findMany({
      where: {
        OR: ids.map((i) => ({
          id: i,
        })),
        cancelDate: null,
      },
      include: {
        reservationType: true,
      },
      orderBy: {
        toDate: 'desc',
      },
    });
    // No tiene reservas activas
    if (!reservations.length) {
      return;
    }

    let isValid = true;

    // Si la fecha de la reserva actual esta entre la fecha desde y hasta
    // de otra reserva activa, entonces no puede reservar
    let count = 0;
    const fromDateMoment = dayjs(fromDate).millisecond(0);
    const toDateMoment = dayjs(toDate).millisecond(0);
    forEach(reservations, function (r) {
      const allowsSimultaneous = r.reservationType.allowsSimultaneous;
      if (!allowsSimultaneous) {
        const rFromDateMoment = dayjs(r.fromDate).millisecond(0);
        const rToDateMoment = dayjs(r.toDate).millisecond(0);
        if (
          (fromDateMoment.isBefore(rFromDateMoment) &&
            toDateMoment.isAfter(rFromDateMoment)) ||
          (fromDateMoment.isBefore(rToDateMoment) &&
            toDateMoment.isAfter(rToDateMoment)) ||
          (fromDateMoment.isAfter(rFromDateMoment) &&
            toDateMoment.isBefore(rToDateMoment)) ||
          (fromDateMoment.isSame(rFromDateMoment) &&
            toDateMoment.isSame(rToDateMoment)) ||
          (fromDateMoment.isBefore(rFromDateMoment) &&
            toDateMoment.isAfter(rToDateMoment))
        ) {
          count++;
        }
      }
    });
    isValid = isValid && count === 0;

    if (isValid) {
      return;
    }
    throw new BadRequestException(errorCodes.INVALID_RESERVATION_DATE);
  }

  // Si la cantidad de reservas pendientes supera el máximo permitido entonces no puede reservar
  private async validatePendingReservations({
    userId,
    customerId,
    // Obtengo los datos del usuario autorizado para obtener los lotes adicionales
    authorizedUser,
    reservationType,
    lot,
  }: ValidatePendingReservations) {
    /**
     * Si las reservas pendientes se validan por lote, entonces tengo que obtener las reservas pendientes
     * del lote principal del usuario y los lotes adicionales del usuario para calcular la cantidad
     * de reservas pendientes permitidas
     *
     * Si las reservas pendientes se validan por usuario, entonces tengo que obtener las reservas pendientes
     * del usuario
     */
    if (reservationType.pendingPerLot) {
      // Obtengo la cantidad de reservas pendientes del lote
      const pendingCount = await this.prisma.reservation.count({
        where: {
          lot: lot,
          customerId: customerId,
          reservationTypeId: reservationType.id,
          cancelDate: null,
          toDate: { gte: new Date() },
        },
      });

      let additionalLots = [];
      try {
        additionalLots = authorizedUser.additionalLots
          ? JSON.parse(authorizedUser.additionalLots)
          : [];
      } catch (error) {
        // do nothing
      }
      const count = pendingCount;

      const numberOfPending =
        ((reservationType.numberOfPending || 0) + 1) *
        (additionalLots.length + 1);

      if (count === 0 || count < numberOfPending) {
        return;
      }

      throw new BadRequestException({
        message: errorCodes.INVALID_RESERVATION_DATE,
      });
    } else {
      // Obtengo la cantidad de reservas pendientes del usuario
      const reservations = await this.prisma.reservation.findMany({
        where: {
          AND: [
            {
              OR: [{ userId: userId }, { authorizedUserId: authorizedUser.id }],
            },
            { reservationTypeId: reservationType.id },
            { cancelDate: null },
            { toDate: { gte: new Date() } },
          ],
        },
      });
      const count = reservations.length;

      if (count === 0 || count <= (reservationType.numberOfPending || 0)) {
        return;
      }

      throw new BadRequestException({
        message: 'INVALID_RESERVATION_DATE',
      });
    }
  }

  // Si se alcanzo el nro maximo de reservas de la modalidad en el mes entonces no puede reservar
  private async validateMode({
    from,
    customerId,
    reservationMode,
  }: ValidateMode) {
    if (!reservationMode.maxPerMonth) {
      return;
    }

    const fromDate = dayjs(from).startOf('month').toDate();
    const toDate = dayjs(from).endOf('month').toDate();

    const count = await this.prisma.reservation.count({
      where: {
        AND: [
          { customerId: customerId },
          { reservationModeId: reservationMode.id },
          { fromDate: { gte: new Date(fromDate) } },
          { fromDate: { lte: new Date(toDate) } },
          { cancelDate: null },
        ],
      },
    });
    if (reservationMode.maxPerMonth && count < reservationMode.maxPerMonth) {
      return;
    }
    throw new BadRequestException({
      message: errorCodes.ERR_RESERVATION_MODE,
    });
  }

  private async createEvent(
    reservation: ReservationExtended,
    participants: Participant[] | null,
    space: ReservationSpace,
  ) {
    if (!space.eventTypeId) {
      return;
    }

    const eventTypeId = space.eventTypeId;
    const spaceCode = space.code;

    if (!reservation.userId) {
      return;
    }

    const user = await this.prisma.user.findUnique({
      where: {
        id: reservation.userId,
      },
    });
    if (!user) {
      return;
    }

    let description = 'Espacio: ' + spaceCode + '\n\nInvitados:\n';
    forEach(participants, function (p: any) {
      description = description + p.fullName + '\n';
    });

    return this.prisma.event.create({
      data: {
        fullName: user.fullName,
        trialPeriod: reservation.trialPeriod,
        eventType: {
          connect: {
            id: eventTypeId,
          },
        },
        eventState: {
          connect: {
            id: reservation.eventStateId,
          },
        },
        user: {
          connect: {
            id: user.id,
          },
        },
        customer: {
          connect: {
            id: user.customerId || '',
          },
        },
        lot: user.lot,
        from: reservation.fromDate,
        to: reservation.toDate,
        description: description,
        reservation: {
          connect: {
            id: reservation.id,
          },
        },
        file: reservation.file
          ? (reservation.file as unknown as Prisma.InputJsonObject)
          : undefined,
        changeLog: '',
      },
    });
  }

  private sendNotifications(
    reservation: ReservationExtended,
    userLoggedId: string,
  ) {
    const { prisma, pushNotificationService } = this;
    const players: string[] = [];
    let guests: ReservationGuests[] = [];
    let members: {
      id: string;
      fullName: string;
      pushId: string | null;
    }[] = [];
    const userIds = reservation.userId ? [reservation.userId] : [];
    let headings = '';
    let contents = '';
    let utcOffset;

    prisma.reservationGuests
      .findMany({
        where: { reservationId: reservation.id },
      })
      .then(function (reservationGuests) {
        guests = reservationGuests;

        forEach(reservationGuests, function (u) {
          if (u.userId && u.userId !== reservation.userId) {
            userIds.push(u.userId);
          }
        });
        return prisma.user.findMany({
          where: {
            OR: userIds.map((i) => ({ id: i })),
          },
          select: {
            id: true,
            fullName: true,
            /// verfiy that users are active
            active: true,
            pushId: true,
          },
        });
      })
      .then(function (users) {
        members = users;

        forEach(users, (user) => {
          if (user.pushId) {
            players.push(user.pushId);
          }
        });
        return reservation;
      })
      .then(function (reservation) {
        headings =
          'Reserva: ' +
          reservation.reservationType?.code +
          ' - ' +
          reservation.reservationSpace?.code +
          ' - ' +
          reservation.reservationMode?.name;

        const requireConfirmation =
          reservation.reservationType?.requireConfirmation;

        let membersList = '';
        forEach(members, function (m) {
          membersList = membersList + m.fullName + ', ';
        });

        let guestsList = '';
        forEach(guests, function (g) {
          if (!g.userId && !g.authorizedUserId) {
            guestsList = guestsList + g.fullName + ', ';
          }
        });

        const customer = reservation.customer;
        utcOffset = customer?.timezone ? toNumber(customer.timezone) : -180;
        contents =
          'Fecha: ' +
          dayjs
            .utc(reservation.fromDate)
            .utcOffset(utcOffset)
            .format('DD/MM/YYYY')
            .toString() +
          ' - Turno: ' +
          dayjs
            .utc(reservation.fromDate)
            .utcOffset(utcOffset)
            .format('HH:mm')
            .toString() +
          'hs\n' +
          'Socios: ' +
          membersList +
          '\n' +
          (guestsList.length ? 'Invitados: ' + guestsList + '\n' : '') +
          'Su reserva se encuentra: ' +
          (requireConfirmation
            ? 'A confirmar por la Intendencia'
            : 'CONFIRMADA') +
          '\n' +
          'Recuerde que usted está aceptando el reglamento actual para el uso de las instalaciones.';

        if (reservation.reservationType?.termsAndConditions) {
          contents =
            contents +
            '\n\n' +
            'Reserva realizada según Términos y Condiciones que se encuentra en el Menú de Información.';
        }

        return prisma.notification.create({
          data: {
            title: headings,
            description: contents,
            customerId: reservation.customerId,
            userId: userLoggedId,
            toUsers: {
              createMany: {
                data: userIds.map((i) => ({
                  userId: i,
                })),
              },
            },
            notificationType: 'reservation',
          },
        });
      })
      .then(function () {
        if (players.length) {
          pushNotificationService.pushNotification(
            {
              title: headings,
              description: contents,
              channelId: 'event-notifications',
              data: {
                reservationId: reservation.id,
              },
            },
            players,
          );
        }
      })
      .catch(function (err) {
        throw new InternalServerErrorException(err);
      });
  }

  private async sendPushNotification(
    userIds: Prisma.UserWhereInput[],
    notification: {
      title: string;
      trialPeriod: boolean;
      description: string;
      customerId: string;
      userId: string;
      data: object;
    },
  ) {
    const players: string[] = [];

    const users = await this.prisma.user.findMany({
      where: {
        OR: userIds,
        /// verfiy that users are active
        active: true,
        NOT: { pushId: null },
      },
      select: {
        id: true,
        pushId: true,
      },
    });

    if (!users.length) {
      console.log('Users not found');
      return;
    }

    forEach(users, (user) => {
      if (user.pushId) {
        players.push(user.pushId);
      }
    });

    await this.prisma.notification.create({
      data: {
        title: notification.title,
        description: notification.description,
        toUsers: {
          createMany: {
            data: users.map(({ id }) => ({
              userId: id,
            })),
          },
        },
        notificationType: 'reservation',
        customer: {
          connect: {
            id: notification.customerId,
          },
        },
        user: {
          connect: {
            id: notification.userId,
          },
        },
      },
    });

    if (players.length) {
      this.pushNotificationService.pushNotification(
        {
          title: notification.title,
          description: notification.description,
          data: notification.data,
          channelId: 'event-notifications',
        },
        players,
      );
    }
  }

  private async sendEmail(reservation: ReservationExtended) {
    const emails: string[] = [];

    const reservationMode = reservation.reservationMode;

    if (!reservation.userId) {
      return null;
    }

    const user = await this.prisma.user.findUnique({
      where: {
        id: reservation.userId,
      },
      include: {
        customer: {
          include: {
            settings: true,
          },
        },
      },
    });

    const customer = user?.customer;

    if (reservationMode && reservationMode.email) {
      emails.push(reservationMode.email);
    }
    if (customer?.settings?.reservationEmail) {
      emails.push(customer?.settings?.reservationEmail);
    }
    const email = emails.join(',');

    const utcOffset = customer?.timezone ? toNumber(customer.timezone) : -180;

    if (!reservation || !email) {
      return;
    }

    const guests = await this.prisma.reservationGuests.findMany({
      where: { reservationId: reservation.id },
      include: {
        user: {
          include: {
            authorizedUser: {
              include: {
                reservationTypes: true,
              },
            },
          },
        },
        authorizedUser: {
          include: {
            reservationTypes: true,
          },
        },
      },
    });

    if (!reservation || !email) {
      return;
    }

    const reservationType = reservation.reservationType.code;

    let participants = '';
    forEach(guests, function (g) {
      let reservationTypes: AuthorizedUserReservationType[] | null | undefined =
        null;

      if (g.userId) {
        reservationTypes = g.user?.authorizedUser?.reservationTypes;
      } else if (g.authorizedUserId) {
        reservationTypes = g.authorizedUser?.reservationTypes;
      }
      if (
        (!g.userId && !g.authorizedUserId) ||
        !reservationTypes ||
        (reservationTypes &&
          reservationTypes.find((i) => i.id === reservation.reservationTypeId))
      ) {
        let lot: string | null = null;
        if (g.user) {
          lot = g.user.lot;
        } else if (g.authorizedUser) {
          lot = g.authorizedUser.lot;
        }
        participants =
          participants +
          g.fullName +
          (lot ? ' (Lote: ' + lot + ')' : '') +
          ',\n';
      }
    });

    const reservationDate = dayjs
      .utc(reservation.fromDate)
      .utcOffset(utcOffset)
      .format('DD/MM/YYYY HH:mm')
      .toString();

    //PREGUNTAR SI ES POSIBLE QUE NO VENGA CON USUARIO RESERVATION.USERID
    const member =
      user?.firstName +
      ' ' +
      user?.lastName +
      (user?.lot ? ' (Lote: ' + user?.lot + ')' : '');

    return this.configuration.subscriptionMailReservation({
      email,
      reservationModeName: reservationMode.name,
      member,
      reservationDate,
      reservationTypeCode: reservationType,
    });
  }

  private async saveParticipants(
    participants: Participant[],
    reservationId: string,
  ) {
    if (!participants.length) {
      return;
    }

    await this.prisma.reservationGuests.createMany({
      data: participants.map((i) => ({
        reservationId,
        fullName: i.fullName,
        userId: i.userId,
        authorizedUserId: i.authorizedUserId,
      })),
    });
  }

  async create(
    data: ReservationDto & {
      customerId: string;
      userLoggedId: string;
    },
  ) {
    const { customerId, userId, userLoggedId, fromDate, toDate, ...rest } =
      data;
    let reservation: Prisma.ReservationCreateInput = {
      trialPeriod: false,
      fromDate: '',
      toDate: '',
      noUser: rest.noUser,
      file: rest.file
        ? (rest.file as unknown as Prisma.InputJsonObject)
        : undefined,
      createdBy: {
        connect: {
          id: userLoggedId,
        },
      },
      customer: {
        connect: {
          id: customerId,
        },
      },
      reservationType: {
        connect: {
          id: rest.reservationTypeId,
        },
      },
      reservationMode: {
        connect: {
          id: rest.reservationModeId,
        },
      },
      reservationSpace: {
        connect: {
          id: rest.reservationSpaceId,
        },
      },
      eventState: {
        connect: undefined,
      },
    };

    let user: User | null = null;
    let authorizedUser: AuthorizedExtended | null = null;

    const reservationType = await this.findReservationType(
      rest.reservationTypeId,
    );

    const reservationMode = await this.findReservationMode(
      rest.reservationModeId,
    );

    const reservationSpace = await this.findReservationSpace(
      rest.reservationSpaceId,
    );

    const userLogged = await this.findUser(userLoggedId);

    if (userId) {
      user = await this.findUser(userId);
    }

    if (rest.authorizedUserId) {
      authorizedUser = await this.findAuthorizedUser(rest.authorizedUserId);
    } else if (user && user.authorizedUserId) {
      authorizedUser = await this.findAuthorizedUser(user.authorizedUserId);
    }

    const participants: Participant[] | null = await this.setParticipants({
      participants: rest.participants,
      user,
      authorizedUser,
    });

    const userInfo = this.setUserId({
      user: userLogged,
      customerId,
      noUser: rest.noUser,
      authorizedUser,
    });

    reservation = assign(reservation, userInfo);

    const state = await this.setStateId(reservationType);

    reservation = assign(reservation, state);

    const dateValues = await this.setData({
      dateFrom: fromDate,
      dateTo: toDate,
      participants,
      reservationMode,
    });

    reservation = assign(reservation, dateValues);

    const customer = await this.findCustomer(reservation.customer.connect?.id);

    if (customer?.trialPeriod) {
      reservation.trialPeriod = customer.trialPeriod;
    }

    await this.validateLock({
      reservationSpace,
      customer,
      fromDate: reservation.fromDate,
      toDate: reservation.toDate,
    });

    await this.validateTime({
      customerId: customer.id,
      reservationSpaceId: reservationSpace.id,
      reservationModeId: reservationMode.id,
      numberOfGuests: reservation.numberOfGuests,
      fromDate: reservation.fromDate,
    });

    await this.validateDate({
      userId: reservation.user?.connect?.id,
      authorizedUserId: reservation.authorizedUser?.connect?.id,
      customerId: customer.id,
      participants,
      fromDate: reservation.fromDate,
      toDate: reservation.toDate,
      reservationType,
    });

    if (authorizedUser) {
      await this.validatePendingReservations({
        userId: reservation.user?.connect?.id,
        customerId: customer.id,
        authorizedUser,
        reservationType,
        lot: reservation.lot,
      });
    }

    await this.validateMode({
      from: reservation.fromDate,
      customerId: customer.id,
      reservationMode,
    });
    const reservationCreated = await this.prisma.reservation.create({
      data: reservation,
      include: {
        reservationMode: true,
        reservationType: true,
        customer: true,
        reservationSpace: true,
      },
    });

    await this.createEvent(reservationCreated, participants, reservationSpace);

    if (participants?.length) {
      await this.saveParticipants(participants, reservationCreated.id);
    }

    this.sendNotifications(reservationCreated, userLoggedId);

    this.sendEmail(reservationCreated);

    return reservationCreated;
  }

  update(): Promise<any> {
    throw new Error('Method not implemented.');
  }

  findAll(params: IPaginationArgs<Prisma.ReservationFindManyArgs>) {
    const { includeCount, skip, take, ...findAllParams } = params;
    return this.paginate(
      'reservation',
      {
        ...findAllParams,
      },
      { includeCount, skip, take },
      ['createdBy', 'user'],
    );
  }

  findOne(
    id: string,
    customerId: string,
    findArgs?: {
      include?: Prisma.ReservationInclude;
      select?: Prisma.ReservationSelect;
    },
  ) {
    const args: Prisma.ReservationFindFirstArgs = {
      where: {
        id,
        customerId,
      },
      ...findArgs,
    };

    return this.getFirst('reservation', args);
  }

  async findLastYearReservations({
    authorizedUserId,
    userId,
    reservationTypeId,
  }: LastYearReservationDto) {
    const { prisma, configService } = this;
    let _userId: string | null | undefined = userId;
    let _authorizedUserId: string | null | undefined = authorizedUserId;
    let _customerId;

    // Si es usuario de la app, busco el ID de autorizado
    const authorizedUser = new Promise((resolve, reject) => {
      if (userId) {
        prisma.user
          .findUnique({
            where: {
              id: userId,
            },
            include: {
              customer: true,
            },
          })
          .then(function (appUser) {
            _customerId = appUser?.customerId;

            const countryCode = appUser?.customer?.countryCode;

            prisma.authorizedUser
              .findFirst({
                where: {
                  customerId: appUser?.customerId || '',
                  username: appUser?.username.substring(
                    countryCode?.length || 0,
                  ),
                },
              })
              .then(function (authorizedUser) {
                _authorizedUserId = authorizedUser ? authorizedUser.id : null;
                resolve(null);
              })
              .catch(function (err) {
                reject(err);
              });
          })
          .catch(function (err) {
            reject(err);
          });
      } else {
        resolve(null);
      }
    });

    // Sino, busco el ID de usuario
    const appUser = new Promise((resolve, reject) => {
      if (authorizedUserId) {
        prisma.authorizedUser
          .findUnique({
            where: { id: authorizedUserId },
            include: {
              customer: true,
            },
          })
          .then(function (authorizedUser) {
            _customerId = authorizedUser?.customerId;

            const countryCode = authorizedUser?.customer.countryCode;

            prisma.user
              .findFirst({
                where: {
                  customerId: authorizedUser?.customerId,
                  username: `${countryCode}${authorizedUser?.username}`,
                },
              })
              .then(function (appUser) {
                _userId = appUser ? appUser.id : null;
                resolve(null);
              })
              .catch(function (err) {
                reject(err);
              });
          })
          .catch(function (err) {
            reject(err);
          });
      } else {
        resolve(null);
      }
    });

    return Promise.all([authorizedUser, appUser])
      .then(function () {
        const { EMITIDO, ATENDIDO } = configService.get('uuids');
        const date = startOfYear(new Date());
        const or: Prisma.ReservationWhereInput['OR'] = [];

        if (_authorizedUserId) {
          or.push({ authorizedUserId: _authorizedUserId });
        }
        if (_userId) {
          or.push({ userId: _userId });
        }
        return prisma.reservation
          .count({
            where: {
              AND: [
                {
                  OR: or,
                },
                { customerId: _customerId },
                { reservationTypeId: reservationTypeId },
                { createdAt: { gte: new Date(date) } },
                {
                  OR: [{ eventStateId: EMITIDO }, { eventStateId: ATENDIDO }],
                },
              ],
            },
          })
          .then(function (count) {
            return { count };
          })
          .catch(function (err) {
            throw new InternalServerErrorException(err);
          });
      })
      .catch(function (err) {
        throw new InternalServerErrorException(err);
      });
  }

  async findReservations(filter: Prisma.ReservationFindManyArgs) {
    const and: Prisma.ReservationWhereInput[] = filter.where?.AND
      ? (filter.where?.AND as Array<Prisma.ReservationWhereInput>)
      : [];

    const authorizedUserFilter: Prisma.ReservationWhereInput[] = remove(
      and,
      function (o: Prisma.ReservationWhereInput) {
        return !isNil(o.authorizedUserId);
      },
    );

    if (authorizedUserFilter.length) {
      let userId: string | undefined;
      const { authorizedUserId } = authorizedUserFilter[0];
      // Esta filtrando por usuario desde la webapp

      if (!authorizedUserId) {
        throw new UnprocessableEntityException(
          errorCodes.AUTHORIZED_USER_NOT_FOUND,
        );
      }

      const authorizedUser = await this.prisma.authorizedUser.findUnique({
        where: {
          id: authorizedUserId as string,
        },
        include: {
          userAuthorizedUser: true,
        },
      });

      if (!authorizedUser) {
        throw new UnprocessableEntityException(
          errorCodes.AUTHORIZED_USER_NOT_FOUND,
        );
      }
      const user = find(authorizedUser.userAuthorizedUser, {
        customerId: authorizedUser.customerId,
      });

      const where: Prisma.ReservationGuestsWhereInput = {};

      if (user) {
        userId = user.id;
        where.OR = [
          { userId: user.id },
          { authorizedUserId: authorizedUserId },
        ];
      } else {
        // No esta registrado
        where.authorizedUserId = authorizedUserId;
      }
      const guests = await this.prisma.reservationGuests.findMany({
        where,
      });

      const ids: { id: string }[] = [];

      forEach(guests, function (g) {
        ids.push({ id: g.reservationId });
      });

      if (ids.length) {
        // Hay reservas en las que aparece como invitado, modifico el filtro para que busque
        // por ese ID de autorizado OR esos ids donde esta como invitado
        const orFilter: Array<Prisma.ReservationGuestsWhereInput> = [
          { authorizedUserId: authorizedUserId },
          ...ids,
        ];
        if (userId) {
          // Si tengo el ID del usuario lo agrego al filtro
          orFilter.push({ userId: userId });
        }

        if (filter.where?.AND && Array.isArray(filter.where?.AND)) {
          filter.where.AND.push({ OR: orFilter });
        } else {
          set(filter, 'where.OR', orFilter);
        }
      }
    }
    return await this.prisma.reservation.findMany(filter);
  }

  async cancelReservationAndEvent({
    id,
    userId,
  }: {
    id: string;
    userId: string;
  }) {
    const { prisma } = this;
    const userIds: Prisma.UserWhereInput[] = [];

    const reservation = await this.prisma.reservation.findUnique({
      where: {
        id,
      },
      include: {
        customer: true,
        reservationSpace: true,
        reservationType: true,
        // Obtener socios participantes para notificar de la cancelación
        reservationGuests: {
          where: {
            NOT: { userId: null },
          },
        },
      },
    });

    if (!reservation) {
      throw new UnprocessableEntityException(
        errorCodes.RESERVATION_DOES_NOT_EXIST,
      );
    }

    if (dayjs().isAfter(reservation.fromDate)) {
      throw new UnprocessableEntityException(
        errorCodes.RESERVATION_CAN_NOT_BE_CANCELED,
      );
    }

    const timeZone = reservation.customer.timezone;
    const utcOffset: number = timeZone
      ? toNumber(timeZone)
      : ReservationService.defaultUTCOffset;

    const eventState = await prisma.eventState.findFirst({
      where: { name: CANCELLED, customerId: null },
    });

    if (!eventState) {
      throw new InternalServerErrorException();
    }

    // Obtener configuración del espacio/cancha

    if (reservation.reservationSpace.notifyParticipants) {
      forEach(reservation.reservationGuests, function (p) {
        userIds.push({ id: p.id });
      });
    }

    if (reservation.reservationSpace.additionalNumbers) {
      const additionalNumbers =
        reservation.reservationSpace.additionalNumbers.split(',');

      forEach(additionalNumbers, function (u) {
        userIds.push({ username: u });
      });
    }

    const reservationUdpated = await this.prisma.reservation.update({
      where: {
        id: reservation.id,
      },
      data: {
        cancelDate: new Date(),
        eventStateId: eventState.id,
      },
    });

    const event = await this.prisma.event.findFirst({
      where: {
        reservationId: reservation.id,
      },
      include: {
        user: true,
      },
    });

    if (event) {
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
        observations: '',
        updatedAt: new Date(),
      });
      await this.prisma.event.update({
        data: {
          eventStateId: eventState.id,
          changeLog: JSON.stringify(chLog),
        },
        where: {
          id: event.id,
        },
      });
    }

    if (userIds.length) {
      const description =
        'Se canceló la reserva ' +
        reservation.reservationType.code +
        ' en: ' +
        reservation.reservationSpace.code +
        ' del día: ' +
        dayjs(reservation.fromDate)
          .utcOffset(utcOffset)
          .format('DD/MM/YYYY HH:mm')
          .toString();

      this.sendPushNotification(userIds, {
        title: 'Reserva cancelada',
        description,
        trialPeriod: reservationUdpated.trialPeriod,
        customerId: reservation.customer.id,
        userId,
        data: {
          reservationId: reservation.id,
        },
      });
    }

    return reservationUdpated;
  }

  async cancelReservation({
    id,
    eventStateId,
    userId,
  }: {
    id: string;
    eventStateId?: string;
    userId: string;
  }) {
    const userIds: Prisma.UserWhereInput[] = [];
    const reservation = await this.prisma.reservation.findUnique({
      where: {
        id,
      },
      include: {
        customer: true,
        // Obtener configuración del espacio/cancha
        reservationSpace: true,
        reservationType: true,
        // Obtener socios participantes para notificar de la cancelación
        reservationGuests: {
          where: {
            NOT: { userId: null },
          },
        },
      },
    });

    if (!reservation) {
      throw new UnprocessableEntityException(
        errorCodes.RESERVATION_DOES_NOT_EXIST,
      );
    }

    const timeZone = reservation.customer.timezone;
    const utcOffset = timeZone
      ? toNumber(timeZone)
      : ReservationService.defaultUTCOffset;

    let whereEventState: Prisma.EventStateWhereInput = {
      name: CANCELLED,
      customerId: null,
    };

    if (eventStateId) {
      whereEventState = { id: eventStateId };
    }

    const eventState = await this.prisma.eventState.findFirst({
      where: whereEventState,
    });

    if (!eventState) {
      throw new UnprocessableEntityException(errorCodes.EVENT_STATE_NOT_FOUND);
    }

    if (
      reservation.reservationGuests.length &&
      reservation.reservationSpace.notifyParticipants
    ) {
      forEach(reservation.reservationGuests, function (p) {
        userIds.push({ id: p.userId as string });
      });
    }

    // Cancelar la reserva
    const reservationUpdated = await this.prisma.reservation.update({
      data: {
        cancelDate: new Date(),
        eventStateId: eventState.id,
      },
      where: {
        id,
      },
    });

    if (reservation.reservationSpace.additionalNumbers) {
      const additionalNumbers =
        reservation.reservationSpace.additionalNumbers.split(',');

      forEach(additionalNumbers, function (u) {
        userIds.push({ username: u });
      });
    }

    if (userIds.length) {
      const description =
        'Se canceló la reserva ' +
        reservation.reservationType.code +
        ' en: ' +
        reservation.reservationSpace.code +
        ' del día: ' +
        dayjs(reservation.fromDate)
          .utcOffset(utcOffset)
          .format('DD/MM/YYYY HH:mm')
          .toString();

      this.sendPushNotification(userIds, {
        title: 'Reserva cancelada',
        description,
        trialPeriod: reservationUpdated.trialPeriod,
        customerId: reservation.customer.id,
        userId,
        data: {
          reservationId: reservation.id,
        },
      });
    }

    return reservationUpdated;
  }

  async changeState({
    id,
    eventStateId,
    userId,
  }: ChangeStateReservationDto & { userId: string }) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id },
    });

    if (!reservation) {
      throw new NotFoundException(errorCodes.RESERVATION_DOES_NOT_EXIST);
    }
    const event = await this.prisma.event.findFirst({
      where: {
        reservationId: reservation.id,
      },
    });

    const eventState = await this.prisma.eventState.findUnique({
      where: {
        id: eventStateId,
      },
    });

    if (!eventState) {
      throw new UnprocessableEntityException(errorCodes.EVENT_STATE_NOT_FOUND);
    }

    if (eventState.name === CANCELLED) {
      return await this.cancelReservation({
        id,
        userId,
        eventStateId,
      });
    }
    const transactions: (PrismaPromise<Reservation> | PrismaPromise<Event>)[] =
      [
        this.prisma.reservation.update({
          data: {
            eventStateId: eventStateId,
          },
          where: {
            id,
          },
        }),
      ];

    if (event) {
      transactions.push(
        this.prisma.event.update({
          data: {
            eventStateId: eventState.id,
          },
          where: {
            id: event.id,
          },
        }),
      );
    }

    const [reservationUpdated] = await this.prisma.$transaction(transactions);

    return reservationUpdated;
  }

  async confirmReservation({
    id,
    userId,
  }: ConfirmReservationDto & { userId: string }) {
    const userIds: Prisma.UserWhereInput[] = [];

    const reservation = await this.prisma.reservation.findUnique({
      where: {
        id,
      },
      include: {
        customer: true,
        // Obtener configuración del espacio/cancha
        reservationSpace: true,
        reservationType: true,
        // Obtener socios participantes para notificar de la cancelación
        reservationGuests: {
          where: {
            NOT: { userId: null },
          },
        },
      },
    });

    if (!reservation) {
      throw new NotFoundException(errorCodes.RESERVATION_DOES_NOT_EXIST);
    }

    const reservationState = await this.prisma.eventState.findFirst({
      where: {
        name: EMITTED,
        customerId: null,
      },
    });

    if (!reservationState) {
      throw new InternalServerErrorException(errorCodes.EVENT_STATE_NOT_FOUND);
    }

    if (reservation.userId) {
      userIds.push({ id: reservation.userId });
    }

    const timeZone = reservation.customer.timezone;
    const utcOffset = timeZone
      ? toNumber(timeZone)
      : ReservationService.defaultUTCOffset;

    const reservationUpdated = await this.prisma.reservation.update({
      where: {
        id,
      },
      data: {
        eventStateId: reservationState.id,
      },
    });

    await this.prisma.event.updateMany({
      data: {
        eventStateId: reservationState.id,
      },
      where: {
        reservationId: id,
      },
    });

    if (
      reservation.reservationGuests.length &&
      reservation.reservationSpace.notifyParticipants
    ) {
      forEach(reservation.reservationGuests, function (p) {
        userIds.push({ id: p.userId as string });
      });
    }

    if (userIds.length) {
      const description =
        'Se confirmó la reserva ' +
        reservation.reservationType.code +
        ' en: ' +
        reservation.reservationSpace.code +
        ' del día: ' +
        dayjs(reservation.fromDate)
          .utcOffset(utcOffset)
          .format('DD/MM/YYYY HH:mm')
          .toString();

      this.sendPushNotification(userIds, {
        title: 'Reserva confirmada',
        description,
        trialPeriod: reservationUpdated.trialPeriod,
        customerId: reservation.customer.id,
        userId,
        data: {
          reservationId: reservation.id,
        },
      });
    }
    return reservationUpdated;
  }

  async downloadDetailList(params: GetQueryReservationDetailDto) {
    const { id, utcOffset } = params;

    const reservation = await this.prisma.reservation.findUnique({
      where: {
        id,
      },
      include: {
        authorizedUser: true,
        user: true,
        reservationType: true,
        reservationSpace: true,
        reservationMode: true,
      },
    });

    if (!reservation) {
      throw new NotFoundException(errorCodes.RESERVATION_NOT_FOUND);
    }

    const guests = await this.prisma.reservationGuests.findMany({
      where: {
        reservationId: id,
      },
      include: {
        user: true,
        authorizedUser: true,
      },
    });

    let participants = '';
    forEach(guests, function (g) {
      let lot: string | null = null;
      if (g.user) {
        lot = g.user.lot;
      } else if (g.authorizedUser) {
        lot = g.authorizedUser.lot;
      }
      participants =
        participants + g.fullName + (lot ? ' (Lote: ' + lot + ')' : '') + ',  ';
    });

    const fields = [
      {
        label: 'Lote',
        value: function (reg) {
          return reg.lot || null;
        },
      },
      {
        label: 'Nombre y apellido',
        value: function (reg) {
          const authorizedUser = reg.authorizedUserId
            ? reg.authorizedUser
            : null;
          const user = reg.userId ? reg.user : null;
          if (!user && !authorizedUser) {
            return null;
          }
          return user
            ? user.firstName + ' ' + user.lastName
            : authorizedUser.firstName + ' ' + authorizedUser.lastName;
        },
      },
      {
        label: 'Usuario',
        value: function (reg) {
          const authorizedUser = reg.authorizedUserId
            ? reg.authorizedUser
            : null;
          const user = reg.userId ? reg.user : null;
          if (!user && !authorizedUser) {
            return null;
          }
          return user ? user.username : authorizedUser.username;
        },
      },
      {
        label: 'Reserva',
        value: function (reg) {
          const reservationType = reg.reservationType;
          if (!reservationType) {
            return null;
          }
          return reservationType.code;
        },
      },
      {
        label: 'Modalidad',
        value: function (reg) {
          const reservationMode = reg.reservationMode;
          if (!reservationMode) {
            return null;
          }
          return reservationMode.name;
        },
      },
      {
        label: 'Espacio',
        value: function (reg) {
          const reservationSpace = reg.reservationSpace;
          if (!reservationSpace) {
            return null;
          }
          return reservationSpace.code;
        },
      },
      {
        label: 'Fecha desde',
        value: function (reg) {
          const date = new Date(reg.fromDate);
          const localizedDate = utcOffset
            ? dayjs(date).utcOffset(parseInt(utcOffset))
            : dayjs(date);
          if (dayjs(date).isValid()) {
            return localizedDate.format('DD/MM/YYYY HH:mm').toString();
          }
        },
      },
      {
        label: 'Fecha hasta',
        value: function (reg) {
          const date = new Date(reg.toDate);
          const localizedDate = utcOffset
            ? dayjs(date).utcOffset(parseInt(utcOffset))
            : dayjs(date);
          if (dayjs(date).isValid()) {
            return localizedDate.format('DD/MM/YYYY HH:mm').toString();
          }
        },
      },
      {
        label: 'Cantidad Invitados',
        value: function (reg) {
          return reg.numberOfGuests || null;
        },
      },
      {
        label: 'Invitados',
        value: function () {
          return participants || null;
        },
      },
      {
        label: 'Fecha creación',
        value: function (reg) {
          const date = new Date(reg.createdAt);
          const localizedDate = utcOffset
            ? dayjs(date).utcOffset(parseInt(utcOffset))
            : dayjs(date);
          if (dayjs(date).isValid()) {
            return localizedDate.format('DD/MM/YYYY HH:mm').toString();
          }
        },
      },
      {
        label: 'Fecha cancelación',
        value: function (reg) {
          if (!reg.cancelDate) {
            return null;
          }
          const date = new Date(reg.cancelDate);
          const localizedDate = utcOffset
            ? dayjs(date).utcOffset(parseInt(utcOffset))
            : dayjs(date);
          if (dayjs(date).isValid()) {
            return localizedDate.format('DD/MM/YYYY HH:mm').toString();
          }
        },
      },
    ];

    const csvDelimiter = this.configService.get('csvDelimiter');

    const json2csv = new Parser({ delimiter: csvDelimiter, fields });
    const tsv = json2csv.parse([reservation]);

    return tsv;
  }

  async getStatistics(
    customerId: string,
    params: Pick<ListQueryArgsDto, 'where'>,
  ) {
    const { prisma } = this;
    const where = params.where || {};

    const count = await prisma.reservation.count({ where });

    const customerIds: { customerId: string }[] = await validateCustomers(
      this.prisma,
      customerId,
      params.where,
    );

    // Total por tipo de alerta
    const totalByType = new Promise(async (resolve, reject) => {
      try {
        const types = await prisma.reservationType.findMany({
          where: {
            OR: customerIds,
          },
        });
        const group = await prisma.reservation.groupBy({
          by: ['reservationTypeId'],
          where,
          orderBy: {
            reservationTypeId: 'asc',
          },
          _count: {
            _all: true,
          },
        });

        const percentageByType = group.map(({ reservationTypeId, _count }) => ({
          code: types.find((i) => i.id === reservationTypeId)?.code,
          type: reservationTypeId,
          count: _count._all,
          percentage: (_count._all * 100) / count,
        }));

        resolve(percentageByType);
      } catch (err) {
        reject(err);
      }
    });

    // Total por estado de reserva (actionId => Action model)
    const totalByState = new Promise(async (resolve, reject) => {
      try {
        const states = await prisma.eventState.findMany({
          where: {
            OR: [{ customerId: null }, ...customerIds],
          },
        });

        const group = await prisma.reservation.groupBy({
          by: ['eventStateId'],
          where,
          orderBy: {
            eventStateId: 'asc',
          },
          _count: {
            _all: true,
          },
        });

        const percentageByState = group.map(({ eventStateId, _count }) => ({
          name: states.find((i) => i.id === eventStateId)?.name,
          state: eventStateId,
          count: _count._all,
          percentage: (_count._all * 100) / count,
        }));

        resolve(percentageByState);
      } catch (err) {
        reject(err);
      }
    });

    const values = await Promise.all([totalByType, totalByState]);

    return {
      totalByType: values[0],
      totalByState: values[1],
      total: count,
    };
  }
}
