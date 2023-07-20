import {
  Prisma,
  AuthorizedUser,
  Customer,
  CustomerSettings,
  CustomerIntegration,
} from '@prisma/client';
import { IRequestUser } from '@src/interfaces/types';
import { CreateEventDto } from './dto/create-event.dto';

export type CustomerRelated = Customer & {
  settings: CustomerSettings;
  integrations: CustomerIntegration;
};
export type CreateEvent = Omit<CreateEventDto, 'utcOffset'> & {
  lot: string | null;
  changeLog: string;
  qrPending: boolean;
  token: string | undefined;
  isPermanent: boolean;
  customerId: string;
  eventStateId?: string;
  userId?: string;
  qrCode?: string | null;
  trialPeriod?: boolean;
};

export type AuthorizedUserEvent =
  | (AuthorizedUser & {
      customer: {
        countryCode: string | null;
      };
    })
  | undefined;

export type CreateEventParams = {
  data: CreateEventDto;
  userRequest: IRequestUser;
  customerId: string;
};

export type EventCreateManyInput = Omit<Prisma.EventCreateManyInput, 'id'> & {
  id: string;
};
