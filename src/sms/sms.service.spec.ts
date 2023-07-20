import '../__test__/winston';
import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { mockDeep } from 'jest-mock-extended';
import { SmsService } from './sms.service';
import AWS from 'aws-sdk';
import { ConfigService } from '@nestjs/config';
import { HttpServiceMock } from '@src/common/services/mocks/http.service';
import { PrismaService } from '@src/database/prisma.service';
import { PrismaServiceMock } from '@src/database/mocks/prisma.service';
import { SmsProvider } from '@prisma/client';
import { ConfigServiceMock } from './mocks/sms.service';
import { InternalServerErrorException } from '@nestjs/common';
import { GlobalConfigInstance } from 'aws-sdk/lib/config';

jest.mock('aws-sdk');

describe('SmsService', () => {
  let service: SmsService;
  let prisma: PrismaServiceMock;
  let http: HttpServiceMock;
  let config: ConfigServiceMock;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SmsService,
        ConfigService,
        {
          provide: ConfigService,
          useValue: ConfigServiceMock,
        },
        {
          provide: PrismaService,
          useValue: PrismaServiceMock,
        },
        {
          provide: HttpService,
          useValue: HttpServiceMock,
        },
      ],
    }).compile();
    service = module.get<SmsService>(SmsService);
    prisma = module.get(PrismaService);
    http = module.get(HttpService);
    config = module.get(ConfigService);
  });

  it('send email by smsmasivo', async () => {
    const smsProviderMock = mockDeep<SmsProvider>({
      provider: 'smsmasivos',
    });

    const mock = {
      phoneNumber: '541166480626',
      msg: 'Este es el mensaje',
    };

    prisma.smsProvider.findFirst.mockResolvedValueOnce(smsProviderMock);
    config.get.mockReturnValue({
      smsMasivos: {
        endpoint: 'https://endpoint/',
        user: 'user',
        password: 'password',
      },
    });

    http.axiosRef.request = jest.fn().mockImplementation((request) => {
      expect(request.url).toBe('https://endpoint/');
      expect(request.params.usuario).toBe('user');
      expect(request.params.clave).toBe('password');
      expect(request.params.tos).toBe(mock.phoneNumber.substr(2));
      expect(request.params.texto).toBe(mock.msg);

      return { data: 'done' };
    });
    const result = await service.send(mock);

    expect(result).toEqual('done');
  });

  it.skip('send email by aws', async () => {
    const smsProviderMock = mockDeep<SmsProvider>({
      provider: 'aws',
    });
    const mock = {
      phoneNumber: '541166480626',
      msg: 'Este es el mensaje',
    };

    prisma.smsProvider.findFirst.mockResolvedValueOnce(smsProviderMock);

    config.get.mockReturnValue({
      aws: {
        accessKeyId: 'accessKeyId',
        secretAccessKey: 'secretAccessKey',
        region: 'region1',
      },
    });

    AWS.config = mockDeep<GlobalConfigInstance>({
      update: jest.fn().mockImplementation((config) => {
        expect(config.accessKeyId).toBe('accessKeyId');
        expect(config.secretAccessKey).toBe('secretAccessKey');
        expect(config.region).toBe('region1');
      }),
    });

    AWS.SNS.prototype.publish = jest
      .fn()
      .mockImplementation((params, callback) => {
        expect(params.Message).toBe(mock.msg);
        expect(params.PhoneNumber).toBe(mock.phoneNumber);
        callback(null, 'done');
      });

    const result = await service.send(mock);

    expect(result).toEqual('done');
  });

  it('provider not assigned', async () => {
    prisma.smsProvider.findFirst.mockResolvedValueOnce(null);

    return await expect(
      service.send({
        phoneNumber: '1166480626',
        msg: 'Este es el mensaje',
      }),
    ).rejects.toThrowError(
      new InternalServerErrorException('SMS_CONFIG_NOT_SET'),
    );
  });
});
