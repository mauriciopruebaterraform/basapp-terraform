import {
  Injectable,
  InternalServerErrorException,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Checkpoint, EventType, Alert as PrismaAlert } from '@prisma/client';
import { Alert } from '@src/alerts/entities/alert.entity';
import { Logger } from '@src/common/logger';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseService implements OnModuleInit {
  constructor(private configService: ConfigService) {}
  enabled = false;

  async onModuleInit() {
    const { databaseURL, clientEmail, privateKey } =
      this.configService.get('firebase');
    if (databaseURL && clientEmail && privateKey) {
      this.enabled = true;
    }
  }

  pushFirebase(data: object, elementId: string, node: string) {
    if (this.enabled) {
      const ref = admin.database().ref(node);
      return ref.child(elementId).set(data);
    }
    throw new InternalServerErrorException();
  }

  async pushAlertFirebase(alert: Alert) {
    try {
      const node = `/alerts/${alert.customerId}`;
      const data = {
        type: alert.alertType.name,
        typeId: alert.alertTypeId,
        createdAt: alert.createdAt.toISOString(),
        alertStateId: alert.alertStateId,
        read: false,
        notificationType: 'new',
        user: {
          id: alert.userId,
          fullName: alert.user.fullName,
        },
      };
      await this.pushFirebase(data, alert.id, node);
      return true;
    } catch (err) {
      Logger.error(err);
      return false;
    }
  }

  async updateAlertFirebase(alert: Alert) {
    try {
      const node = `/alerts/${alert.customerId}`;
      const data = {
        type: alert.alertType.name,
        typeId: alert.alertTypeId,
        createdAt: alert.createdAt.toISOString(),
        alertStateId: alert.alertStateId,
        notificationType: 'update',
        read: false,
        user: {
          id: alert.userId,
          fullName: alert.user.fullName,
        },
      };
      await this.pushFirebase(data, alert.id, node);
      return true;
    } catch (err) {
      Logger.error(err);
      return false;
    }
  }

  async pushAlertCheckpoint(
    checkpoint: Checkpoint & {
      alert: PrismaAlert;
    },
  ) {
    try {
      const node = `/checkpoints/${checkpoint.alert.customerId}/${checkpoint.alertId}`;
      const data = {
        alertType: checkpoint.alert.alertTypeId,
        createdAt: checkpoint.createdAt.toISOString(),
        geolocation: checkpoint.geolocation,
      };
      await this.pushFirebase(data, checkpoint.id, node);
      return true;
    } catch (err) {
      Logger.error(err);
      return false;
    }
  }

  async pushEventFirebase(event: {
    id: string;
    customerId: string;
    eventType?: EventType;
    eventStateId: string;
    createdAt: Date;
    updatedAt: Date;
    user: { id?: string; fullName?: string };
  }) {
    try {
      const node = `/events/${event.customerId}`;
      const data = {
        type: event.eventType?.title,
        typeId: event.eventType?.id,
        createdAt: event.createdAt.toISOString(),
        updatedAt: null,
        eventStateId: event.eventStateId,
        read: false,
        notificationType: 'new',
        user: {
          id: event.user?.id,
          fullName: event.user?.fullName,
        },
      };
      await this.pushFirebase(data, event.id, node);
      return true;
    } catch (err) {
      Logger.error(err);
      return false;
    }
  }

  async updateEventFirebase(event: {
    id: string;
    customerId: string;
    eventType?: EventType;
    eventStateId: string;
    createdAt: Date;
    updatedAt: Date;
    user: { id?: string; fullName?: string };
  }) {
    try {
      const node = `/events/${event.customerId}`;
      const data = {
        typeId: event.eventType?.id,
        type: event.eventType?.title,
        createdAt: event.createdAt.toISOString(),
        updatedAt: event.updatedAt.toISOString(),
        eventStateId: event.eventStateId,
        read: false,
        notificationType: 'update',
        user: {
          id: event.user?.id,
          fullName: event.user?.fullName,
        },
      };
      await this.pushFirebase(data, event.id, node);
      return true;
    } catch (err) {
      Logger.error(err);
      return false;
    }
  }

  async createCustomToken(
    id: string,
    user: {
      username: string;
      role: string;
      active: boolean;
      customerId: string;
      customerIds: string[] | null;
    },
  ) {
    if (this.enabled) {
      return await admin.auth().createCustomToken(id, {
        username: user.username,
        role: user.role,
        active: user.active,
        customerId: user.customerId,
        customerIds: JSON.stringify(user.customerIds),
      });
    }
    throw new InternalServerErrorException();
  }
}
