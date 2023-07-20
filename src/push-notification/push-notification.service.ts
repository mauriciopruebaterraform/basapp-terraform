import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Expo, {
  ExpoPushErrorReceipt,
  ExpoPushMessage,
  ExpoPushSuccessTicket,
} from 'expo-server-sdk';
import { Notification } from '../interfaces/types';
import { Logger } from '@src/common/logger';

@Injectable()
export class PushNotificationService implements OnModuleInit {
  constructor(private configService: ConfigService) {}
  expo: Expo;

  async onModuleInit() {
    // Create a new Expo SDK client
    // optionally providing an access token if you have enabled push security
    // this.expo = new Expo({ accessToken: this.configService.get('expoToken') });
    this.expo = new Expo();
  }

  private async receiptNotifications(tickets: ExpoPushSuccessTicket[]) {
    const receiptIds: string[] = [];
    for (const ticket of tickets) {
      // Like sending notifications, there are different strategies you could use
      // to retrieve batches of receipts from the Expo service.
      if (ticket.id) {
        receiptIds.push(ticket.id);
      }
    }
    const receiptIdChunks =
      this.expo.chunkPushNotificationReceiptIds(receiptIds);

    for (const chunk of receiptIdChunks) {
      const receipts = await this.expo.getPushNotificationReceiptsAsync(chunk);
      // The receipts specify whether Apple or Google successfully received the
      // notification and information about an error, if one occurred.
      for (const receiptId in receipts) {
        const { status } = receipts[receiptId];
        if (status === 'ok') {
          continue;
        } else if (status === 'error') {
          const { message, details } = receipts[
            receiptId
          ] as ExpoPushErrorReceipt;

          // The error codes are listed in the Expo documentation:
          // https://docs.expo.io/push-notifications/sending-notifications/#individual-errors
          // You must handle the errors appropriately.
          if (details && details.error) {
            console.error(
              `The error code is ${details.error} with this message: ${message}`,
            );
          }
        }
      }
    }
  }

  async pushNotification(notification: Notification, pushIdList: string[]) {
    // Create the messages that you want to send to clients
    const messages: ExpoPushMessage[] = [];
    let tickets: ExpoPushSuccessTicket[] = [];

    for (const pushId of pushIdList) {
      // Check that all your push tokens appear to be valid Expo push tokens
      if (!Expo.isExpoPushToken(pushId)) {
        console.log('invalid push id');
        return false;
      }
      // Construct a message (see https://docs.expo.io/push-notifications/sending-notifications/)
      messages.push({
        to: pushId,
        sound: 'default',
        body: notification.description,
        title: notification.title,
        data: notification.data,
        channelId: notification.channelId,
        priority: 'high',
        badge: 1,
      });
    }
    // The Expo push notification service accepts batches of notifications so
    // that you don't need to send 1000 requests to send 1000 notifications. We
    // recommend you batch your notifications to reduce the number of requests
    // and to compress them (notifications with similar content will get
    // compressed).
    const chunks = this.expo.chunkPushNotifications(messages);
    try {
      // Send the chunks to the Expo push notification service. There are
      // different strategies you could use. A simple one is to send one chunk at a
      // time, which nicely spreads the load out over time:
      for (const chunk of chunks) {
        const ticketChunk = (await this.expo.sendPushNotificationsAsync(
          chunk,
        )) as unknown as ExpoPushSuccessTicket[];

        tickets = tickets.concat(ticketChunk);
      }
      return true;
    } catch (error) {
      Logger.error(error);
      return false;
    }
  }
}
