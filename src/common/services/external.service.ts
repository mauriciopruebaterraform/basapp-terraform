import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { errorCodes } from './external.constants';
import * as dayjs from 'dayjs';
import { CreateIcm } from '@src/interfaces/types';
import { PrismaService } from '@src/database/prisma.service';
import { Event, Customer, CustomerIntegration } from '@prisma/client';
import { Logger } from '../logger';

@Injectable()
export class ExternalService {
  constructor(
    readonly prisma: PrismaService,
    private configService: ConfigService,
    private readonly httpService: HttpService,
  ) {}

  // Elimino la barra final en la URL si es que tiene
  private createUrl(url: string, suffix: string) {
    if (url.charAt(url.length - 1) === '/') {
      url = url.substr(0, url.length - 1);
    }
    return suffix ? url + suffix : url;
  }

  async reverseGeocoding(coord: { lat: number; lng: number }) {
    try {
      const { url, key } = this.configService.get('googleGeocoding');
      const { data } = await this.httpService.axiosRef.request({
        url,
        params: {
          key,
          latlng: `${coord.lat},${coord.lng}`,
          language: 'es',
        },
        method: 'GET',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
      });
      return data;
    } catch (err) {
      throw new InternalServerErrorException({
        message: errorCodes.GOOGLE_GEOCODING,
      });
    }
  }

  async getTraccarDevices(auth: string, url: string) {
    try {
      const devicesUrl = this.createUrl(url, '/devices');

      const { data } = await this.httpService.axiosRef.request({
        url: devicesUrl,
        method: 'GET',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/json; charset=utf-8',
          Accept: 'application/json',
        },
        timeout: 5000,
      });

      return data;
    } catch (err) {
      throw new InternalServerErrorException({
        message: errorCodes.TRACCAR_DEVICES,
      });
    }
  }

  async getTraccarPositions(auth: string, url: string) {
    try {
      const devicesUrl = this.createUrl(url, '/positions');

      const { data } = await this.httpService.axiosRef.request({
        url: devicesUrl,
        method: 'GET',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/json; charset=utf-8',
          Accept: 'application/json',
        },
        timeout: 5000,
      });

      return data;
    } catch (err) {
      throw new InternalServerErrorException({
        message: errorCodes.TRACCAR_POSITIONS,
      });
    }
  }

  async getCyberMapa(
    url: string,
    user: string,
    password: string,
    action: 'GETVEHICULOS' | 'DATOSACTUALES',
  ) {
    try {
      const { data } = await this.httpService.axiosRef.request({
        url,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          Accept: 'application/json',
        },
        data: {
          action,
          user: user,
          pwd: password,
        },
        timeout: 5000,
      });

      return data;
    } catch (err) {
      throw new InternalServerErrorException({
        message: errorCodes.TRACCAR_DEVICES,
      });
    }
  }

  async getDeliveryTypes(icmUrl: string, icmToken: string) {
    const suffix = '/Guest/DeliveryTypesGet?appToken=' + icmToken;
    const deliveryTypesUrl = this.createUrl(icmUrl, suffix);

    const params = {
      headers: {
        Authorization: 'Basic ' + icmToken,
        'Content-Type': 'application/json; charset=utf-8',
        Accept: 'application/json',
      },
      method: 'GET',
      url: deliveryTypesUrl,
      timeout: 10000,
    };

    try {
      const { data } = await this.httpService.axiosRef.request(params);
      return data;
    } catch (err) {
      Logger.error(err);
      return [];
    }
  }

  async createDeliveryInvitation({
    event,
    icmToken,
    icmUid,
    icmUrl,
    icmDeliveryType,
  }: CreateIcm & { icmDeliveryType: string }) {
    const { data } = await this.httpService.axiosRef.request({
      url: `${icmUrl}/Guest/DeliveryNoticeCreate`,
      headers: {
        Authorization: 'Basic ' + icmToken,
        'Content-Type': 'application/json; charset=utf-8',
        method: 'GET',
        Accept: 'application/json',
      },
      params: {
        appToken: icmToken,
        deliveryTypeCode: icmDeliveryType,
        externalReference: event.externalId,
        UnitId: icmUid || 'NA',
      },
    });

    let icmId = null;
    if (data.data) {
      const dataJson = JSON.parse(data.data);
      icmId = dataJson.noticeId;
    }

    await this.prisma.iCMService.create({
      data: {
        customer: {
          connect: {
            id: event.customerId,
          },
        },
        eventId: event.externalId,
        request: `${icmUrl}/Guest/DeliveryNoticeCreate`,
        response: data,
        externalReference: icmId,
      },
    });

    return event.id;
  }

  async createGuestInvitation({ event, icmToken, icmUid, icmUrl }: CreateIcm) {
    let dateTo = event.to;

    if (
      dayjs(event.from).month() === dayjs(event.to).month() &&
      dayjs(event.from).toDate() === dayjs(event.to).toDate()
    ) {
      dateTo = dayjs(dateTo).add(1, 'days').toDate();
    }

    let response;
    let icmId: null | string = null;
    try {
      const { data } = await this.httpService.axiosRef.request({
        url: `${icmUrl}/Guest/InvitationCreate`,
        headers: {
          Authorization: 'Basic ' + icmToken,
          'Content-Type': 'application/json; charset=utf-8',
          method: 'GET',
          Accept: 'application/json',
        },
        params: {
          appToken: icmToken,
          PersonId: '',
          identificationNumber: event.dni,
          firstName: event.firstName || event.fullName,
          lastName: event.lastName || event.fullName,
          from: dayjs(event.from).format('DD/MM/YYYY'),
          to: dayjs(dateTo).format('DD/MM/YYYY'),
          comments: event.description,
          externalReference: event.externalId,
          UnitId: icmUid || 'NA',
        },
      });
      response = data;

      if (data.data) {
        const dataJson = JSON.parse(data.data);
        icmId = dataJson.id;
      }
    } catch (err) {
      response =
        'Status code: ' + (err.response ? err.response.statusCode : '');
    }

    await this.prisma.iCMService.create({
      data: {
        customer: {
          connect: {
            id: event.customerId,
          },
        },
        eventId: event.externalId,
        request: `${icmUrl}/Guest/InvitationCreate`,
        response,
        externalReference: icmId,
      },
    });
    return event.id;
  }

  async cancelDeliveryInvitation(
    data: Event & {
      customer: Customer & { integrations: CustomerIntegration | null };
    },
  ) {
    const { customer } = data;

    if (!customer.integrations?.icmUrl || !customer.integrations?.icmToken) {
      return;
    }

    if (data.lot) {
      const icmEvent = await this.prisma.iCMService.findFirst({
        where: {
          eventId: data.externalId,
        },
      });

      if (icmEvent) {
        const icmLot = await this.prisma.customerLot.findFirst({
          where: {
            lot: data.lot,
            customerId: data.customerId,
          },
        });

        if (icmLot) {
          const unitId = icmLot ? icmLot.icmUid : 'NA';

          const getUrl =
            customer.integrations.icmUrl +
            '/Guest/DeliveryNoticeDelete?appToken=' +
            customer.integrations.icmToken +
            '&unitId=' +
            unitId +
            '&noticeId=' +
            icmEvent.externalReference;

          const params = {
            headers: {
              Authorization: 'Basic ' + customer.integrations.icmToken,
              'Content-Type': 'application/json; charset=utf-8',
              Accept: 'application/json',
            },
            method: 'GET',
            url: getUrl,
          };
          let response;

          try {
            const { data } = await this.httpService.axiosRef.request(params);
            response = data;
          } catch (err) {
            response =
              'Status code: ' + (err.response ? err.response.statusCode : '');
          }

          await this.prisma.iCMService.create({
            data: {
              customer: {
                connect: {
                  id: customer.id,
                },
              },
              eventId: data.externalId,
              request: getUrl,
              response,
            },
          });
        }
      }
    }
  }

  async cancelGuestInvitation(
    data: Event & {
      customer: Customer & { integrations: CustomerIntegration | null };
    },
  ) {
    const { customer } = data;

    if (!customer.integrations?.icmUrl || !customer.integrations?.icmToken) {
      return;
    }

    if (data.dni) {
      const getUrl =
        customer.integrations.icmUrl +
        '/Guest/InvitationDelete?appToken=' +
        customer.integrations.icmToken +
        '&PersonId=' +
        '&externalReference=' +
        data.externalId;

      const options = {
        headers: {
          Authorization: 'Basic ' + customer.integrations.icmToken,
          'Content-Type': 'application/json; charset=utf-8',
          Accept: 'application/json',
        },
        method: 'GET',
        url: getUrl,
      };

      let response;
      try {
        const { data } = await this.httpService.axiosRef.request(options);
        response = data;
      } catch (err) {
        response =
          'Status code: ' + (err.response ? err.response.statusCode : '');
      }

      await this.prisma.iCMService.create({
        data: {
          customer: {
            connect: {
              id: customer.id,
            },
          },
          eventId: data.externalId,
          request: getUrl,
          response,
        },
      });
    }
  }
}
