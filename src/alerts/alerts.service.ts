import {
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
  UnprocessableEntityException,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '@src/database/prisma.service';
import {
  DataArray,
  IEntityService,
  IPaginationArgs,
} from '@src/interfaces/types';
import { Service } from '@src/common/classes/service.class';
import {
  deviceTypes,
  errorCodes,
  maxDistance,
  pattern,
  propertyNameAlert,
  trackingTypes,
  typeAddressComponents,
} from './alerts.constants';
import { AlertDto } from './dto/create-alert.dto';
import { ExternalService } from '@src/common/services/external.service';
import {
  CustomerIntegration,
  CustomerSettings,
  Prisma,
  CustomerType,
  NotificationType,
} from '@prisma/client';
import { find, includes, merge, set } from 'lodash';
import { Alert } from './entities/alert.entity';
import { ConfigService } from '@nestjs/config';
import smsCrypt from '../utils/sms-crypt';
import {
  changeInputJsonObject,
  changeRelationTable,
  validateCustomers,
} from '@src/utils';
import { ChangeStateAlertDto } from './dto/change-state.dto';
import { AddressDto } from '@src/users/dto/address.dto';
import { getDistance } from '@src/utils/distances';
import { CheckpointDto } from './dto/checkpoint.dto';
import { FirebaseService } from '@src/firebase/firebase.service';
import { PushNotificationService } from '@src/push-notification/push-notification.service';
import { Logger } from '@src/common/logger';
import { ListQueryArgsDto } from '@src/common/dto/list-query-args.dto';
import { NeighborhoodService } from '@src/customers/neighborhood-alarm/neighborhood-alarm.service';

@Injectable()
export class AlertsService extends Service implements IEntityService {
  constructor(
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    @Inject(forwardRef(() => NeighborhoodService))
    private neighborhoodService: NeighborhoodService,
    private configService: ConfigService,
    readonly prisma: PrismaService,
    private externalService: ExternalService,
    private firebaseService: FirebaseService,
    private pushNotificationService: PushNotificationService,
  ) {
    super(prisma);
  }

  async findAll(
    params: IPaginationArgs<Prisma.AlertFindManyArgs>,
    customerId: string,
  ) {
    const { includeCount, skip, take, ...findAllParams } = params;

    await validateCustomers(this.prisma, customerId, params.where || {});

    return this.paginate('alert', findAllParams, { includeCount, skip, take }, [
      'user',
    ]);
  }

  async findOne(
    id: string,
    customerId: string,
    findArgs?: {
      include?: Prisma.AlertInclude;
      select?: Prisma.AlertSelect;
    },
  ) {
    const args: Prisma.AlertFindFirstArgs = {
      where: {
        id,
      },
      ...findArgs,
    };

    const alert = await this.getFirst('alert', args);
    if (!alert) {
      throw new NotFoundException(errorCodes.ALERT_NOT_FOUND);
    }

    return alert;
  }
  update(): Promise<any> {
    throw new Error('Method not implemented.');
  }

  async findGovernmentCustomer(
    alertLocation: {
      approximateAddress: string | undefined;
      city: undefined;
      district: undefined;
      state: undefined;
      country: undefined;
    },
    alertType: string,
  ) {
    const customerFound = await this.prisma.customer.findFirst({
      where: {
        type: CustomerType.government,
        active: true,
        district: alertLocation.district,
        state: alertLocation.state,
        country: alertLocation.country,
      },
      include: {
        alertTypes: {
          include: {
            alertType: true,
          },
        },
      },
    });

    if (!customerFound) {
      return null;
    }

    const listAlerts = customerFound.alertTypes.map(
      ({ alertType }) => alertType.id,
    );

    if (listAlerts.includes(alertType)) {
      return customerFound;
    }
  }

  private async existAlert(id: string, customerId: string) {
    const existAlert = await this.prisma.alert.count({
      where: {
        id,
        customerId,
      },
    });
    if (!existAlert) {
      throw new NotFoundException(errorCodes.ALERT_NOT_FOUND);
    }
  }

  private async existAlertState(id: string, customerId: string) {
    const existAlertState = await this.prisma.alertState.count({
      where: {
        id,
        OR: [
          {
            customerId: null,
          },
          {
            customerId,
          },
        ],
      },
    });
    if (!existAlertState) {
      throw new NotFoundException(errorCodes.ALERT_STATE_NOT_FOUND);
    }
  }

  private async findAlertState(where: Prisma.AlertStateWhereInput) {
    const alertState = await this.prisma.alertState.findFirst({
      where,
    });

    if (!alertState) {
      throw new UnprocessableEntityException({
        statusCode: 422,
        message: errorCodes.ALERT_STATE_NOT_FOUND,
      });
    }

    return alertState;
  }

  private async setAlertLocation(customerType: CustomerType, data: AlertDto) {
    const {
      geolocation: { coords },
      approximateAddress,
    } = data;
    const instance = {
      approximateAddress,
      city: undefined,
      district: undefined,
      state: undefined,
      country: undefined,
    };

    if (coords && coords?.latitude && coords?.longitude) {
      const response = await this.externalService.reverseGeocoding({
        lat: coords.latitude,
        lng: coords.longitude,
      });

      if (response) {
        const { CITY, DISTRICT, STATE, COUNTRY } = typeAddressComponents;
        const results = response.results[0];
        if (results) {
          results.address_components.forEach((result) => {
            if (includes(result.types, CITY)) {
              instance.city = result.long_name || result.short_name || null;
              instance.district = result.long_name || result.short_name || null;
            }
            // FIXME: Validar por qué está el AND
            // if (includes(result.types, DISTRICT) && !instance.district) {
            if (includes(result.types, DISTRICT)) {
              instance.district = result.long_name || result.short_name || null;
            }
            if (includes(result.types, STATE)) {
              instance.state = result.long_name || result.short_name || null;
              if (result.short_name === 'CABA') {
                instance.district = result.long_name;
              }
            }
            if (includes(result.types, COUNTRY))
              instance.country = result.long_name || result.short_name || null;
          });

          instance.approximateAddress = results.formatted_address || null;
        }
      }
    }
    return instance;
  }

  private async findCustomer(id: string) {
    const customer = await this.prisma.customer.findFirst({
      where: {
        id,
      },
      include: {
        settings: true,
        integrations: true,
      },
    });

    if (!customer || !customer.settings || !customer.integrations) {
      throw new UnprocessableEntityException({
        statusCode: 422,
        message: errorCodes.CUSTOMER_NOT_FOUND,
      });
    }

    return {
      ...customer,
      settings: customer.settings,
      integrations: customer.integrations,
    };
  }

  private async findAlertType(id: string) {
    const alertType = await this.prisma.alertType.count({
      where: {
        id,
      },
    });

    if (!alertType) {
      throw new UnprocessableEntityException({
        statusCode: 422,
        message: errorCodes.ALERT_TYPE_NOT_FOUND,
      });
    }
  }

  private async setFirstCheckpoint(data: Alert) {
    if (trackingTypes.includes(data.alertType.type)) {
      return await this.prisma.checkpoint.create({
        data: {
          alertId: data.id,
          geolocation: data.geolocation as unknown as Prisma.InputJsonObject,
        },
      });
    }
  }

  private async sendPushNotifications(
    alert: Alert,
    customerSettings: CustomerSettings,
  ) {
    const { user, alertType } = alert;
    try {
      if (alertType.name === 'arrived-well') {
        return;
      }

      const contacts = await this.prisma.contact.findMany({
        where: {
          userId: user.id,
          contactAlertTypes: {
            some: {
              alertTypeId: alertType.id,
            },
          },
          contactUser: {
            active: true,
          },
        },
        include: {
          contactUser: true,
        },
      });

      let players: string[] = contacts
        .filter((i) => i.contactUser?.pushId)
        .map((i) => i.contactUser?.pushId as string);

      let usersToSend = contacts.map((i) => i.contactUser!.id);

      let filter: { username: string }[] = [];
      if (customerSettings.securityChief) {
        filter.push({ username: customerSettings.securityChief });
      }

      if (customerSettings.securityGuard) {
        filter.push({ username: customerSettings.securityGuard });
      }
      if (customerSettings.additionalNotifications) {
        const additionalNotifications =
          customerSettings.additionalNotifications.split(',');

        filter = filter.concat(
          additionalNotifications.map((i) => ({ username: i })),
        );
      }

      if (customerSettings[propertyNameAlert[alertType.type]]) {
        const alertTypeNumbers =
          customerSettings[propertyNameAlert[alertType.type]].split(',');

        filter = filter.concat(
          alertTypeNumbers.map((i: string) => ({ username: i })),
        );
      }
      if (filter.length) {
        const usersFound = await this.prisma.user.findMany({
          where: {
            OR: filter,
            active: true,
            customerType: user.customerType,
          },
          select: {
            pushId: true,
            id: true,
          },
        });

        players = players.concat(
          usersFound.filter((i) => i.pushId).map((i) => i.pushId as string),
        );
        usersToSend = usersToSend.concat(usersFound.map((i) => i.id));
      }

      if (usersToSend.length) {
        await this.prisma.notification.create({
          data: {
            title: `Alerta de ${alertType.name}`,
            description: `${user.firstName} ${user.lastName} emitió una alerta de ${alertType.name}`,
            emergency: true,
            notificationType: NotificationType.alert,
            toUsers: {
              createMany: {
                data: usersToSend.map((i) => ({
                  userId: i,
                })),
              },
            },
            customer: {
              connect: {
                id: customerSettings.customerId,
              },
            },
            user: {
              connect: {
                id: user.id,
              },
            },
            alert: {
              connect: {
                id: alert.id,
              },
            },
            image: user.image
              ? (user.image as unknown as Prisma.InputJsonObject)
              : undefined,
          },
        });
      }

      if (players.length) {
        this.pushNotificationService.pushNotification(
          {
            title: `Alerta de ${alertType.name}`,
            description: `${user.firstName} ${user.lastName} emitió una alerta de ${alertType.name}`,
            data: {},
            channelId: 'emergency-notifications',
          },
          players,
        );
      }
    } catch (err) {
      Logger.error(err);
    }
  }

  private async getTraccarDevices(
    customerIntegration: CustomerIntegration,
    alertId: string,
  ) {
    if (
      !customerIntegration.traccarUrl ||
      !customerIntegration.traccarUsername ||
      !customerIntegration.traccarPassword
    ) {
      return;
    }
    try {
      const traccarAuth = new Buffer(
        `${customerIntegration.traccarUsername}:${customerIntegration.traccarPassword}`,
      ).toString('base64');
      const traccarUrl = customerIntegration.traccarUrl;

      let positions = await this.externalService.getTraccarPositions(
        traccarAuth,
        traccarUrl,
      );

      if (typeof positions === 'string') {
        positions = JSON.parse(positions);
      }

      let devices = await this.externalService.getTraccarDevices(
        traccarAuth,
        traccarUrl,
      );

      if (typeof devices === 'string') {
        devices = JSON.parse(devices);
      }

      const traccarDevices = devices
        .filter((dev) => dev.status === 'online')
        .map((dev) => {
          const position = positions.filter((pos) => {
            return pos.deviceId === dev.id;
          });

          const fullDevice = position ? merge(dev, position[0]) : dev; // Junto la info del dispositivo con su posición (si es que existe)

          const traccar: Prisma.ExternalServiceCreateManyInput = {
            attributes: fullDevice.attributes,
            geolocation: {
              latitude: fullDevice.latitude,
              longitude: fullDevice.longitude,
            },
            name: fullDevice.name,
            description: fullDevice.model,
            uniqueId: fullDevice.uniqueId,
            alertId,
            service: 'Traccar',
            type: fullDevice.category,
            active: fullDevice.status === 'online',
            createdAt: new Date(),
          };

          return traccar;
        });

      if (traccarDevices.length) {
        await this.prisma.externalService.createMany({
          data: traccarDevices,
        });
      }
    } catch (err) {
      Logger.error(err);
    }
  }

  async decryptSms(message: string) {
    const configSms = this.configService.get('sms');
    const keyword = configSms.smsMasivos.keyword;

    // position 0 id user (estoy preguntado si va esto ya que no esta access token)
    // position 1 alertType, el tipo de alerta
    // position 2 geolocation.timestamp, date.
    // position 3 geolocation.coords.latitude, number.
    // position 4 geolocation.coords.longitude, number.
    // position 5 geolocation.battery.level, string o number?
    // position 6 geolocation.coords.accuracy, number

    const data = smsCrypt.decrypt(
      pattern,
      message.substring(keyword.length),
      configSms.cryptKey,
    );

    const dataArray: DataArray = data.split(',').map((value, index) => {
      if (index === 0 || index === 1) {
        return value;
      }
      return parseFloat(value);
    });

    const user = await this.prisma.user.findUnique({
      where: {
        id: dataArray[0] as string,
      },
    });

    if (!user) {
      throw new UnauthorizedException({
        statusCode: 401,
        error: 'Unauthorized',
        message: errorCodes.AUTHORIZATION_REQUIRED,
      });
    }
    const isNeighborhoodAlarm = dataArray[1] === 'neighborhood-alarm';

    if (isNeighborhoodAlarm) {
      // ALARMA VECINAL
      await this.neighborhoodService.create({
        userId: user.id,
        customerId: user.customerId as string,
      });
      return;
    } else {
      const alertSmsData: AlertDto & { userId: string; customerId: string } = {
        userId: '',
        geolocation: {
          battery: {
            level: undefined,
          },
          network: '',
          timestamp: 0,
          coords: {
            accuracy: undefined,
            latitude: 0,
            longitude: 0,
          },
        },
        alertTypeId: '',
        customerId: '',
      };
      // ALERTA
      alertSmsData.userId = user.id; // agregamos directamente el userId
      if (user.customerId) {
        alertSmsData.customerId = user.customerId; // agregamos directamente el customerId
      }
      const alertType = await this.prisma.alertType.findFirst({
        where: {
          type: dataArray[1] as string,
        },
      });

      if (!alertType) {
        throw new UnprocessableEntityException({
          statusCode: 422,
          message: errorCodes.ALERT_TYPE_NOT_FOUND,
        });
      }
      alertSmsData.alertTypeId = alertType?.id; //buscamos el id del alert Type y lo agregamos

      set(alertSmsData, 'geolocation.timestamp', new Date(dataArray[2]));
      set(alertSmsData, 'geolocation.network', 'sms');

      if (dataArray[3] && dataArray[4]) {
        set(alertSmsData, 'geolocation.coords.latitude', dataArray[3]);
        set(alertSmsData, 'geolocation.coords.longitude', dataArray[4]);
      }

      if (dataArray[5]) {
        set(alertSmsData, 'geolocation.battery.level', dataArray[5]);
      }

      if (dataArray[6]) {
        set(alertSmsData, 'geolocation.coords.accuracy', dataArray[6]);
      }

      await this.create(alertSmsData);
      return;
    }
  }

  private getDeviceType(description) {
    return deviceTypes[description] || 'default';
  }

  private async setAlertNeighborhoodId(
    data: AlertDto & { userId: string; customerId: string },
  ) {
    const alertCoords = data.geolocation.coords;
    if (alertCoords) {
      const user = await this.prisma.user.findUnique({
        where: {
          id: data.userId,
        },
      });
      let workDistance;
      let homeDistance;
      const work = user?.workAddress as unknown as AddressDto;
      const home = user?.homeAddress as unknown as AddressDto;

      let nId;
      if (work) {
        const workCoords = work.fullAddress.geolocation;
        if (workCoords) {
          workDistance = getDistance(
            alertCoords.latitude,
            alertCoords.longitude,
            parseFloat(workCoords.lat),
            parseFloat(workCoords.lng),
          ).toFixed(1);
        }
      }

      if (home) {
        const homeCoords = home.fullAddress.geolocation;
        if (homeCoords) {
          homeDistance = getDistance(
            alertCoords.latitude,
            alertCoords.longitude,
            parseFloat(homeCoords.lat),
            parseFloat(homeCoords.lng),
          ).toFixed(1);
        }
      }

      if (homeDistance && workDistance) {
        if (homeDistance < workDistance && homeDistance < maxDistance) {
          nId = work.neighborhoodId;
          if (nId) {
            return nId;
          }
        }

        if (workDistance < homeDistance && workDistance < maxDistance) {
          nId = work.neighborhoodId;
          if (nId) {
            return nId;
          }
        }
      }

      if (homeDistance && !workDistance && homeDistance < maxDistance) {
        nId = home.neighborhoodId;
        if (nId) {
          return nId;
        }
      }

      if (!homeDistance && workDistance && workDistance < maxDistance) {
        nId = work.neighborhoodId;
        if (nId) {
          return nId;
        }
      }
    }
    return undefined;
  }

  private async setAppMessage(userId: string, customerId: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        customer: true,
      },
    });

    if (!user || !user?.customer) {
      throw new InternalServerErrorException();
    }
    // Mensaje por defecto
    if (
      (user.customer.id === customerId && !user.customer.active) ||
      !user.customer.isClient
    ) {
      return true;
    }

    return false;
  }

  private async getCybermapaDevices(
    customerIntegration: CustomerIntegration,
    alertId: string,
  ) {
    try {
      const { cybermapaUrl, cybermapaUsername, cybermapaPassword } =
        customerIntegration;

      if (cybermapaUrl && cybermapaUsername && cybermapaPassword) {
        const vehicles = await this.externalService.getCyberMapa(
          cybermapaUrl,
          cybermapaUsername,
          cybermapaPassword,
          'GETVEHICULOS',
        );
        const devices = await this.externalService.getCyberMapa(
          cybermapaUrl,
          cybermapaUsername,
          cybermapaPassword,
          'DATOSACTUALES',
        );

        const cybermapaDevices: Prisma.ExternalServiceCreateManyInput[] =
          devices.map((device) => {
            const vehicle = find(vehicles, { id: device.id });
            return {
              alertId,
              attributes: {
                gps_id: device.gps_id,
                alias: device.alias,
                gps: device.gps,
                fecha: device.fecha,
                sentido: device.sentido,
                velocidad: device.velocidad,
                evento: device.evento,
                parking_activado: device.parking_activado,
                parking_distancia: device.parking_distancia,
                type: vehicle ? vehicle.descripcion : null,
              },
              geolocation: {
                latitude: device.latitud,
                longitude: device.longitud,
              },
              name: device.nombre,
              description: device.patente,
              type: vehicle ? this.getDeviceType(vehicle.descripcion) : null,
              active: true,
              uniqueId: device.id,
              service: 'Cybermapa',
            };
          });

        if (cybermapaDevices && cybermapaDevices.length) {
          await this.prisma.externalService.createMany({
            data: cybermapaDevices,
          });
        }
      }
    } catch (err) {
      Logger.error(err);
    }
  }

  async create(
    data: AlertDto & {
      userId: string;
      customerId: string;
      neighborhoodAlarmId?: string;
    },
  ) {
    const {
      customerId,
      userId,
      alertTypeId,
      geolocation,
      geolocations,
      originalGeolocation,
      neighborhoodAlarmId,
      ...alert
    } = data;
    // blockInactiveUser = lo verifica los guards de nest js
    // setCustomerId
    const { ALERTA_VECINAL_ID, ALERTA_EMITIDA_ID } =
      this.configService.get('uuids');

    const customer = await this.findCustomer(customerId);
    let customerSelected = customerId;

    // setActionUpdateAt
    let alertStateId = ALERTA_EMITIDA_ID;
    if (neighborhoodAlarmId) {
      alertStateId = ALERTA_VECINAL_ID;
    }

    await this.findAlertType(alertTypeId);

    // setAlertLocation
    const alertLocation = await this.setAlertLocation(customer.type, data);

    if (
      customer.type === CustomerType.government &&
      alertLocation.district !== customer.district
    ) {
      const customerFound = await this.findGovernmentCustomer(
        alertLocation,
        alertTypeId,
      );

      if (customerFound) {
        customerSelected = customerFound.id;
      }
    }

    let neighborhoodId;
    let contactsOnly;
    let parent:
      | Prisma.CustomerCreateNestedOneWithoutAlertParentsInput
      | undefined;

    if (customer.parentId && customer.type === CustomerType.business) {
      parent = {
        connect: {
          id: customer.parentId,
        },
      };
    }
    if (customer.type === CustomerType.government) {
      neighborhoodId = await this.setAlertNeighborhoodId(data);
      contactsOnly = await this.setAppMessage(userId, customerId);
    }

    const alertCreated = await this.prisma.alert.create({
      data: {
        ...alert,
        ...alertLocation,
        neighborhood: changeRelationTable(neighborhoodId),
        trialPeriod: customer.trialPeriod || undefined,
        geolocation: geolocation as unknown as Prisma.InputJsonObject,
        originalGeolocation:
          originalGeolocation as unknown as Prisma.InputJsonObject,
        geolocations: changeInputJsonObject(geolocations),
        neighborhoodAlarm: neighborhoodAlarmId
          ? {
              connect: {
                id: neighborhoodAlarmId,
              },
            }
          : undefined,
        alertType: {
          connect: {
            id: alertTypeId,
          },
        },
        user: {
          connect: {
            id: userId,
          },
        },
        parent,
        customer: {
          connect: {
            id: customerSelected,
          },
        },
        alertState: {
          connect: {
            id: alertStateId,
          },
        },
        alertStateUpdatedAt: new Date(),
      },
      include: {
        alertState: true,
        alertType: true,
        user: true,
      },
    });

    // create checkpoint. it needs alert.id
    await this.setFirstCheckpoint(alertCreated);

    // sendPushNotifications
    this.sendPushNotifications(alertCreated, customer.settings);

    // notify to firebase
    if (alertCreated.alertType.type !== 'arrived-well') {
      this.firebaseService.pushAlertFirebase(alertCreated);
    }
    this.getTraccarDevices(customer.integrations, alertCreated.id);
    this.getCybermapaDevices(customer.integrations, alertCreated.id);

    return {
      ...alertCreated,
      contactsOnly,
      user: {
        ...alertCreated.user,
        password: undefined,
      },
    };
  }

  async changeState(id: string, userId: string, data: ChangeStateAlertDto) {
    const { alertStateId, customerId, ...alert } = data;

    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        userPermissions: {
          include: {
            monitoringCustomers: true,
          },
        },
      },
    });

    if (!user) {
      throw new InternalServerErrorException(errorCodes.USER_NOT_FOUND);
    }

    const monitoringCustomers = user.userPermissions?.monitoringCustomers;
    let customer: string | undefined;

    if (user.customerId === customerId) {
      customer = user.customerId;
    }

    const existCustomer = monitoringCustomers?.find(
      (customer) => customer.customerId === customerId,
    );

    if (existCustomer) {
      customer = existCustomer.customerId;
    }

    if (!customer) {
      throw new UnprocessableEntityException(errorCodes.CUSTOMER_NOT_FOUND);
    }

    await this.existAlertState(alertStateId, customer);
    await this.existAlert(id, customer);

    const alertUpdated = await this.prisma.alert.update({
      where: {
        id,
      },
      data: {
        ...alert,
        alertStateUpdatedAt: new Date(),
        alertState: {
          connect: {
            id: alertStateId,
          },
        },
      },
      include: {
        alertType: true,
        user: true,
        alertState: true,
      },
    });

    // notification change state
    /*     if (alertUpdated.user.active) {
      await this.prisma.notification.create({
        data: {
          title: `Alerta de ${alertUpdated.alertType.name}`,
          description: `La alerta de ${alertUpdated.alertType.name} cambio de estado a ${alertUpdated.alertState.name}`,
          emergency: true,
          notificationType: NotificationType.user,
          toUsers: {
            createMany: {
              data: [
                {
                  userId: alertUpdated.user.id,
                },
              ],
            },
          },
          customer: {
            connect: {
              id: alertUpdated.customerId,
            },
          },
          user: {
            connect: {
              id: alertUpdated.user.id,
            },
          },
          alert: {
            connect: {
              id: alertUpdated.id,
            },
          },
          image: alertUpdated.user.image
            ? (alertUpdated.user.image as unknown as Prisma.InputJsonObject)
            : undefined,
        },
      });
      if (alertUpdated.user.pushId) {
        this.pushNotificationService.pushNotification(
          {
            title: `Alerta de ${alertUpdated.alertType.name}`,
            description: `La alerta de ${alertUpdated.alertType.name} cambio de estado a ${alertUpdated.alertState.name}`,
            data: {},
            channelId: 'alert-notifications',
          },
          [alertUpdated.user.pushId],
        );
      }
    } */

    // notify to firebase has been updated
    if (alertUpdated.alertType.type !== 'arrived-well') {
      this.firebaseService.updateAlertFirebase(alertUpdated);
    }
    return {
      ...alertUpdated,
      user: {
        ...alertUpdated.user,
        password: undefined,
      },
    };
  }

  async createCheckpoint(
    data: CheckpointDto & { alertId: string; customerId: string },
  ) {
    const { alertId, geolocation, customerId } = data;

    await this.existAlert(alertId, customerId);

    const checkpoint = await this.prisma.checkpoint.create({
      data: {
        geolocation: geolocation as unknown as Prisma.InputJsonObject,
        alert: {
          connect: {
            id: alertId,
          },
        },
      },
      include: {
        alert: true,
      },
    });

    this.firebaseService.pushAlertCheckpoint(checkpoint);

    return checkpoint;
  }

  async findAllCheckPoints(
    params: IPaginationArgs<Prisma.CheckpointFindManyArgs>,
  ) {
    const { includeCount, skip, take, ...findAllParams } = params;
    return this.paginate(
      'checkpoint',
      {
        ...findAllParams,
      },
      { includeCount, skip, take },
    );
  }

  async getStatistics(
    customerId: string,
    params: Pick<ListQueryArgsDto, 'where'>,
  ) {
    const { prisma } = this;
    const where = params.where || {};

    const count = await prisma.alert.count({ where });

    const customerIds: { customerId: string }[] = await validateCustomers(
      this.prisma,
      customerId,
      params.where,
    );

    // Total por tipo de alerta
    const totalByType = new Promise(async (resolve, reject) => {
      try {
        const types = await prisma.alertType.findMany({});
        const group = await prisma.alert.groupBy({
          by: ['alertTypeId'],
          where,
          orderBy: {
            alertTypeId: 'asc',
          },
          _count: {
            _all: true,
          },
        });

        const percentageByType = group.map(({ alertTypeId, _count }) => ({
          alertType: types.find((i) => i.id === alertTypeId)?.name,
          count: _count._all,
          percentage: (_count._all * 100) / count,
        }));

        resolve(percentageByType);
      } catch (err) {
        reject(err);
      }
    });

    // Total por estado de alerta (actionId => Action model)
    const totalByState = new Promise(async (resolve, reject) => {
      try {
        const states = await prisma.alertState.findMany({
          where: {
            OR: [{ customerId: null }, ...customerIds],
          },
        });

        const group = await prisma.alert.groupBy({
          by: ['alertStateId'],
          where,
          orderBy: {
            alertStateId: 'asc',
          },
          _count: {
            _all: true,
          },
        });

        const percentageByState = group.map(({ alertStateId, _count }) => ({
          alertState: states.find((i) => i.id === alertStateId)?.name,
          count: _count._all,
          percentage: (_count._all * 100) / count,
        }));

        resolve(percentageByState);
      } catch (err) {
        reject(err);
      }
    });

    // Total por localidad
    const totalByLocality = new Promise(async (resolve, reject) => {
      try {
        const customerLocation = await prisma.location.findMany({
          where: {
            type: 'locality',
            OR: customerIds,
          },
        });
        const group = await prisma.alert.groupBy({
          by: ['city'],
          where,
          orderBy: {
            city: 'asc',
          },
          _count: {
            _all: true,
          },
        });

        const percentageByLocality = group.map(({ city, _count }) => ({
          locality:
            customerLocation.find((i) => i.name === city)?.name || 'Otras',
          count: _count._all,
          percentage: (_count._all * 100) / count,
        }));

        const newArray = percentageByLocality.filter(
          (item) => item.locality !== 'Otras',
        );

        const newItem = {
          locality: 'Otras',
          count: percentageByLocality
            .filter((item) => item.locality === 'Otras')
            .reduce((prev, item) => prev + item.count, 0),
          percentage: percentageByLocality
            .filter((item) => item.locality === 'Otras')
            .reduce((prev, item) => prev + item.percentage, 0),
        };
        newArray.push(newItem);

        resolve(newArray);
      } catch (err) {
        reject(err);
      }
    });

    // Total por barrio
    const totalByNeighborhood = new Promise(async (resolve, reject) => {
      try {
        const neighborhoods = await prisma.location.findMany({
          where: {
            type: 'neighborhood',
            OR: customerIds,
          },
        });

        const group = await prisma.alert.groupBy({
          by: ['neighborhoodId'],
          where,
          orderBy: {
            neighborhoodId: 'asc',
          },
          _count: {
            _all: true,
          },
        });

        const percentageByNeighborhood = group.map(
          ({ neighborhoodId, _count }) => ({
            neighborhood:
              neighborhoods.find((i) => i.id === neighborhoodId)?.name ||
              'Otras',
            count: _count._all,
            percentage: (_count._all * 100) / count,
          }),
        );

        const newArray = percentageByNeighborhood.filter(
          (item) => item.neighborhood !== 'Otras',
        );
        const newItem = {
          neighborhood: 'Otras',
          count: percentageByNeighborhood
            .filter(
              (item) => item.neighborhood === 'Otras' || !item.neighborhood,
            )
            .reduce((prev, item) => prev + item.count, 0),
          percentage: percentageByNeighborhood
            .filter((item) => item.neighborhood === 'Otras')
            .reduce((prev, item) => prev + item.percentage, 0),
        };
        newArray.push(newItem);

        resolve(newArray);
      } catch (err) {
        reject(err);
      }
    });

    const values = await Promise.all([
      totalByType,
      totalByState,
      totalByLocality,
      totalByNeighborhood,
    ]);

    return {
      totalByType: values[0],
      totalByState: values[1],
      totalByLocality: values[2],
      totalByNeighborhood: values[3],
      total: count,
    };
  }
}
