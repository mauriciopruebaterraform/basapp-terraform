import '../../__test__/winston';
import { Test, TestingModule } from '@nestjs/testing';
import { HttpModule } from '@nestjs/axios';
import {
  PrismaService,
  PrismaGirovisionService,
} from '@src/database/prisma.service';
import {
  PrismaServiceMock,
  PrismaGirovisionServiceMock,
} from '@src/database/mocks/prisma.service';
import { mockDeep } from 'jest-mock-extended';
import { EventsService } from './events.service';
import {
  EventState,
  User,
  Notification,
  Customer,
  CustomerIntegration,
} from '@prisma/client';
import { PushNotificationService } from '@src/push-notification/push-notification.service';
import { PushNotificationServiceMock } from '@src/push-notification/mocks/push-notification.service';
import { ConfigService } from '@nestjs/config';
import { Event } from './entities/event.entity';
import { Lot } from '../lots/entities/lot.entity';
import { FirebaseService } from '@src/firebase/firebase.service';
import { FirebaseServiceMock } from '@src/firebase/mock/firebase.service';
import { ReservationServiceMock } from '../reservations/mocks/reservations.service';
import { ReservationService } from '../reservations/reservations.service';
import { ExternalService } from '@src/common/services/external.service';
import { ExternalServiceMock } from '@src/common/services/mocks/external.service';

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

describe('EventsService', () => {
  let service: EventsService;
  let prisma: PrismaServiceMock;
  let pushNotification: PushNotificationServiceMock;
  let externalService: ExternalServiceMock;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        {
          provide: PrismaService,
          useValue: PrismaServiceMock,
        },
        {
          provide: PrismaGirovisionService,
          useValue: PrismaGirovisionServiceMock,
        },
        ConfigService,
        {
          provide: FirebaseService,
          useValue: FirebaseServiceMock,
        },
        {
          provide: PushNotificationService,
          useValue: PushNotificationServiceMock,
        },
        {
          provide: ExternalService,
          useValue: ExternalServiceMock,
        },
        {
          provide: ReservationService,
          useValue: ReservationServiceMock,
        },
      ],
      imports: [HttpModule],
    }).compile();

    service = module.get<EventsService>(EventsService);
    pushNotification = module.get(PushNotificationService);
    prisma = module.get(PrismaService);
    externalService = module.get(ExternalService);
  });

  describe('customer event', () => {
    it('find all event that customers get it', async () => {
      const eventMock = mockDeep<Event>({
        id: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
        customerId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
        from: new Date('2020-04-22 03:00:00'),
        to: new Date('2020-04-23 02:59:00'),
        fullName: 'Nerina Serra',
        description: '',
        lot: 'DS123467',
        changeLog: '[]',
      });

      prisma.event.findMany.mockResolvedValueOnce([eventMock]);
      prisma.event.count.mockResolvedValueOnce(1);
      const { results, pagination } = await service.findAll({});
      expect(results).toEqual([eventMock]);
      expect(pagination).toEqual({
        total: 1,
        take: 100,
        skip: 0,
        hasMore: false,
        size: 1,
      });
    });
    it('find an event that customers get it', async () => {
      const eventMock = mockDeep<Event>({
        id: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
        customerId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
        from: new Date('2020-04-22 03:00:00'),
        to: new Date('2020-04-23 02:59:00'),
        fullName: 'Nerina Serra',
        description: '',
        lot: 'DS123467',
        changeLog: '[]',
      });

      prisma.event.findFirst.mockResolvedValueOnce(eventMock);
      const results = await service.findOne(
        '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
        '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
        {},
      );
      expect(results).toEqual(eventMock);
    });
    it('update an event that customers get it', async () => {
      const eventMock = mockDeep<Event>({
        id: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
        customerId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
        from: new Date('2020-04-22 03:00:00'),
        to: new Date('2020-04-23 02:59:00'),
        fullName: 'Nerina Serra',
        description: '',
        lot: 'DS123467',
        changeLog: '[]',
        eventType: {
          additionalNotifications: '',
        },
      });

      const notificationMock = mockDeep<Notification>({
        title: 'Evento de visita',
        description:
          'Su evento informando a pepito cambio de estado a Cancelado',
      });
      const eventStateMock = mockDeep<EventState>({
        name: 'EMITIDO',
      });

      const userMock = mockDeep<User>({
        username: '112233124',
      });
      prisma.event.findFirst.mockResolvedValueOnce(eventMock);
      prisma.notification.create.mockResolvedValueOnce(notificationMock);
      prisma.eventState.findFirst.mockResolvedValueOnce(eventStateMock);
      prisma.user.findFirst.mockResolvedValueOnce(userMock);
      pushNotification.pushNotification.mockResolvedValue(true);
      prisma.event.update.mockResolvedValueOnce(eventMock);

      const results = await service.eventUpdateState(
        {
          observations: 'se cambio el evento',
          eventStateId: '70df3d00-b373-4fe8-bbcc-aa38ade885dd',
        },
        '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
        '70df3d00-b373-4fe8-bbcc-aa98ade885dd',
        '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
      );
      expect(results).toEqual(eventMock);
    });

    it('find an event by token', async () => {
      const eventMock = mockDeep<Event>({
        id: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
        customerId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
        from: new Date('2020-04-22 03:00:00'),
        to: new Date('2020-04-23 02:59:00'),
        patent: null,
        fullName: 'Nerina Serra',
        description: '',
        qrCode: 'qr-dode',
        qrPending: false,
        lot: 'DS123467',
        changeLog: '[]',
        token: 'string-token-event',
        customer: {
          timezone: '-180',
          name: 'san fernando',
        },
        user: {
          fullName: 'Camilo',
        },
        eventType: {
          id: 'ef6067b2-1785-4765-8b69-474bb8896615',
          title: 'Visita',
        },
        eventState: {
          id: '5589f08e-c997-4c6c-b33f-1eff852cb2f2',
          name: 'EMITIDO',
        },
      });

      const lotMock = mockDeep<Lot>({
        id: 'b7c0ef51-2cfc-4021-aa80-93fe88cae401',
        lot: 'DS123467',
        latitude: '23.234234',
        longitude: '2.4234',
        active: true,
        isArea: true,
      });
      prisma.event.findFirst.mockResolvedValueOnce(eventMock);
      prisma.lot.findFirst.mockResolvedValueOnce(lotMock);

      const results = await service.findByToken('string-token-event');
      expect(results).toEqual({
        eventId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
        eventType: eventMock.eventType,
        eventState: eventMock.eventState,
        qrCode: 'qr-dode',
        qrPending: false,
        patent: null,
        message:
          'Camilo te envió esta invitación a san fernando para acceder el día 22/04/2020',
        lot: lotMock,
      });
    });

    describe('icm', () => {
      it('should reject finding customer', async () => {
        prisma.customer.findUnique.mockResolvedValueOnce(null);

        await expect(
          service.getIcmType('8bb6c166-f1b9-11ed-a05b-0242ac120003'),
        ).rejects.toThrow();
      });

      it('should reject without fields filled', async () => {
        const customerMock = mockDeep<
          Customer & { integrations: CustomerIntegration }
        >({
          id: '8bb6c166-f1b9-11ed-a05b-0242ac120003',
          integrations: {
            icmToken: null,
            icmUrl: null,
          },
        });

        prisma.customer.findUnique.mockResolvedValueOnce(customerMock);

        await expect(
          service.getIcmType('8bb6c166-f1b9-11ed-a05b-0242ac120003'),
        ).rejects.toThrow();
      });

      it('should response with a list', async () => {
        const customerMock = mockDeep<
          Customer & { integrations: CustomerIntegration }
        >({
          integrations: {
            icmToken: 'this-is-a-token',
            icmUrl: 'this-is-a-url',
          },
        });

        const mockExternal = [
          { Code: '01', Name: 'Pedidos Ya' },
          { Code: '02', Name: 'Glovo' },
          { Code: '03', Name: 'Rappi' },
          { Code: '04', Name: 'Helado' },
          { Code: '05', Name: 'Supermercado' },
        ];
        prisma.customer.findUnique.mockResolvedValueOnce(customerMock);
        externalService.getDeliveryTypes.mockResolvedValueOnce(mockExternal);
        const response = await service.getIcmType(
          '8bb6c166-f1b9-11ed-a05b-0242ac120003',
        );

        expect(response).toStrictEqual(mockExternal);
      });
    });
  });
});
