import '../__test__/winston';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@src/database/prisma.service';
import { PrismaServiceMock } from '@src/database/mocks/prisma.service';
import { mockDeep } from 'jest-mock-extended';
import { ConfigurationService } from './configuration.service';
import { PubSub, Topic } from '@google-cloud/pubsub';
import { ConfigModule } from '@nestjs/config';
import { Customer } from '@prisma/client';

jest.mock('@google-cloud/pubsub');

describe('ConfigurationService', () => {
  let service: ConfigurationService;
  let prisma: PrismaServiceMock;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [
            () => ({
              firebase: {
                projectId: '',
              },
            }),
          ],
        }),
      ],
      providers: [
        ConfigurationService,
        {
          provide: PrismaService,
          useValue: PrismaServiceMock,
        },
      ],
    }).compile();

    service = module.get<ConfigurationService>(ConfigurationService);
    prisma = module.get(PrismaService);
  });

  describe('csv', () => {
    it('execute pub sub', async () => {
      const topicMock = mockDeep<Topic>({
        publishMessage: jest.fn().mockImplementation((attributes) => {
          expect(attributes).toStrictEqual({
            attributes: {
              email: 'mgallego@sysgarage.com',
              utcOffset: '-180',
              where: JSON.stringify({
                id: 'un-id-uuid',
              }),
            },
          });
          return;
        }),
      });

      PubSub.prototype.topic = jest
        .fn()
        .mockImplementation((topicName: string) => {
          expect(topicName).toBe('reservation-csv-topic');
          return topicMock;
        });

      await service.onModuleInit();
      await service.generateCsv(
        {
          email: 'mgallego@sysgarage.com',
          where: {
            id: 'un-id-uuid',
          },
        },
        'reservation-csv-topic',
      );

      expect(PubSub.prototype.topic).toBeCalledTimes(1);
      expect(prisma.customer.findUnique).toBeCalledTimes(0);
      expect(topicMock.publishMessage).toBeCalledTimes(1);
    });

    it('execute pub sub with customerId and timezone', async () => {
      const topicMock = mockDeep<Topic>({
        publishMessage: jest.fn().mockImplementation((attributes) => {
          expect(attributes).toStrictEqual({
            attributes: {
              email: 'mgallego@sysgarage.com',
              utcOffset: '200',
              where: JSON.stringify({
                id: 'un-id-uuid',
                customerId: 'this-is-a-customer-id',
              }),
            },
          });
          return;
        }),
      });

      PubSub.prototype.topic = jest
        .fn()
        .mockImplementation((topicName: string) => {
          expect(topicName).toBe('reservation-csv-topic');
          return topicMock;
        });

      prisma.customer.findUnique.mockResolvedValueOnce(
        mockDeep<Customer>({
          timezone: '200',
        }),
      );

      await service.onModuleInit();
      await service.generateCsv(
        {
          email: 'mgallego@sysgarage.com',
          where: {
            id: 'un-id-uuid',
            customerId: 'this-is-a-customer-id',
          },
        },
        'reservation-csv-topic',
      );

      expect(PubSub.prototype.topic).toBeCalledTimes(1);
      expect(prisma.customer.findUnique).toBeCalledTimes(1);
      expect(topicMock.publishMessage).toBeCalledTimes(1);
    });
  });
});
