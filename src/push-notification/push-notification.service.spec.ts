import '../__test__/winston';
import { Test, TestingModule } from '@nestjs/testing';
import { PushNotificationService } from './push-notification.service';
import Expo, { ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';
import { ConfigService } from '@nestjs/config';

jest.mock('expo-server-sdk');

describe('PushNotificationService', () => {
  let service: PushNotificationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PushNotificationService, ConfigService],
    }).compile();

    service = module.get<PushNotificationService>(PushNotificationService);
    module.init();
  });

  it('sends requests to the Expo API server', async () => {
    const mockedExpo = Expo as jest.Mocked<typeof Expo>;
    const mockedExpoClass = Expo['prototype'] as jest.Mocked<
      (typeof Expo)['prototype']
    >;
    const mockTickets: ExpoPushTicket[] = [
      { status: 'ok', id: 'XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX' },
      { status: 'ok', id: 'YYYYYYYY-YYYY-YYYY-YYYY-YYYYYYYYYYYY' },
    ];

    const mockPushId = [
      'ExponentPushToken[d6jiw2D7FeQt-CSumHPdHA]',
      'ExponentPushToken[d6jjw2D7FeQt-DFxxHPdHA]',
    ];

    mockedExpo.isExpoPushToken.mockReturnValue(true);
    mockedExpoClass.chunkPushNotifications.mockImplementation(
      (messages: ExpoPushMessage[]) => {
        return [messages];
      },
    );

    mockedExpoClass.sendPushNotificationsAsync.mockResolvedValueOnce(
      mockTickets,
    );

    mockedExpoClass.chunkPushNotificationReceiptIds.mockReturnValue([
      ['c8b4ca75-d450-4266-8e32-2113ee4a4bae'],
    ]);

    mockedExpoClass.getPushNotificationReceiptsAsync.mockResolvedValue({
      'dcb4e972-6614-40b1-9a24-f65f19ead257': { status: 'ok' },
    });

    const result = await service.pushNotification(
      {
        title: 'Alerta de robo',
        description: 'estan robando en el barrio',
        channelId: 'emergency-notifications',
        data: {},
      },
      mockPushId,
    );

    expect(result).toBe(true);
  });

  it('invalid expo token', async () => {
    const mockedExpo = Expo as jest.Mocked<typeof Expo>;

    const mockPushId = [
      'ExponentPushToken[d6jiw2D7FeQt-CSumHPdHA]',
      'ExponentPushToken[d6jjw2D7FeQt-DFxxHPdHA]',
    ];

    mockedExpo.isExpoPushToken.mockReturnValue(false);

    const result = await service.pushNotification(
      {
        title: 'Alerta de robo',
        description: 'estan robando en el barrio',
        channelId: 'alert-notifications',
        data: {},
      },
      mockPushId,
    );

    expect(result).toBe(false);
  });
});
