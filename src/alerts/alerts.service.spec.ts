import '../__test__/winston';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@src/database/prisma.service';
import { AlertsService } from './alerts.service';
import { PrismaServiceMock } from '@src/database/mocks/prisma.service';
import { mockDeep } from 'jest-mock-extended';
import { ExternalService } from '@src/common/services/external.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import {
  AlertState,
  Checkpoint,
  Customer,
  CustomerSettings,
  User,
} from '@prisma/client';
import { Alert } from './entities/alert.entity';
import { ExternalServiceMock } from '@src/common/services/mocks/external.service';
import { FirebaseService } from '@src/firebase/firebase.service';
import { FirebaseServiceMock } from '@src/firebase/mock/firebase.service';
import { PushNotificationService } from '@src/push-notification/push-notification.service';
import { PushNotificationServiceMock } from '@src/push-notification/mocks/push-notification.service';
import { necochea460BOJ } from './mocks';
import { NeighborhoodService } from '@src/customers/neighborhood-alarm/neighborhood-alarm.service';
import { NeighborhoodServiceMock } from '@src/customers/neighborhood-alarm/mocks/neighborhood-alarm.service';
import { SmsService } from '@src/sms/sms.service';
import { SmsServiceMock } from '@src/sms/mocks/sms.service';

jest.mock('firebase-admin', () => {
  return {
    database: () => ({
      ref: () => ({
        child: () => ({
          push: () => null,
          set: () => null,
        }),
      }),
    }),
  };
});

describe('AlertsService', () => {
  let service: AlertsService;
  let prisma: PrismaServiceMock;
  let externalService: ExternalServiceMock;
  let pushNotification: PushNotificationServiceMock;
  let config: ConfigService;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule, HttpModule],
      providers: [
        AlertsService,
        {
          provide: ExternalService,
          useValue: ExternalServiceMock,
        },
        {
          provide: PrismaService,
          useValue: PrismaServiceMock,
        },
        {
          provide: FirebaseService,
          useValue: FirebaseServiceMock,
        },
        {
          provide: PushNotificationService,
          useValue: PushNotificationServiceMock,
        },
        {
          provide: NeighborhoodService,
          useValue: NeighborhoodServiceMock,
        },
        {
          provide: SmsService,
          useValue: SmsServiceMock,
        },
      ],
    }).compile();

    service = module.get<AlertsService>(AlertsService);
    pushNotification = module.get(PushNotificationService);
    externalService = module.get(ExternalService);
    prisma = module.get(PrismaService);
    config = module.get(ConfigService);
  });

  describe('customer alert', () => {
    it('find all alerts that customers get it', async () => {
      const alertMock = mockDeep<any>({
        id: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
        geolocation: {
          battery: {
            level: 0.49,
            is_charging: false,
          },
          network: 'wifi',
          timestamp: new Date('2022-04-27T03:11:56.656Z').getTime(),
          coords: {
            accuracy: 35,
            altitude: 94.36762619018555,
            altitudeAccuracy: 11.466069221496582,
            heading: -1,
            latitude: -36.2381446852903,
            longitude: -61.113571765609045,
            speed: -1,
          },
        },
        customerId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
      });

      const customer = mockDeep<Customer>({
        id: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
      });

      prisma.alert.groupBy.mockResolvedValueOnce([alertMock]);

      prisma.alert.findMany.mockResolvedValueOnce([alertMock]);
      prisma.alert.count.mockResolvedValueOnce(1);

      prisma.customer.findMany.mockResolvedValueOnce([customer]);

      const { results, pagination } = await service.findAll(
        {
          where: {
            customerId: {
              in: ['1111ee9a-401c-4cb0-8f0a-4a9ef4811e21'],
            },
          },
        },
        '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
      );
      expect(results).toEqual([alertMock]);
      expect(pagination).toEqual({
        total: 1,
        take: 100,
        skip: 0,
        hasMore: false,
        size: 1,
      });
    });

    it('find  alert by Id that customers get it', async () => {
      const alertMock = mockDeep<Alert>({
        id: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
        geolocation: {
          battery: {
            level: 0.49,
            is_charging: false,
          },
          network: 'wifi',
          timestamp: new Date('2022-04-27T03:11:56.656Z').getTime(),
          coords: {
            accuracy: 35,
            altitude: 94.36762619018555,
            altitudeAccuracy: 11.466069221496582,
            heading: -1,
            latitude: -36.2381446852903,
            longitude: -61.113571765609045,
            speed: -1,
          },
        },
        customerId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e32',
      });

      prisma.alert.findFirst.mockResolvedValueOnce(alertMock);
      prisma.alert.count.mockResolvedValueOnce(1);
      const results = await service.findOne(
        '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
        '1111ee9a-401c-4cb0-8f0a-4a9ef4811e32',
      );
      expect(results).toEqual(alertMock);
    });

    it('update state of alert', async () => {
      const alertMock = mockDeep<Alert>({
        id: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
        geolocation: {
          battery: {
            level: 0.49,
            is_charging: false,
          },
          network: 'wifi',
          timestamp: new Date('2022-04-27T03:11:56.656Z').getTime(),
          coords: {
            accuracy: 35,
            altitude: 94.36762619018555,
            altitudeAccuracy: 11.466069221496582,
            heading: -1,
            latitude: -36.2381446852903,
            longitude: -61.113571765609045,
            speed: -1,
          },
        },
        customerId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e32',
      });

      const userMock = mockDeep<User>({
        customerId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e32',
      });

      prisma.alert.update.mockResolvedValueOnce(alertMock);
      prisma.user.findUnique.mockResolvedValueOnce(userMock);
      pushNotification.pushNotification.mockResolvedValue(true);
      prisma.alert.count.mockResolvedValueOnce(1);
      prisma.alertState.count.mockResolvedValueOnce(1);

      const results = await service.changeState(
        '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
        '1111ee9a-401c-4cb0-8f0a-4a9ef4811e32',
        {
          alertStateId: '5e21523f-71cd-4802-bf24-b6a4016262aa',
          customerId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e32',
        },
      );

      const alertMockWIthUser = {
        ...alertMock,
        user: {
          ...alertMock.user,
          password: undefined,
        },
      };
      expect(results).toEqual(alertMockWIthUser);
    });

    it('create alert', async () => {
      config.get = jest.fn().mockReturnValue({
        ALERTA_EMITIDA_ID: '77732bfa-2cc0-439f-8126-b79621beda57',
        ALERTA_VECINAL_ID: '7e8cf066-f599-4fb4-9e58-b906cc4f9cbf',
      });
      const alertMock = mockDeep<Alert>({
        id: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
        geolocation: {
          battery: {
            level: 0.49,
            is_charging: false,
          },
          network: 'wifi',
          timestamp: new Date('2022-04-27T03:11:56.656Z').getTime(),
          coords: {
            accuracy: 35,
            altitude: 94.36762619018555,
            altitudeAccuracy: 11.466069221496582,
            heading: -1,
            latitude: -36.2381446852903,
            longitude: -61.113571765609045,
            speed: -1,
          },
        },
        parentId: '6ab296df-1de6-4e8f-97b4-675e5f9d1f5e',
        alertType: {
          type: 'perimeter-violation',
        },
        customerId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e32',
      });
      const cyberMapResponse = async (url, user, pass, action) => {
        if (action === 'GETVEHICULOS') {
          return [
            {
              id: 'b3c2961b-88fb-4121-8e10-ba08a456addf',
              descripcion: 'Auto%20Amarillo',
            },
          ];
        }

        return [
          {
            gps_id: 'b3c2961b-88fb-4121-8e10-ba08a456addf',
            alias: 'patasola',
            gps: 'si',
            fecha: '11/02/2023',
            sentido: 'drecho',
            velocidad: '80km',
            evento: 'un evento',
            parking_activado: '120km',
            parking_distancia: '20km',
            latitud: '-36.2381446852903',
            longitud: '-61.113571765609045',
            nombre: 'mauricio gallego',
            patente: 'AA979KD',
          },
        ];
      };
      const alertState = mockDeep<AlertState>();
      const customer = mockDeep<Customer & { settings: CustomerSettings }>({
        parentId: '6ab296df-1de6-4e8f-97b4-675e5f9d1f5e',
        type: 'business',
        settings: {
          additionalNotifications: '',
          perimeterViolationNumbers: '',
        },
      });

      prisma.customer.findFirst.mockResolvedValueOnce(customer);
      prisma.alertState.findFirst.mockResolvedValueOnce(alertState);
      prisma.alertType.count.mockResolvedValueOnce(1);
      prisma.alert.create.mockResolvedValueOnce(alertMock);
      prisma.contact.findMany.mockResolvedValueOnce([]);
      prisma.user.findMany.mockResolvedValueOnce([]);
      pushNotification.pushNotification.mockResolvedValue(true);
      externalService.getCyberMapa.mockImplementation(cyberMapResponse);
      externalService.getTraccarDevices.mockResolvedValueOnce(
        JSON.stringify([
          {
            status: 'online',
            id: 'f285f646-152c-48fb-8727-32883a401d00',
            model: 'iphone',
            uniqueId: '7e501061-fdb1-42c3-b8eb-0356b9db2554',
            name: 'mauricio',
            category: 'bonito',
          },
          {
            status: 'offline',
            id: '691a7ffe-9126-488b-afb3-3987d2d9b1b4',
            model: 'alcatel',
            uniqueId: '7e501061-fdb1-42c3-b8eb-0356b9db2554',
            name: 'guillermo',
            category: 'feo',
          },
        ]),
      );
      externalService.getTraccarPositions.mockResolvedValueOnce(
        JSON.stringify([
          {
            deviceId: 'f285f646-152c-48fb-8727-32883a401d00',
            latitude: 15,
            longitude: 20,
            accuracy: 0,
            speed: 0,
            attributes: {},
          },
        ]),
      );

      externalService.getCyberMapa.mockImplementation(
        async (url, user, pass, action) => {
          if (action === 'GETVEHICULOS') {
            return [
              {
                id: 'b3c2961b-88fb-4121-8e10-ba08a456addf',
                descripcion: 'Auto%20Amarillo',
              },
            ];
          }

          return [
            {
              gps_id: 'b3c2961b-88fb-4121-8e10-ba08a456addf',
              alias: 'patasola',
              gps: 'si',
              fecha: '11/02/2023',
              sentido: 'drecho',
              velocidad: '80km',
              evento: 'un evento',
              parking_activado: '120km',
              parking_distancia: '20km',
              latitud: '-36.2381446852903',
              longitud: '-61.113571765609045',
              nombre: 'mauricio gallego',
              patente: 'AA979KD',
            },
          ];
        },
      );
      externalService.reverseGeocoding.mockResolvedValueOnce(necochea460BOJ);

      const results = await service.create({
        alertTypeId: '5e21523f-71cd-4802-bf24-b6a4016262aa',
        geolocation: {
          battery: {
            level: 0.49,
            is_charging: false,
          },
          network: 'wifi',
          timestamp: new Date('2022-04-27T03:11:56.656Z').getTime(),
          coords: {
            accuracy: 35,
            altitude: 94.36762619018555,
            altitudeAccuracy: 11.466069221496582,
            heading: -1,
            latitude: -36.2381446852903,
            longitude: -61.113571765609045,
            speed: -1,
          },
        },
        geolocations: [
          {
            battery: {
              level: 0.49,
              is_charging: false,
            },
            network: 'wifi',
            timestamp: new Date('2022-04-27T03:11:56.656Z').getTime(),
            coords: {
              accuracy: 35,
              altitude: 94.36762619018555,
              altitudeAccuracy: 11.466069221496582,
              heading: -1,
              latitude: -36.2381446852903,
              longitude: -61.113571765609045,
              speed: -1,
            },
          },
        ],
        userId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
        customerId: 'b0273fda-1977-469e-b376-sdf123sgd',
      });

      expect(results).toBeInstanceOf(Object);
      expect(results).toEqual({
        ...alertMock,
        user: {
          ...alertMock.user,
          customerType: undefined,
          password: undefined,
        },
        contactsOnly: undefined,
      });
    });

    it('create checkpoint', async () => {
      const mockCheckpoint = mockDeep<Checkpoint>({
        id: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
        geolocation: {
          battery: {
            level: 0.49,
            is_charging: false,
          },
          network: 'wifi',
          timestamp: new Date('2022-04-27T03:11:56.656Z').getTime(),
          coords: {
            accuracy: 35,
            altitude: 94.36762619018555,
            altitudeAccuracy: 11.466069221496582,
            heading: -1,
            latitude: -36.2381446852903,
            longitude: -61.113571765609045,
            speed: -1,
          },
        },
        alertId: '5e21523f-71cd-4802-bf24-b6a4016262aa',
      });

      prisma.alert.count.mockResolvedValueOnce(1);
      prisma.checkpoint.create.mockResolvedValueOnce(mockCheckpoint);

      const results = await service.createCheckpoint({
        alertId: '5e21523f-71cd-4802-bf24-b6a4016262aa',
        geolocation: {
          battery: {
            level: 0.49,
            is_charging: false,
          },
          network: 'wifi',
          timestamp: new Date('2022-04-27T03:11:56.656Z').getTime(),
          coords: {
            accuracy: 35,
            altitude: 94.36762619018555,
            altitudeAccuracy: 11.466069221496582,
            heading: -1,
            latitude: -36.2381446852903,
            longitude: -61.113571765609045,
            speed: -1,
          },
        },
        customerId: 'b0273fda-1977-469e-b376-sdf123sgd',
      });
      expect(results).toEqual(mockCheckpoint);
    });
  });
});
