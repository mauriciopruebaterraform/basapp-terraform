import '../../__test__/winston';
import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { mockDeep } from 'jest-mock-extended';
import { ExternalService } from './external.service';
import { Event } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { EventCreateManyInput } from '@src/customers/events/events.controller.types';
import { HttpServiceMock } from './mocks/http.service';
import { Customer } from '@prisma/client';
import { CustomerIntegration } from '@prisma/client';
import { PrismaService } from '@src/database/prisma.service';
import { PrismaServiceMock } from '@src/database/mocks/prisma.service';
import { ICMService } from '@prisma/client';
import { CustomerLot } from '@prisma/client';

describe('ExternalService', () => {
  let service: ExternalService;
  let prisma: PrismaServiceMock;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConfigService,
        ExternalService,
        {
          provide: HttpService,
          useValue: HttpServiceMock,
        },
        {
          provide: PrismaService,
          useValue: PrismaServiceMock,
        },
      ],
    }).compile();
    prisma = module.get(PrismaService);
    service = module.get<ExternalService>(ExternalService);
  });

  it('create delivery invitation', async () => {
    const eventMock = mockDeep<EventCreateManyInput>({
      id: '65ec99b9-f1c4-416c-a2bc-62a8455a3544',
      externalId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
      customerId: '65ec99b9-f1c4-416c-a2bc-62a8455a3544',
      from: new Date('2020-04-22 03:00:00'),
      to: new Date('2020-04-23 02:59:00'),
      fullName: 'Nerina Serra',
      description: '',
      lot: 'DS123467',
      changeLog: '[]',
    });

    const createIcm = {
      event: eventMock,
      icmToken:
        'eeb15c03-7083-4d21-98f4-d488dcf5a75e8f9ce6e9-2e31-4cdb-a340-d54a7c97c6ea',
      icmUid: '9d0b598d-1ede-42c2-9412-4e364b830ee1',
      icmUrl: 'https://www.uuidgenerator.net/',
      icmDeliveryType: 'A7',
    };

    jest
      .spyOn(HttpServiceMock.axiosRef, 'request')
      .mockImplementation(async ({ url, params }) => {
        expect(url).toBe(`${createIcm.icmUrl}/Guest/DeliveryNoticeCreate`);
        expect(params).toStrictEqual({
          appToken: createIcm.icmToken,
          deliveryTypeCode: createIcm.icmDeliveryType,
          externalReference: createIcm.event.externalId,
          UnitId: createIcm.icmUid,
        });

        return {
          data: {
            result: 0,
            error_code: '',
            error_description: '',
            data: '{"id":"3fe0a47e-4561-49e5-bbc4-aba50131d1c3"}',
          },
        };
      });

    const result = await service.createDeliveryInvitation(createIcm);

    expect(result).toEqual(eventMock.id);
  });

  it('create guest invitation', async () => {
    const eventMock = mockDeep<EventCreateManyInput>({
      id: '65ec99b9-f1c4-416c-a2bc-62a8455a3544',
      externalId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
      customerId: '65ec99b9-f1c4-416c-a2bc-62a8455a3544',
      from: '2020-04-22 03:00:00',
      to: '2020-04-23 02:59:00',
      fullName: 'Nerina Serra',
      firstName: 'Nerina',
      lastName: 'Serra',
      description: '',
      lot: 'DS123467',
      changeLog: '[]',
    });

    const createIcm = {
      event: eventMock,
      icmToken:
        'eeb15c03-7083-4d21-98f4-d488dcf5a75e8f9ce6e9-2e31-4cdb-a340-d54a7c97c6ea',
      icmUid: '9d0b598d-1ede-42c2-9412-4e364b830ee1',
      icmUrl: 'https://www.uuidgenerator.net/',
    };
    jest
      .spyOn(HttpServiceMock.axiosRef, 'request')
      .mockImplementation(async ({ url, params }) => {
        expect(url).toBe(`${createIcm.icmUrl}/Guest/InvitationCreate`);
        expect(params).toStrictEqual({
          appToken: createIcm.icmToken,
          PersonId: '',
          identificationNumber: createIcm.event.dni,
          firstName: 'Nerina',
          lastName: 'Serra',
          from: '22/04/2020',
          to: '23/04/2020',
          comments: createIcm.event.description,
          externalReference: createIcm.event.externalId,
          UnitId: createIcm.icmUid,
        });

        return {
          data: {
            result: 0,
            error_code: '',
            error_description: '',
            data: '{"id":"3fe0a47e-4561-49e5-bbc4-aba50131d1c3"}',
          },
        };
      });

    const results = await service.createGuestInvitation(createIcm);

    expect(results).toEqual(eventMock.id);
  });

  it(' get cyber map', async () => {
    HttpServiceMock.axiosRef.request = jest
      .fn()
      .mockImplementation(async ({ url, data }) => {
        expect(url).toBe('https://www.uuidgenerator.net/');
        expect(data).toStrictEqual({
          action: 'GETVEHICULOS',
          user: 'mauricio05',
          pwd: 'sg2021BAS',
        });

        return { data: [{ id: 'b3c2961b-88fb-4121-8e10-ba08a456addf' }] };
      });

    const result = await service.getCyberMapa(
      'https://www.uuidgenerator.net/',
      'mauricio05',
      'sg2021BAS',
      'GETVEHICULOS',
    );
    expect(result).toStrictEqual([
      { id: 'b3c2961b-88fb-4121-8e10-ba08a456addf' },
    ]);
  });

  it('get traccar positions', async () => {
    const positions = JSON.stringify([
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
    ]);

    jest
      .spyOn(HttpServiceMock.axiosRef, 'request')
      .mockImplementation(async ({ url }) => {
        expect(url).toBe('https://www.uuidgenerator.net/positions');

        return { data: positions };
      });
    const result = await service.getTraccarPositions(
      'mauricio05',
      'https://www.uuidgenerator.net/',
    );

    expect(result).toBe(positions);
  });

  it('get traccar devices', async () => {
    const devices = JSON.stringify([
      {
        deviceId: 'f285f646-152c-48fb-8727-32883a401d00',
        latitude: 15,
        longitude: 20,
        accuracy: 0,
        speed: 0,
        attributes: {},
      },
    ]);
    jest
      .spyOn(HttpServiceMock.axiosRef, 'request')
      .mockImplementation(async ({ url }) => {
        expect(url).toBe('https://www.uuidgenerator.net/devices');

        return { data: devices };
      });

    const result = await service.getTraccarDevices(
      'mauricio05',
      'https://www.uuidgenerator.net/',
    );

    expect(result).toBe(devices);
  });

  it('cancel guest invitation', async () => {
    const event = mockDeep<
      Event & {
        customer: Customer & { integrations: CustomerIntegration | null };
      }
    >({
      dni: '95363401',
      externalId: '4cd6e32a-3b5d-428b-916a-ff825a91fea5',
      customer: {
        id: 'a40360e1-ed91-4ecb-baf6-dac3fb697833',
        integrations: {
          icmUrl: 'http://url.com',
          icmToken: 'este-es-un-token',
        },
      },
    });

    jest
      .spyOn(HttpServiceMock.axiosRef, 'request')
      .mockImplementation(async ({ url }) => {
        expect(url).toBe(
          'http://url.com/Guest/InvitationDelete?appToken=este-es-un-token&PersonId=&externalReference=4cd6e32a-3b5d-428b-916a-ff825a91fea5',
        );

        return { data: 'get sent' };
      });

    prisma.iCMService.create.mockResolvedValueOnce(
      mockDeep<ICMService>({
        customerId: 'a40360e1-ed91-4ecb-baf6-dac3fb697833',
        eventId: '4cd6e32a-3b5d-428b-916a-ff825a91fea5',
        request:
          'http://url.com/Guest/InvitationDelete?appToken=este-es-un-token&PersonId=&externalReference=4cd6e32a-3b5d-428b-916a-ff825a91fea5',
        response: 'get sent',
      }),
    );

    await service.cancelGuestInvitation(event);
  });

  it('cancel delivery invitation', async () => {
    const event = mockDeep<
      Event & {
        customer: Customer & { integrations: CustomerIntegration | null };
      }
    >({
      dni: '95363401',
      lot: 'a6',
      externalId: '4cd6e32a-3b5d-428b-916a-ff825a91fea5',
      customer: {
        id: 'a40360e1-ed91-4ecb-baf6-dac3fb697833',
        integrations: {
          icmUrl: 'http://url.com',
          icmToken: 'este-es-un-token',
        },
      },
    });

    const icmServiceMock = mockDeep<ICMService>({
      eventId: '4cd6e32a-3b5d-428b-916a-ff825a91fea5',
      externalReference: 'external',
    });

    const icmLot = mockDeep<CustomerLot>({
      lot: 'a6',
      icmUid: 'e2489198-1148-40f8-8859-06fa6aa4c27c',
      customerId: 'a40360e1-ed91-4ecb-baf6-dac3fb697833',
    });
    jest
      .spyOn(HttpServiceMock.axiosRef, 'request')
      .mockImplementation(async ({ url }) => {
        expect(url).toBe(
          'http://url.com/Guest/DeliveryNoticeDelete?appToken=este-es-un-token&unitId=e2489198-1148-40f8-8859-06fa6aa4c27c&noticeId=external',
        );

        return { data: 'get sent' };
      });

    prisma.iCMService.findFirst.mockResolvedValue(icmServiceMock);
    prisma.customerLot.findFirst.mockResolvedValue(icmLot);
    prisma.iCMService.create.mockResolvedValueOnce(
      mockDeep<ICMService>({
        customerId: 'a40360e1-ed91-4ecb-baf6-dac3fb697833',
        eventId: '4cd6e32a-3b5d-428b-916a-ff825a91fea5',
        request:
          'http://url.com/Guest/DeliveryNoticeDelete?appToken=este-es-un-token&unitId=e2489198-1148-40f8-8859-06fa6aa4c27c&noticeId=external',
        response: 'get sent',
      }),
    );

    await service.cancelDeliveryInvitation(event);
  });
});
