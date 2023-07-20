import '../__test__/winston';
import {
  Role,
  CustomerIntegration,
  CustomerSettings,
  CustomerEventCategory,
  CustomerSections,
} from '@prisma/client';
import { Test, TestingModule } from '@nestjs/testing';
import { CustomerController } from './customers.controller';
import { CustomerModule } from './customers.module';
import { CustomerService } from './customers.service';
import { CustomerServiceMock } from './mocks/customers.service';
import {
  PrismaGirovisionService,
  PrismaService,
} from '@src/database/prisma.service';
import {
  PrismaGirovisionServiceMock,
  PrismaServiceMock,
} from '@src/database/mocks/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { mockDeep } from 'jest-mock-extended';
import { CustomerEventCategories } from './entities/customer-event-categories.entity';
import { ICustomerWithAlertTypes } from '@src/interfaces/types';
import { errorCodes } from '@src/auth/auth.constants';
import { ForbiddenException } from '@nestjs/common';
import { Customer } from './entities/customer.entity';
import { PushNotificationService } from '@src/push-notification/push-notification.service';
import { PushNotificationServiceMock } from '@src/push-notification/mocks/push-notification.service';
import { ReservationService } from './reservations/reservations.service';
import { ReservationServiceMock } from './reservations/mocks/reservations.service';
import { DatabaseModule } from '@src/database/database.module';
import { ConfigModule } from '@nestjs/config';
import configuration from '@src/config/configuration';
import { FirebaseModule } from '@src/firebase/firebase.module';
import { PushNotificationModule } from '@src/push-notification/push-notification.module';
import { ConfigurationModule } from '@src/configuration/configuration.module';
import { SMSModule } from '@src/sms/sms.module';
import { SmsService } from '@src/sms/sms.service';
import { SmsServiceMock } from '@src/sms/mocks/sms.service';

describe('CustomerController', () => {
  let controller: CustomerController;
  let customerService: CustomerServiceMock;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        CustomerModule,
        FirebaseModule,
        PushNotificationModule,
        ConfigurationModule,
        ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
        SMSModule,
        DatabaseModule,
      ],
      controllers: [CustomerController],
    })
      .overrideProvider(PrismaService)
      .useValue(PrismaServiceMock)
      .overrideProvider(SmsService)
      .useValue(SmsServiceMock)
      .overrideProvider(PrismaGirovisionService)
      .useValue(PrismaGirovisionServiceMock)
      .overrideProvider(PushNotificationService)
      .useValue(PushNotificationServiceMock)
      .overrideProvider(ReservationService)
      .useValue(ReservationServiceMock)
      .overrideProvider(CustomerService)
      .useValue(CustomerServiceMock)
      .compile();

    controller = module.get<CustomerController>(CustomerController);
    customerService = module.get(CustomerService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create a customer', async () => {
    expect(controller.create).toBeDefined();

    const customerData = {
      name: 'Test',
    };

    const customerInput = mockDeep<CreateCustomerDto>(customerData);
    const customer = mockDeep<
      ICustomerWithAlertTypes & {
        integrations: CustomerIntegration;
        settings: CustomerSettings;
        customerEventCategories: CustomerEventCategory;
        sections: CustomerSections;
      }
    >({
      id: '4e3f8f9b-f8c1-4b5f-b8e9-f8c1b5f8e9f8',
      ...customerData,
    });
    customerService.create.mockResolvedValueOnce(customer);

    const result = await controller.create(
      {
        user: { id: 'b0273fda-1977-469e-b376-6b49cceb0a6f' },
      },
      customerInput,
    );

    expect(result).toMatchObject({
      name: 'Test',
      id: '4e3f8f9b-f8c1-4b5f-b8e9-f8c1b5f8e9f8',
    });
  });

  it('should throw if creation throws an error', async () => {
    const customerData = {
      name: 'Test',
    };

    const customerInput = mockDeep<CreateCustomerDto>(customerData);
    customerService.create.mockRejectedValueOnce(new Error('Test'));

    await expect(
      controller.create(
        {
          user: { id: 'b0273fda-1977-469e-b376-6b49cceb0a6f' },
        },
        customerInput,
      ),
    ).rejects.toThrowError('Test');
  });

  it('should update a customer', async () => {
    expect(controller.update).toBeDefined();

    const customerData = {
      name: 'Updated Customer',
    };

    const customer = mockDeep<ICustomerWithAlertTypes>({
      id: '4e3f8f9b-f8c1-4b5f-b8e9-f8c1b5f8e9f8',
      ...customerData,
    });
    customerService.update.mockResolvedValueOnce(customer);

    const result = await controller.update(
      {
        user: { id: 'b0273fda-1977-469e-b376-6b49cceb0a6f' },
      },
      '4e3f8f9b-f8c1-4b5f-b8e9-f8c1b5f8e9f8',
      customerData,
    );

    expect(result).toMatchObject({
      name: 'Updated Customer',
      id: '4e3f8f9b-f8c1-4b5f-b8e9-f8c1b5f8e9f8',
    });
  });

  it('should throw if update throws an error', async () => {
    const customerData = {
      name: 'Updated Customer',
    };

    customerService.update.mockRejectedValueOnce(new Error('Test'));

    await expect(
      controller.update(
        {
          user: { id: 'b0273fda-1977-469e-b376-6b49cceb0a6f' },
        },
        '4e3f8f9b-f8c1-4b5f-b8e9-f8c1b5f8e9f8',
        customerData,
      ),
    ).rejects.toThrowError('Test');
  });

  it('should return a list of customers', async () => {
    const customers = [
      {
        id: '4e3f8f9b-f8c1-4b5f-b8e9-f8c1b5f8e9f8',
        name: 'Test',
      },
      {
        id: '4e3f8f9b-f8c1-4b5f-b8e9-f8c1b5f8e9f9',
        name: 'Test2',
      },
      {
        id: '4e3f8f9b-f8c1-4b5f-b8e9-f8c1b5f8e9f10',
        name: 'Test3',
      },
      {
        id: '4e3f8f9b-f8c1-4b5f-b8e9-f8c1b5f8e9f11',
        name: 'Test4',
      },
    ];

    customerService.findAll.mockResolvedValueOnce({
      results: customers,
      pagination: {
        total: 4,
        size: 4,
        skip: 0,
        take: 10,
      },
    });

    const { results, pagination } = await controller.findAll(
      {
        user: { id: 'b0273fda-1977-469e-b376-6b49cceb0a6f' },
      },
      {},
    );
    expect(results).toBeDefined();
    expect(results).toBeInstanceOf(Array);
    expect(results.length).toBe(4);

    results.forEach((item) => {
      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('name');
    });

    expect(pagination).toBeDefined();
    expect(pagination).toBeInstanceOf(Object);
    expect(pagination).toEqual({
      size: 4,
      total: 4,
      take: 10,
      skip: 0,
    });
  });

  it('should return a customer by id', async () => {
    const customer = mockDeep<Customer>({
      id: '4e3f8f9b-f8c1-4b5f-b8e9-f8c1b5f8e9f8',
      name: 'Test',
    });

    customerService.findOne.mockResolvedValueOnce(customer);

    const result = await controller.findOne(
      {
        user: { id: 'b0273fda-1977-469e-b376-6b49cceb0a6f', role: Role.admin },
      },
      '4e3f8f9b-f8c1-4b5f-b8e9-f8c1b5f8e9f8',
      {},
    );

    expect(result).toMatchObject({
      id: '4e3f8f9b-f8c1-4b5f-b8e9-f8c1b5f8e9f8',
      name: 'Test',
    });
  });

  it('should update a customer integration', async () => {
    expect(controller.updateIntegrations).toBeDefined();

    const data = {
      giroVisionId: '4e3f8f9b-f8c1-4b5f-b8e9-f8c1b5f8e9f8',
    };

    const integration = mockDeep<CustomerIntegration>({
      id: '4e3f8f9b-f8c1-4b5f-b8e9-f8c1b5f8e9f8',
      giroVisionId: '4e3f8f9b-f8c1-4b5f-b8e9-f8c1b5f8e9f8',
    });
    customerService.updateIntegrations.mockResolvedValueOnce(integration);

    const result = await controller.updateIntegrations(
      {
        user: { id: 'b0273fda-1977-469e-b376-6b49cceb0a6f', role: Role.admin },
      },
      '4e3f8f9b-f8c1-4b5f-b8e9-f8c1b5f8e9f8',
      data,
    );

    expect(result).toMatchObject({
      giroVisionId: '4e3f8f9b-f8c1-4b5f-b8e9-f8c1b5f8e9f8',
      id: '4e3f8f9b-f8c1-4b5f-b8e9-f8c1b5f8e9f8',
    });
  });

  it('should throw if a user is not allowed to update integration', async () => {
    expect(controller.updateIntegrations).toBeDefined();

    const data = {
      giroVisionId: '4e3f8f9b-f8c1-4b5f-b8e9-f8c1b5f8e9f8',
    };

    await expect(
      controller.updateIntegrations(
        {
          user: { id: 'b0273fda-1977-469e-b376-6b49cceb0a6f', role: Role.user },
        },
        '4e3f8f9b-f8c1-4b5f-b8e9-f8c1b5f8e9f8',
        data,
      ),
    ).rejects.toThrowError(errorCodes.AUTHORIZATION_REQUIRED);
  });

  it('should update settings', async () => {
    expect(controller.updateIntegrations).toBeDefined();
    const settings = mockDeep<CustomerSettings>({
      id: '4e3f8f9b-f8c1-4b5f-b8e9-f8c1b5f8e9f8',
      customerId: '123',
      perimeterViolationNumbers: '123123123',
      alarmActivatedNumbers: '123123123',
      badCompanyNumbers: '123123123',
      panicNumbers: '123123123',
      publicViolenceNumbers: '123123123',
    });
    customerService.updateSettings.mockResolvedValueOnce(settings);

    const result = await controller.updateSettings(
      {
        user: {
          id: 'b0273fda-1977-469e-b376-6b49cceb0a6f',
          role: Role.statesman,
          customerId: '123',
        },
      },
      '123',
      {
        perimeterViolationNumbers: '123123123',
        alarmActivatedNumbers: '123123123',
        badCompanyNumbers: '123123123',
        panicNumbers: '123123123',
        publicViolenceNumbers: '123123123',
      },
    );

    expect(result).toMatchObject({
      customerId: '123',
      perimeterViolationNumbers: '123123123',
      alarmActivatedNumbers: '123123123',
      badCompanyNumbers: '123123123',
      panicNumbers: '123123123',
      publicViolenceNumbers: '123123123',
    });
  });

  it('should throw setting', async () => {
    expect(controller.updateIntegrations).toBeDefined();

    expect(
      controller.updateSettings(
        {
          user: {
            id: 'b0273fda-1977-469e-b376-6b49cceb0a6f',
            role: Role.statesman,
            customerId: '12223',
          },
        },
        '123',
        {
          perimeterViolationNumbers: '123123123',
          alarmActivatedNumbers: '123123123',
          badCompanyNumbers: '123123123',
          panicNumbers: '123123123',
          publicViolenceNumbers: '123123123',
        },
      ),
    ).rejects.toThrowError(errorCodes.ACTION_NOT_ALLOWED);
  });

  it('should return a list of customers event categories', async () => {
    const customersEventCategories: CustomerEventCategories[] = mockDeep<
      CustomerEventCategories[]
    >([
      {
        id: '4e3f8f9b-4b5f-b8e9-f8c1b5f8e9f8',
        categoryId: '4e3f8f9b-f8c1-4b5f-b8e9-f8c1b5f8e9f8',
        customerId: 'f8c1-b8e9-4b5f-b8e9-f8c1b5f8e9f8',
      },
      {
        id: '4e3f8f9b-f8c1-4b5f-b8e9-f8c1b5f8e9f9',
        categoryId: '4e3f8f9b-b8e9-f8c1b5f8e9f8-4b5f-b8e9-b8e9',
        customerId: 'b8e9-dd-f8c1-4b5f-b8e9-asd',
      },
      {
        id: '4e3f8f9b-f8c1-4b5f-b8e9-f8c1b5f8e9f10',
        categoryId: '4e3f8f9b-b8e9-f8c1b5f8e9f8-b8e9-f8c1b5f8e9f8',
        customerId: 'b8e9-f8c1b5f8e9f8-sdf-4b5f-sdf-sdf',
      },
      {
        id: '4e3f8f9b-f8c1-4b5f-b8e9-f8c1b5f8e9f11',
        categoryId: 'b8e9-f8c1b5f8e9f8-f8c1-4b5f-b8e9-f8c1b5f8e9f8',
        customerId: 'b8e9-dfsdfsd-f8c1-4b5f-b8e9-f8c1b5f8e9f8',
      },
    ]);

    customerService.findAllEvents.mockResolvedValueOnce({
      results: customersEventCategories,
      pagination: {
        total: 4,
        size: 4,
        skip: 0,
        take: 10,
      },
    });

    const { results, pagination } = await controller.findAllEvents(
      {
        user: {
          id: 'b0273fda-1977-469e-b376-6b49cceb0a6f',
          customerId: 'b0273fda-1977-469e-b376-sdf123sgd',
          role: 'admin',
        },
      },
      'b0273fda-1977-469e-b376-sdf123sgd',
      {},
    );
    expect(results).toBeDefined();
    expect(results).toBeInstanceOf(Array);
    expect(results.length).toBe(4);

    results.forEach((item) => {
      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('categoryId');
      expect(item).toHaveProperty('customerId');
    });

    expect(pagination).toBeDefined();
    expect(pagination).toBeInstanceOf(Object);
    expect(pagination).toEqual({
      size: 4,
      total: 4,
      take: 10,
      skip: 0,
    });
  });

  it('should update', async () => {
    expect(controller.update).toBeDefined();

    const mock = mockDeep<CustomerEventCategories>({
      order: 2,
    });
    customerService.updateEvent.mockResolvedValueOnce(mock);

    const result = await controller.updateEvent(
      {
        user: {
          id: '234-234-234-234',
          updatedById: '123-234-456-678',
        },
      },
      '123-123-123-123',
      {
        order: 2,
      },
    );

    expect(result).toMatchObject({
      ...mock,
      order: 2,
    });
  });

  it('should throw error updating customer event category', async () => {
    expect(controller.updateEvent).toBeDefined();

    customerService.updateEvent.mockRejectedValueOnce(
      new ForbiddenException({
        error: 'Forbidden',
        statusCode: 403,
        message: 'INVALID_UPDATE_EVENT',
      }),
    );

    expect(
      controller.updateEvent(
        {
          user: {
            id: '234-234-234-234',
            updatedById: '123-234-456-678',
          },
        },
        '123-123-123-123',
        {
          order: 2,
        },
      ),
    ).rejects.toThrowError(
      new ForbiddenException({
        error: 'Forbidden',
        statusCode: 403,
        message: 'INVALID_UPDATE_EVENT',
      }),
    );
  });

  it('should return a customer by url', async () => {
    expect(controller.getCustomerByUrl).toBeDefined();

    const customer = {
      id: '4e3f8f9b-f8c1-4b5f-b8e9-f8c1b5f8e9f8',
      name: 'Test',
      image: {
        name: 'image.png',
        url: 'http://image.png',
        thumbnailUrl: 'http://thumbnail.image.png',
      },
      notes: 'No',
      speed: '20',
    };

    customerService.findFirst.mockResolvedValueOnce(customer);

    const result = await controller.getCustomerByUrl('http://url.map.com');

    expect(result).toStrictEqual(customer);
  });

  it('should return a customer by secret key', async () => {
    expect(controller.findCustomer).toBeDefined();

    const customer = {
      id: '4e3f8f9b-f8c1-4b5f-b8e9-f8c1b5f8e9f8',
      name: 'Test',
      secretKey: 'llaveScreta',
      image: {
        name: 'image.png',
        url: 'http://image.png',
        thumbnailUrl: 'http://thumbnail.image.png',
      },
      notes: 'No',
      speed: '20',
    };

    customerService.findFirst.mockResolvedValueOnce(customer);

    const result = await controller.findCustomer({
      secretKey: 'llaveSecreta',
    });

    expect(result).toStrictEqual(customer);
  });
});
