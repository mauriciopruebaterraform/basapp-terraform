import '../../__test__/winston';
import { Reservation } from '@prisma/client';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@src/database/prisma.service';
import { ReservationService } from './reservations.service';
import { PrismaServiceMock } from '@src/database/mocks/prisma.service';
import { mockDeep } from 'jest-mock-extended';
import { AuthorizedUser } from '../authorized-users/entities/authorized-user.entity';
import { User } from '@src/users/entities/user.entity';
import { PushNotificationService } from '@src/push-notification/push-notification.service';
import { PushNotificationServiceMock } from '@src/push-notification/mocks/push-notification.service';
import { ConfigurationService } from '@src/configuration/configuration.service';
import { ConfigService } from '@nestjs/config';
import { ConfigurationServiceMock } from '@src/configuration/mocks/configuration.service';

describe('ReservationService', () => {
  let service: ReservationService;
  let config: ConfigService;
  let prisma: PrismaServiceMock;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReservationService,
        ConfigurationService,
        ConfigService,
        {
          provide: PrismaService,
          useValue: PrismaServiceMock,
        },
        {
          provide: ConfigurationService,
          useValue: ConfigurationServiceMock,
        },
        {
          provide: PushNotificationService,
          useValue: PushNotificationServiceMock,
        },
      ],
    }).compile();

    service = module.get<ReservationService>(ReservationService);
    config = module.get(ConfigService);
    prisma = module.get(PrismaService);
  });

  it('Get all reservation types from a customer', async () => {
    const mock = mockDeep<Reservation>({
      id: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
      customerId: '0589141d-ef1c-4c39-a8c7-30aef555003f',
      lot: 'DS1236',
      noUser: false,
      numberOfGuests: 2,
    });

    prisma.reservation.findMany.mockResolvedValueOnce([mock]);
    prisma.reservation.count.mockResolvedValueOnce(1);

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

  it('find a reservation that customers get it', async () => {
    const reservationMock = mockDeep<Reservation>({
      id: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
      customerId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
      lot: 'DS123467',
    });

    prisma.reservation.findFirst.mockResolvedValueOnce(reservationMock);
    const results = await service.findOne(
      '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
      '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
      {},
    );
    expect(results).toEqual(reservationMock);
  });

  it('last year reservation', async () => {
    const mockUser = mockDeep<User>({
      id: 'e533d614-17aa-480c-88c7-cbaee44f9ab9',
      customerId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
      username: '541166480626',
      authorizedUserId: 'a0e8fa7e-f7e4-49b8-9034-d65bb97db4a4',
    });

    const mockAuthorizedUser = mockDeep<AuthorizedUser>({
      id: 'a0e8fa7e-f7e4-49b8-9034-d65bb97db4a4',
      customerId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
      username: '541166480626',
    });
    prisma.user.findUnique.mockResolvedValueOnce(mockUser);
    prisma.authorizedUser.findFirst.mockResolvedValueOnce(mockAuthorizedUser);
    prisma.reservation.count.mockResolvedValueOnce(1);

    config.get = jest.fn().mockReturnValue({
      EMITIDO: '77732bfa-2cc0-439f-8126-b79621beda57',
      ATENDIDO: '7e8cf066-f599-4fb4-9e58-b906cc4f9cbf',
    });

    const results = await service.findLastYearReservations({
      reservationTypeId: '33757fc5-eb8a-47c2-89e3-9321245e579c',
      userId: 'e533d614-17aa-480c-88c7-cbaee44f9ab9',
    });

    expect(results).toMatchObject({
      count: 1,
    });
  });
});
