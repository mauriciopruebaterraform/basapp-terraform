import '../__test__/winston';
import { Test, TestingModule } from '@nestjs/testing';
import { AlertsController } from './alerts.controller';
import { AlertsModule } from './alerts.module';
import { AlertsService } from './alerts.service';
import { PrismaService } from '@src/database/prisma.service';
import { PrismaServiceMock } from '@src/database/mocks/prisma.service';
import { mockDeep } from 'jest-mock-extended';
import { AlertsServiceMock } from './mocks/alerts.service';
import { ExternalService } from '@src/common/services/external.service';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { Alert } from './entities/alert.entity';
import { Checkpoint } from '@prisma/client';
import { PushNotificationModule } from '@src/push-notification/push-notification.module';
import { FirebaseModule } from '@src/firebase/firebase.module';
import configuration from '@src/config/configuration';
import { ConfigurationModule } from '@src/configuration/configuration.module';
import { DatabaseModule } from '@src/database/database.module';
import { NeighborhoodService } from '@src/customers/neighborhood-alarm/neighborhood-alarm.service';
import { NeighborhoodServiceMock } from '@src/customers/neighborhood-alarm/mocks/neighborhood-alarm.service';

describe('AlertsController', () => {
  let controller: AlertsController;
  let service: AlertsServiceMock;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        AlertsModule,
        ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
        HttpModule,
        PushNotificationModule,
        FirebaseModule,
        ConfigurationModule,
        DatabaseModule,
      ],
      controllers: [AlertsController],
      providers: [ExternalService],
    })
      .overrideProvider(PrismaService)
      .useValue(PrismaServiceMock)
      .overrideProvider(AlertsService)
      .useValue(AlertsServiceMock)
      .overrideProvider(NeighborhoodService)
      .useValue(NeighborhoodServiceMock)
      .compile();

    controller = module.get<AlertsController>(AlertsController);
    service = module.get(AlertsService);
  });

  it('should return a list of alerts', async () => {
    const customerAlerts: Alert[] = mockDeep<Alert[]>([
      {
        id: '4e3f8f9b-4b5f-b8e9-f8c1b5f8e9f8',
        geolocation: JSON.stringify({
          lat: '-34.473163',
          lng: '-58.513503',
        }),
        customerId: 'f8c1-b8e9-4b5f-b8e9-f8c1b5f8e9f8',
      },
      {
        id: '4e3f8f9b-f8c1-4b5f-b8e9-f8c1b5f8e9f9',
        geolocation: JSON.stringify({
          lat: '-34.473163',
          lng: '-58.513503',
        }),
        customerId: 'b8e9-dd-f8c1-4b5f-b8e9-asd',
      },
      {
        id: '4e3f8f9b-f8c1-4b5f-b8e9-f8c1b5f8e9f10',
        geolocation: JSON.stringify({
          lat: '-34.473163',
          lng: '-58.513503',
        }),
        customerId: 'b8e9-f8c1b5f8e9f8-sdf-4b5f-sdf-sdf',
      },
      {
        id: '4e3f8f9b-f8c1-4b5f-b8e9-f8c1b5f8e9f11',
        geolocation: JSON.stringify({
          lat: '-34.473163',
          lng: '-58.513503',
        }),
        customerId: 'b8e9-dfsdfsd-f8c1-4b5f-b8e9-f8c1b5f8e9f8',
      },
    ]);

    service.findAll.mockResolvedValueOnce({
      results: customerAlerts,
      pagination: {
        total: 4,
        size: 4,
        skip: 0,
        take: 10,
      },
    });

    const { results, pagination } = await controller.findAll(
      {
        user: {
          id: 'b0273fda-1977-469e-b376-6b49cceb0a6f',
          customerId: 'b0273fda-1977-469e-b376-sdf123sgd',
          role: 'admin',
        },
      },
      {},
    );
    expect(results).toBeDefined();
    expect(results).toBeInstanceOf(Array);
    expect(results.length).toBe(4);

    results.forEach((item) => {
      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('geolocation');
      expect(item).toHaveProperty('alertTypeId');
      expect(item).toHaveProperty('approximateAddress');
      expect(item).toHaveProperty('alertStateId');
      expect(item).toHaveProperty('geolocations');
      expect(item).toHaveProperty('createdAt');
      expect(item).toHaveProperty('updatedAt');
      expect(item).toHaveProperty('userId');
      expect(item).toHaveProperty('alertStateUpdatedAt');
      expect(item).toHaveProperty('customerId');
      expect(item).toHaveProperty('parentId');
      expect(item).toHaveProperty('trialPeriod');
    });

    expect(pagination).toBeDefined();
    expect(pagination).toBeInstanceOf(Object);
    expect(pagination).toEqual({
      size: customerAlerts.length,
      total: customerAlerts.length,
      take: 10,
      skip: 0,
    });
  });

  it('should return a alert by Id', async () => {
    const customerAlerts: Alert = mockDeep<Alert>({
      id: '4e3f8f9b-4b5f-b8e9-f8c1b5f8e9f8',
      geolocation: JSON.stringify({
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
      }),
      customerId: 'f8c1-b8e9-4b5f-b8e9-f8c1b5f8e9f8',
    });

    service.findOne.mockResolvedValueOnce(customerAlerts);

    const results = await controller.findOne(
      {
        user: {
          id: 'b0273fda-1977-469e-b376-6b49cceb0a6f',
          customerId: 'b0273fda-1977-469e-b376-sdf123sgd',
          role: 'admin',
        },
      },
      'b0273fda-1977-469e-b376-6b49cceb0a6f',
      {},
    );
    expect(results).toStrictEqual(customerAlerts);
  });

  it('should update state of alert by Id', async () => {
    const customerAlerts: Alert = mockDeep<Alert>({
      id: '4e3f8f9b-4b5f-b8e9-f8c1b5f8e9f8',
      alertStateId: '5e21523f-71cd-4802-bf24-b6a4016262aa',
      geolocation: JSON.stringify({
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
      }),
      customerId: 'f8c1-b8e9-4b5f-b8e9-f8c1b5f8e9f8',
    });

    const alertMocked = {
      ...customerAlerts,
      user: {
        ...customerAlerts.user,
        password: undefined,
      },
    };
    service.changeState.mockResolvedValueOnce(alertMocked);

    const results = await controller.updateState(
      {
        user: {
          id: 'b0273fda-1977-469e-b376-6b49cceb0a6f',
          customerId: 'b0273fda-1977-469e-b376-sdf123sgd',
          role: 'admin',
        },
      },
      'b0273fda-1977-469e-b376-6b49cceb0a6f',
      {
        alertStateId: '5e21523f-71cd-4802-bf24-b6a4016262aa',
        customerId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e32',
      },
    );
    expect(results).toStrictEqual(alertMocked);
  });

  it('should create alert', async () => {
    const customerAlerts = mockDeep<Alert>({
      id: '4e3f8f9b-4b5f-b8e9-f8c1b5f8e9f8',
      alertTypeId: '5e21523f-71cd-4802-bf24-b6a4016262aa',
      geolocation: JSON.stringify({
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
      }),
      customerId: 'f8c1-b8e9-4b5f-b8e9-f8c1b5f8e9f8',
    });

    const mockServiceCreate = {
      ...customerAlerts,
      user: {
        ...customerAlerts.user,
        password: undefined,
      },
      contactsOnly: undefined,
    };
    service.create.mockResolvedValueOnce(mockServiceCreate);

    const results = await controller.create(
      {
        user: {
          id: 'b0273fda-1977-469e-b376-6b49cceb0a6f',
          customerId: 'b0273fda-1977-469e-b376-sdf123sgd',
          role: 'admin',
        },
      },
      {
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
      },
    );
    expect(results).toBeInstanceOf(Object);
    expect(results).toStrictEqual(mockServiceCreate);
  });

  it('should create checkpoint', async () => {
    const mock = mockDeep<Checkpoint & { alert: Alert }>({
      alertId: '5e21523f-71cd-4802-bf24-b6a4016262aa',
      geolocation: JSON.stringify({
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
      }),
    });

    service.createCheckpoint.mockResolvedValueOnce(mock);

    const results = await controller.createCheckpoint(
      {
        user: {
          id: 'b0273fda-1977-469e-b376-6b49cceb0a6f',
          customerId: 'b0273fda-1977-469e-b376-sdf123sgd',
          role: 'user',
        },
      },
      '5e21523f-71cd-4802-bf24-b6a4016262aa',
      {
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
      },
    );
    expect(results).toStrictEqual(mock);
  });
});
