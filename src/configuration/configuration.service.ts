import { PubSub } from '@google-cloud/pubsub';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Service } from '@src/common/classes/service.class';
import { ListCsvArgsDto } from '@src/common/dto/list-csv-args.dto';
import { PrismaService } from '@src/database/prisma.service';
import { Attributes, ReservationMail, ResetPasswordEmail } from './types';

@Injectable()
export class ConfigurationService extends Service implements OnModuleInit {
  pubSub: PubSub;

  constructor(
    readonly prisma: PrismaService,
    private configService: ConfigService,
  ) {
    super(prisma);
  }

  async onModuleInit() {
    const { projectId } = this.configService.get('firebase');

    this.pubSub = new PubSub({ projectId });
  }

  async updateSms(id: string) {
    const updateMany = this.prisma.smsProvider.updateMany({
      data: {
        active: false,
      },
    });

    const activeSms = this.prisma.smsProvider.update({
      data: {
        active: true,
      },
      where: {
        id,
      },
    });

    const [activeService] = await this.prisma.$transaction([
      activeSms,
      updateMany,
    ]);

    return activeService;
  }

  async generateCsv(
    params: ListCsvArgsDto & { email: string },
    topicName: string,
  ) {
    const topic = this.pubSub.topic(topicName);

    const attributes: Attributes = {
      email: params.email,
      utcOffset: '-180',
    };

    if (params.where) {
      attributes.where = JSON.stringify(params.where);

      if (params.where.customerId) {
        const customer = await this.prisma.customer.findUnique({
          where: {
            id: params.where.customerId,
          },
          select: {
            timezone: true,
          },
        });

        if (customer?.timezone) {
          attributes.utcOffset = customer.timezone;
        }
      }
    }

    if (params.orderBy) {
      attributes.orderBy = JSON.stringify(params.orderBy);
    }

    topic.publishMessage({
      attributes,
    });

    return;
  }

  subscriptionMail(topicName: string, mail: ResetPasswordEmail) {
    const topic = this.pubSub.topic(topicName);

    topic.publishMessage({
      attributes: {
        ...mail,
      },
    });
  }

  subscriptionMailReservation(reservation: ReservationMail) {
    const topic = this.pubSub.topic('reservation-email-topic');

    topic.publishMessage({
      attributes: {
        ...reservation,
      },
    });
  }
}
