import { Prisma } from '@prisma/client';
import { File } from '@src/common/dto/file.dto';
import { ScheduleDto } from '@src/customers/reservation-space/dto/schedule.dto';
import { IMailingLinks, IUserWithCustomer } from '@src/interfaces/types';
import { Geolocation } from '@src/common/dto/geolocation.dto';
import { AddressDto } from '@src/users/dto/address.dto';
import { DeviceContactDto } from '@src/users/contacts/dto/device-contact.dto';
import { GeolocationAlert } from '@src/alerts/dto/geolocation.dto';
import { TimeDto } from '@src/common/dto/time.dto';
import {
  InternalServerErrorException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { errorCodes } from '@src/alerts/alerts.constants';
import { get } from 'lodash';
import { PrismaService } from '@src/database/prisma.service';

export const getMailLinksFromUser = (
  user: IUserWithCustomer,
): IMailingLinks => {
  let iosLink = '';
  let androidLink = '';

  if (user.customer == null || user.customer.type === 'government') {
    iosLink = 'https://apps.apple.com/us/app/basapp/id1234725969';
    androidLink =
      'https://play.google.com/store/apps/details?id=com.basapp.app&hl=es_419';
  } else {
    iosLink = 'https://apps.apple.com/us/app/basapp-cyb/id1184620134';
    androidLink =
      'https://play.google.com/store/apps/details?id=com.basapp.countries.app&hl=es_419';
  }

  return {
    iosLink,
    androidLink,
  };
};

export const changeRelationTable = (id?: string | null) => {
  if (id) {
    return {
      connect: {
        id,
      },
    };
  } else if (id === null) {
    return {
      disconnect: true,
    };
  } else {
    return undefined;
  }
};

export const changeInputJsonObject = (
  file?:
    | File
    | ScheduleDto
    | TimeDto[]
    | AddressDto
    | Geolocation
    | DeviceContactDto
    | GeolocationAlert[]
    | null,
): Prisma.InputJsonValue | Prisma.NullTypes.JsonNull | undefined => {
  if (file) {
    return file as unknown as Prisma.InputJsonObject;
  } else if (file === null) {
    return Prisma.JsonNull;
  } else {
    return undefined;
  }
};

export const FileFilterCsv = (
  req: any,
  file: Express.Multer.File,
  callback: (message: Error | null, valid: boolean) => any,
) => {
  req.fileValidationError = false;
  if (!file.originalname.match(/\.(csv)$/)) {
    req.fileValidationError = true;
    return callback(null, false);
  }
  callback(null, true);
};

export function generateCode() {
  return Math.floor(Math.random() * (100000 - 999999 + 1) + 999999).toString();
}

/**
 * compares if the new object comes with the property to compare
 * and is different from the old value
 * @param old old object value
 * @param value new object value
 * @param field field to compare
 * @returns {boolean}
 */

export function compareObjects<T, D>(old: T, value: D, field: string): boolean {
  if (typeof value[field] !== 'undefined' && old[field] !== value[field]) {
    return true;
  }
  return false;
}

export async function validateCustomers(
  prisma: PrismaService,
  customerId: string,
  where = {},
) {
  const customers = await prisma.customer.findMany({
    where: {
      OR: [
        {
          id: customerId,
        },
        {
          parentId: customerId,
        },
      ],
    },
  });

  if (!customers.length) {
    throw new InternalServerErrorException(errorCodes.CUSTOMERS_NOT_FOUND);
  }

  const customerList = customers.map((i) => i.id);

  const customersQuery: string[] = get(where, 'customerId.in', []);

  if (!customersQuery.length) {
    throw new UnprocessableEntityException({
      message: errorCodes.CUSTOMER_NOT_INCLUDED_PARAMS,
      error:
        'the parameter where.customerId.in it does not include arrays of string',
    });
  }

  customersQuery.forEach((customer) => {
    if (!customerList.includes(customer)) {
      throw new UnprocessableEntityException(errorCodes.CUSTOMER_NOT_ALLOWED);
    }
  });

  return customersQuery.map((i: string) => ({
    customerId: i,
  }));
}
