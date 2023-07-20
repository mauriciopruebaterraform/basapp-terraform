import '../../__test__/winston';
import {
  EventAuthorizationRequest,
  User,
  Customer,
  UserPermission,
  Notification,
} from '@prisma/client';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@src/database/prisma.service';
import { EventAuthorizationRequestService } from './event-authorization-requests.service';
import { PrismaServiceMock } from '@src/database/mocks/prisma.service';
import { mockDeep } from 'jest-mock-extended';
import { PushNotificationService } from '@src/push-notification/push-notification.service';
import { PushNotificationServiceMock } from '@src/push-notification/mocks/push-notification.service';
import { SmsService } from '@src/sms/sms.service';
import { SmsServiceMock } from '@src/sms/mocks/sms.service';
import { FirebaseService } from '@src/firebase/firebase.service';
import { FirebaseServiceMock } from '@src/firebase/mock/firebase.service';
import { EventsService } from '../events/events.service';
import { EventsServiceMock } from '../events/mocks/events.service';

describe('EventAuthorizationRequestService', () => {
  let service: EventAuthorizationRequestService;
  let prisma: PrismaServiceMock;
  let pushNotification: PushNotificationServiceMock;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventAuthorizationRequestService,
        {
          provide: PrismaService,
          useValue: PrismaServiceMock,
        },
        {
          provide: PushNotificationService,
          useValue: PushNotificationServiceMock,
        },
        {
          provide: SmsService,
          useValue: SmsServiceMock,
        },
        {
          provide: FirebaseService,
          useValue: FirebaseServiceMock,
        },
        {
          provide: EventsService,
          useValue: EventsServiceMock,
        },
      ],
    }).compile();

    service = module.get<EventAuthorizationRequestService>(
      EventAuthorizationRequestService,
    );
    pushNotification = module.get(PushNotificationService);
    prisma = module.get(PrismaService);
  });

  it('find all event authorization request', async () => {
    const mock = mockDeep<EventAuthorizationRequest>({
      id: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
      customerId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
    });

    prisma.eventAuthorizationRequest.findMany.mockResolvedValueOnce([mock]);
    prisma.eventAuthorizationRequest.count.mockResolvedValueOnce(1);
    const { results, pagination } = await service.findAll({});
    expect(results).toEqual([mock]);
    expect(pagination).toEqual({
      total: 1,
      take: 100,
      skip: 0,
      hasMore: false,
      size: 1,
    });
  });

  it('create event authorization request', async () => {
    const mockUser = mockDeep<
      User & {
        userPermissions: UserPermission;
        customer: Customer;
      }
    >({
      customerId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
      customer: {
        countryCode: '54',
      },
      userPermissions: {
        visitorsQueue: true,
        requestAuthorization: true,
        visitorsEventTypeId: '1234ee9a-401c-4cb0-8f0a-4a9ef4811e21',
      },
    });
    const mockNotification = mockDeep<Notification>({});
    const mockEventAuthorized = mockDeep<EventAuthorizationRequest>({
      sentBySms: true,
    });

    const mockAuthorizedUsers = mockDeep<User>({
      username: '1166480626',
    });
    prisma.user.findUnique.mockResolvedValueOnce(mockUser);
    prisma.user.findMany.mockResolvedValueOnce([mockAuthorizedUsers]);
    pushNotification.pushNotification.mockResolvedValue(true);
    prisma.eventAuthorizationRequest.create.mockResolvedValue(
      mockEventAuthorized,
    );
    prisma.notification.create.mockResolvedValueOnce(mockNotification);
    const results = await service.create({
      data: {
        lot: 'D1245',
        authorized: 'coto',
      },
      userId: '9a6178b1-6c31-44eb-9c12-60b966afd17d',
      customerId: 'ccc9baa6-bc4e-4575-8895-dce6313a3a94',
    });
    expect(results).toEqual(mockEventAuthorized);
  });
});
