import { Prisma } from '.prisma/client';
import {
  Inject,
  Injectable,
  InternalServerErrorException,
  UnprocessableEntityException,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '@src/database/prisma.service';
import { IEntityService, IPaginationArgs } from '@src/interfaces/types';
import { Service } from '@src/common/classes/service.class';
import { get, startsWith, toNumber } from 'lodash';
import { errorCodes } from './neighborhood-alarm.constants';
import { User } from '@prisma/client';
import * as dayjs from 'dayjs';
import * as utc from 'dayjs/plugin/utc';
import { PushNotificationService } from '@src/push-notification/push-notification.service';
import { NeighborhoodAlarm } from './types';
import { SmsService } from '@src/sms/sms.service';
import { AlertsService } from '@src/alerts/alerts.service';
import { GeolocationAlert } from '@src/alerts/dto/geolocation.dto';
dayjs.extend(utc);

@Injectable()
export class NeighborhoodService extends Service implements IEntityService {
  constructor(
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    @Inject(forwardRef(() => AlertsService))
    private alertService: AlertsService,
    readonly prisma: PrismaService,
    private smsService: SmsService,
    private pushNotificationService: PushNotificationService,
  ) {
    super(prisma);
  }

  update(): Promise<any> {
    throw new Error('Method not implemented.');
  }

  private async findUser(id: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id,
      },
      include: {
        userPermissions: true,
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

  private async findAlertState(where: Prisma.AlertStateWhereInput) {
    const alertState = await this.prisma.alertState.findFirst({
      where,
    });

    if (!alertState) {
      throw new InternalServerErrorException({
        message: errorCodes.ALERT_STATE_NOT_FOUND,
      });
    }

    return alertState;
  }

  private async findAlertType(where: Prisma.AlertTypeWhereInput) {
    const alertType = await this.prisma.alertType.findFirst({
      where,
    });

    if (!alertType) {
      throw new InternalServerErrorException({
        message: errorCodes.ALERT_TYPE_NOT_FOUND,
      });
    }

    return alertType;
  }

  private async alertNeighbor(alarm: NeighborhoodAlarm) {
    const latitude = get(alarm, 'geolocation.coords.lat', '');
    const longitude = get(alarm, 'geolocation.coords.lng', '');

    const alertType = await this.findAlertType({
      type: 'panic',
    });

    await this.alertService.create({
      approximateAddress: alarm.approximateAddress || undefined,
      alertTypeId: alertType.id,
      geolocation: {
        battery: {
          level: 1,
        },
        coords: {
          latitude,
          longitude,
        },
        timestamp: alarm.createdAt.getTime(),
      } as unknown as GeolocationAlert,
      userId: alarm.userId,
      customerId: alarm.customerId,
      neighborhoodAlarmId: alarm.id,
    });
  }

  private async sendNotifications(
    alarm: NeighborhoodAlarm,
    utcOffset?: string | null,
  ) {
    const offset = utcOffset ? toNumber(utcOffset) : -180;
    const date = dayjs
      .utc(alarm.createdAt)
      .utcOffset(offset)
      .format('DD/MM/YYYY HH:mm:ss');

    const users = await this.prisma.user.findMany({
      where: {
        customerId: alarm.customerId,
        alarmNumber: alarm.urgencyNumber,
        /// verify that users are active
        active: true,
        NOT: [{ pushId: null }, { pushId: 'null' }, { id: alarm.userId }],
      },
      select: {
        id: true,
        pushId: true,
      },
    });
    const players: string[] = [];
    const relatedUsers: { neighborhoodAlarmId: string; userId: string }[] = [];

    users.forEach((user) => {
      players.push(user.pushId as string);
      relatedUsers.push({ neighborhoodAlarmId: alarm.id, userId: user.id });
    });

    if (players.length) {
      await this.pushNotificationService.pushNotification(
        {
          title: `ALARMA VECINAL ${date}hs`,
          description: `Emitida por: ${alarm.user.fullName}`,
          data: {
            emergency: true,
            neighborhoodAlarmId: alarm.id,
          },
          channelId: 'emergency-notifications',
        },
        players,
      );

      await this.prisma.neighborhoodAlarmUsers.createMany({
        data: relatedUsers,
      });
    }
  }

  private async sendSms(alarm: NeighborhoodAlarm, utcOffset?: string | null) {
    if (alarm.urgencyNumber) {
      const offset = utcOffset ? toNumber(utcOffset) : -180;

      const date = dayjs
        .utc(alarm.createdAt)
        .utcOffset(offset)
        .format('DD/MM/YYYY HH:mm:ss');

      const keyword =
        alarm.customer.integrations?.neighborhoodAlarmKey || 'REDALERTABASAPP';
      let phoneNumber = alarm.urgencyNumber;

      if (phoneNumber && !startsWith(phoneNumber, '54')) {
        phoneNumber = '54' + phoneNumber;
      }

      await this.smsService.send({
        msg: keyword + ' ' + alarm.userId + ' ' + date,
        phoneNumber,
      });
    }
  }

  private getApproximateAddress(homeAddress: User['homeAddress']) {
    const floor = get(homeAddress, 'floor');
    const apartment = get(homeAddress, 'apartment');

    return (
      get(homeAddress, 'fullAddress.street') +
      ' ' +
      get(homeAddress, 'fullAddress.number') +
      ' ' +
      (floor ? ', Piso: ' + floor + ' ' : '') +
      (apartment ? 'Departamento:' + apartment : '')
    );
  }

  async create({ customerId, userId }: { customerId: string; userId: string }) {
    const user = await this.findUser(userId);
    const address = user.homeAddress ? user.homeAddress : user.workAddress;

    const geolocation = { coords: get(address, 'fullAddress.geolocation', {}) };

    const approximateAddress = this.getApproximateAddress(address);

    const neighborhoodAlarmCreated = await this.prisma.neighborhoodAlarm.create(
      {
        data: {
          urgencyNumber: user.alarmNumber,
          approximateAddress,
          geolocation: geolocation as unknown as Prisma.InputJsonObject,
          user: {
            connect: {
              id: userId,
            },
          },
          customer: {
            connect: {
              id: customerId,
            },
          },
        },
        include: {
          user: true,
          customer: {
            include: {
              integrations: true,
            },
          },
        },
      },
    );
    if (neighborhoodAlarmCreated.urgencyNumber) {
      await this.alertNeighbor(neighborhoodAlarmCreated);
      this.sendNotifications(
        neighborhoodAlarmCreated,
        neighborhoodAlarmCreated.customer?.timezone,
      );
      this.sendSms(
        neighborhoodAlarmCreated,
        neighborhoodAlarmCreated.customer?.timezone,
      );
    }

    return neighborhoodAlarmCreated;
  }

  async findAll(params: IPaginationArgs<Prisma.NeighborhoodAlarmFindManyArgs>) {
    const { includeCount, skip, take, ...findAllParams } = params;
    return this.paginate(
      'neighborhoodAlarm',
      {
        ...findAllParams,
      },
      { includeCount, skip, take },
    );
  }
}
