import '../../__test__/winston';
import {
  AuthorizedUser,
  AuthorizedUserReservationType,
  User,
} from '@prisma/client';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthorizedUsersController } from './authorized-users.controller';
import { AuthorizedUsersModule } from './authorized-users.module';
import { AuthorizedUsersService } from './authorized-users.service';
import { PrismaService } from '@src/database/prisma.service';
import { PrismaServiceMock } from '@src/database/mocks/prisma.service';
import { mock, mockDeep } from 'jest-mock-extended';
import { AuthorizedUsersServiceMock } from './mocks/authorized-users.service';
import { ConfigurationModule } from '@src/configuration/configuration.module';
import { DatabaseModule } from '@src/database/database.module';
import configuration from '@src/config/configuration';
import { ConfigModule } from '@nestjs/config';

describe('AuthorizedUsersController', () => {
  let controller: AuthorizedUsersController;
  let service: AuthorizedUsersServiceMock;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        AuthorizedUsersModule,
        ConfigurationModule,
        DatabaseModule,
        ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
      ],
      controllers: [AuthorizedUsersController],
    })
      .overrideProvider(PrismaService)
      .useValue(PrismaServiceMock)
      .overrideProvider(AuthorizedUsersService)
      .useValue(AuthorizedUsersServiceMock)
      .compile();

    controller = module.get<AuthorizedUsersController>(
      AuthorizedUsersController,
    );
    service = module.get(AuthorizedUsersService);
  });

  it('should return a list of customers authorized-users', async () => {
    const customerAuthorizedUsers: AuthorizedUser[] = mockDeep<
      AuthorizedUser[]
    >([
      {
        firstName: 'Fernando',
        lastName: 'Bello',
        username: '1150281459',
        lot: 'DS123456',
        description: null,
        sendEvents: true,
        active: false,
        expireDate: null,
        isOwner: true,
      },
      {
        firstName: 'Nerina',
        lastName: 'Capital',
        username: '1123199052',
        lot: '',
        description: null,
        sendEvents: true,
        expireDate: null,
        isOwner: true,
      },
      {
        firstName: 'Gonzalo',
        lastName: 'Buszmicz',
        username: '3413077090',
        lot: null,
        description: null,
        sendEvents: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        expireDate: null,
        isOwner: true,
      },
      {
        firstName: 'Mauricio',
        lastName: 'Gallego',
        username: '1166480626',
        lot: '',
        description: null,
        sendEvents: true,
        expireDate: null,
        isOwner: true,
      },
    ]);

    service.findAll.mockResolvedValueOnce({
      results: customerAuthorizedUsers,
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
      'b0273fda-1977-469e-b376-sdf123sgd',
      {},
    );
    expect(results).toBeDefined();
    expect(results).toBeInstanceOf(Array);
    expect(results.length).toBe(4);

    results.forEach((item) => {
      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('firstName');
      expect(item).toHaveProperty('lastName');
      expect(item).toHaveProperty('username');
      expect(item).toHaveProperty('lot');
      expect(item).toHaveProperty('description');
      expect(item).toHaveProperty('sendEvents');
      expect(item).toHaveProperty('active');
      expect(item).toHaveProperty('customerId');
      expect(item).toHaveProperty('updatedById');
      expect(item).toHaveProperty('createdAt');
      expect(item).toHaveProperty('updatedAt');
      expect(item).toHaveProperty('updatedAt');
      expect(item).toHaveProperty('isOwner');
    });

    expect(pagination).toBeDefined();
    expect(pagination).toBeInstanceOf(Object);
    expect(pagination).toEqual({
      size: customerAuthorizedUsers.length,
      total: customerAuthorizedUsers.length,
      take: 10,
      skip: 0,
    });
  });

  it('should create authorized users', async () => {
    expect(controller.create).toBeDefined();

    const Mock = mockDeep<
      AuthorizedUser & { reservationTypes: AuthorizedUserReservationType[] }
    >({
      id: '1111ee9a-401c-4cb0-8f0a-8f653eaa848a',
      active: true,
      username: '193828434',
      firstName: 'mauricio',
      customerId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
    });

    service.create.mockResolvedValueOnce(Mock);

    const result = await controller.create(
      {
        user: {
          id: '86218e15-d405-4e1b-9955-947922474b1c',
          customerId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
        },
      },
      '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
      {
        firstName: 'mauricio',
        username: '193828434',
      },
    );

    expect(result).toStrictEqual(Mock);
  });

  it('should update authorized users', async () => {
    expect(controller.update).toBeDefined();

    const Mock = mockDeep<
      AuthorizedUser & {
        reservationTypes: AuthorizedUserReservationType[];
        userAuthorizedUser: User[];
      }
    >({
      id: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
      updatedById: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
      active: false,
      customerId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
    });

    service.update.mockResolvedValueOnce(Mock);

    const result = await controller.update(
      {
        user: {
          id: '234-234-234-234',
          customerId: 'e2afa0ab-95d8-4b2a-bc00-6afbe0024145',
        },
      },
      '86218e15-d405-4e1b-9955-947922474b1c',
      'e2afa0ab-95d8-4b2a-bc00-6afbe0024145',
      {
        active: false,
      },
    );

    expect(result).toMatchObject(Mock);
  });

  it('should create many authorized users', async () => {
    const file = mock<Express.Multer.File>({
      buffer: Buffer.from('file.csv'),
    });

    service.loadCsv.mockResolvedValueOnce({ count: 1 });
    const result = await controller.importAuthorizedUsers(
      {
        user: {
          id: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
          customerId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
        },
      },
      '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
      file,
    );

    expect(result).toEqual({ count: 1 });
  });
});
