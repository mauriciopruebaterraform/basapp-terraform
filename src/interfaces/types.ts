import {
  AlertType,
  Customer,
  CustomerAlertType,
  CustomerIntegration,
  Role,
  CustomerEventCategory,
  EventCategory,
  User,
  CustomerSections,
  AuthorizedUser,
} from '@prisma/client';
import { EventCreateManyInput } from '@src/customers/events/events.controller.types';

export interface IFileObject {
  name: string;
  url: string;
  thumbnailUrl: string;
}

export interface IMailMessage {
  to: string;
  from?: string;
  subject: string;
  text: string;
  html: string;
}

export interface ISmsAdapter {
  phoneNumber: string;
  msg: string;
}

export interface ITemplatedMessage {
  to: string;
  from?: string;
  subject: string;
  text: string;
  template: string;
  layoutData?: {
    [key: string]: string;
  };
  data?: {
    [key: string]: string;
  };
}

export interface ITokenPayload {
  sub: string;
  username: string;
  iat: number;
  exp: number;
  role: Role;
  active: boolean;
  customerId: string;
}

export interface IAccessToken {
  access_token: string;
  firebaseToken?: string;
}

export interface IRequestUser {
  id: string;
  username: string;
  role: Role;
  active: boolean;
  customerId: string;
}

export interface IUserWithCustomer extends User {
  customer?: Customer | null;
  authorizedUser?: AuthorizedUser | null;
}

export interface ICustomerWithAlertTypes extends Customer {
  alertTypes: (CustomerAlertType & { alertType: AlertType })[];
  eventCategories: (CustomerEventCategory & { category: EventCategory })[];
  integrations: CustomerIntegration | null;
  sections: CustomerSections | null;
}

export type FileUploadSuccess = {
  url: string;
};
export interface FileAdapter {
  upload(
    fileBuffer: Buffer,
    name: string,
    mimetype: string,
    path?: string,
  ): Promise<FileUploadSuccess>;
  delete(name: string): Promise<unknown>;
}

export interface MailAdapter {
  send(message: IMailMessage): Promise<unknown>;
}

export interface SmsAdapter {
  send(message: ISmsAdapter): Promise<unknown>;
}

export type IMailingLinks = {
  androidLink: string;
  iosLink: string;
};

export type IPaginationArgs<T> = T & {
  skip?: number;
  take?: number;
  includeCount?: boolean;
};

export interface IPaginatedResult<T> {
  results: T[];
  pagination: {
    total: number;
    size: number;
    skip: number;
    take: number;
    hasMore?: boolean;
  };
}

export interface IEntityService {
  findAll(
    params: IPaginationArgs<any>,
    rest?: any,
  ): Promise<IPaginatedResult<any>>;
  findOne?(id: string, params: any): Promise<any>;
  create(data: any): Promise<any>;
  update(id: string, data: any): Promise<any>;
  delete?(id: string): Promise<any>;
}

export type DataArray = (string | number)[];

export type Notification = {
  title: string;
  description: string;
  channelId:
    | 'alert-notifications'
    | 'emergency-notifications'
    | 'general-notifications'
    | 'event-notifications'
    | 'auth-request-notifications';
  data: object;
};

export type CreateIcm = {
  event: EventCreateManyInput;
  icmToken: string;
  icmUid: string | null;
  icmUrl: string;
};
