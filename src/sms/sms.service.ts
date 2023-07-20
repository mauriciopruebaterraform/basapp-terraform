import { HttpService } from '@nestjs/axios';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@src/database/prisma.service';
import { ISmsAdapter, SmsAdapter } from '@src/interfaces/types';
import { normalize } from '@src/utils/ascii';
import { errorCodes } from './sms.constants';
import AWS from 'aws-sdk';

@Injectable()
export class SmsService implements SmsAdapter {
  constructor(
    readonly prisma: PrismaService,
    private configService: ConfigService,
    private readonly httpService: HttpService,
  ) {}

  async send(message: ISmsAdapter) {
    const switchSms = await this.prisma.smsProvider.findFirst({
      where: {
        active: true,
      },
    });

    switch (switchSms?.provider) {
      case 'smsmasivos':
        return await this.sendMassive(message);
      case 'aws':
        return await this.sendAws(message);

      default:
        throw new InternalServerErrorException(errorCodes.SMS_CONFIG_NOT_SET);
    }
  }

  private async sendMassive(message: ISmsAdapter): Promise<unknown> {
    const { smsMasivos } = this.configService.get('sms');

    const { data } = await this.httpService.axiosRef.request({
      url: smsMasivos.endpoint,
      params: {
        usuario: smsMasivos.user,
        clave: smsMasivos.password,
        tos: message.phoneNumber.substr(2),
        texto: normalize(message.msg),
      },
      method: 'GET',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
    });
    return data;
  }

  private async sendAws(message: ISmsAdapter): Promise<unknown> {
    const { aws } = this.configService.get('sms');

    return await new Promise(function (resolve, reject) {
      AWS.config.update({
        accessKeyId: aws.accessKeyId,
        secretAccessKey: aws.secretAccessKey,
        region: aws.region,
      });

      const sns = new AWS.SNS({ apiVersion: '2010-03-31' });
      // El tipo de mensaje es por defecto Transactional
      // Se configura en AWS SNS (Web console). También se pueden ver las stats de envíos
      // https://console.aws.amazon.com/sns/v2/home?region=us-east-1#/text-messaging
      const params = {
        Message: normalize(message.msg),
        PhoneNumber: '+' + message.phoneNumber,
      };
      sns.publish(params, function (err, data) {
        if (err) {
          return reject(err.stack);
        }
        resolve(data);
      });
    });
  }
}
