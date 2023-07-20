import '../../__test__/winston';
import { AuthorizedUser, AuthorizedUserReservationType } from '@prisma/client';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@src/database/prisma.service';
import { AuthorizedUsersService } from './authorized-users.service';
import { PrismaServiceMock } from '@src/database/mocks/prisma.service';
import { mock, mockDeep } from 'jest-mock-extended';
import { CsvModule } from 'nest-csv-parser';
import * as fs from 'fs';

describe('AuthorizedUsersService', () => {
  let service: AuthorizedUsersService;
  let prisma: PrismaServiceMock;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [CsvModule],
      providers: [
        AuthorizedUsersService,
        {
          provide: PrismaService,
          useValue: PrismaServiceMock,
        },
      ],
    }).compile();

    service = module.get<AuthorizedUsersService>(AuthorizedUsersService);
    prisma = module.get(PrismaService);
  });

  describe('customer authorized users', () => {
    it('find all authorized-users that customers get it', async () => {
      const authorizedUserMock = mockDeep<AuthorizedUser>({
        id: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
        updatedById: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
        active: true,
        customerId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
      });

      prisma.authorizedUser.findMany.mockResolvedValueOnce([
        authorizedUserMock,
      ]);
      prisma.authorizedUser.count.mockResolvedValueOnce(1);
      const { results, pagination } = await service.findAll({});
      expect(results).toEqual([authorizedUserMock]);
      expect(pagination).toEqual({
        total: 1,
        take: 100,
        skip: 0,
        hasMore: false,
        size: 1,
      });
    });
    it('should create authorized users', async () => {
      const customerLotMock = mockDeep<
        AuthorizedUser & { reservationTypes: AuthorizedUserReservationType[] }
      >({
        id: '4e3f8f9b-4b5f-b8e9-f8c1b5f8e9f8',
        firstName: 'mauricio',
        username: '193828434',
        customerId: 'f8c1-b8e9-4b5f-b8e9-f8c1b5f8e9f8',
      });

      prisma.reservationType.count.mockResolvedValueOnce(1);
      prisma.authorizedUser.count.mockResolvedValueOnce(0);
      prisma.authorizedUser.create.mockResolvedValueOnce(customerLotMock);

      const result = await service.create({
        firstName: 'mauricio',
        username: '193828434',
        customerId: 'f8c1-b8e9-4b5f-b8e9-f8c1b5f8e9f8',
        userId: 'cf349f67-dc3d-4585-8cda-b04d6966be41',
      });

      expect(result).toMatchObject(customerLotMock);
    });
    it('update authorized users', async () => {
      const mock = mockDeep<
        AuthorizedUser & { reservationTypes: AuthorizedUserReservationType[] }
      >({
        id: 'e2afa0ab-95d8-4b2a-bc00-6afbe0024145',
        updatedById: '70df3d00-b373-4fe8-bbcc-aa98ade885dd',
        active: false,
        customerId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
        username: '12356425',
      });

      prisma.authorizedUser.findFirst.mockResolvedValueOnce(mock);
      prisma.authorizedUser.update.mockResolvedValueOnce(mock);

      const result = await service.update(
        'e2afa0ab-95d8-4b2a-bc00-6afbe0024145',
        {
          active: false,
          customerId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
          userId: '70df3d00-b373-4fe8-bbcc-aa98ade885dd',
          username: '12356425',
        },
      );

      expect(result).toMatchObject(mock);
    });

    it('should import many authorized users', async () => {
      const buffer = Buffer.from(
        fs.readFileSync(`${__dirname}/mocks/authorized-users.csv`),
      );
      const file = mock<Express.Multer.File>({
        originalname: 'authorized-users.csv',
        mimetype: 'text/csv',
      });

      prisma.authorizedUser.createMany.mockResolvedValueOnce({ count: 2 });
      prisma.authorizedUser.findMany.mockResolvedValueOnce([]);
      const result = await service.loadCsv(
        { ...file, buffer },
        {
          customerId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
          userId: '23435ee9a-401c-4cb0-8f0a-4a9ef4811e21',
        },
      );

      expect(result).toStrictEqual({ count: 2 });
    });
  });
});
