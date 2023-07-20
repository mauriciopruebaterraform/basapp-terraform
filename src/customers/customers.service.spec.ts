import '../__test__/winston';
import {
  CustomerIntegration,
  CustomerSettings,
  CustomerEventCategory,
  Customer,
} from '@prisma/client';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../database/prisma.service';
import { CustomerService } from './customers.service';
import { PrismaServiceMock } from '../database/mocks/prisma.service';
import { mockDeep } from 'jest-mock-extended';
import { ICustomerWithAlertTypes } from '@src/interfaces/types';
import customerInputMock from './mocks/create-customer.dto';
import { errorCodes } from './customers.constants';

import {
  UnprocessableEntityException,
  ForbiddenException,
} from '@nestjs/common';

describe('CustomerService', () => {
  let service: CustomerService;
  let prisma: PrismaServiceMock;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomerService,
        {
          provide: PrismaService,
          useValue: PrismaServiceMock,
        },
      ],
    }).compile();

    service = module.get<CustomerService>(CustomerService);
    prisma = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return a customer by url', async () => {
    expect(service.findFirst).toBeDefined();

    const mockCustomer = mockDeep<Customer>({
      id: '4e3f8f9b-f8c1-4b5f-b8e9-f8c1b5f8e9f8',
      name: 'Test',
      image: {
        name: 'image.png',
        url: 'http://image.png',
        thumbnailUrl: 'http://thumbnail.image.png',
      },
      notes: 'No',
      speed: '20',
    });

    prisma.customer.findFirst.mockResolvedValueOnce(mockCustomer);

    const result = await service.findFirst({
      url: 'http://url.map.com',
    });

    expect(result).toMatchObject(mockCustomer);
  });

  describe('find customers', () => {
    it('should find customers', async () => {
      const customerMock = mockDeep<ICustomerWithAlertTypes>({
        ...customerInputMock,
        id: '4053ee9a-401c-4cb0-8f0a-4a9ef4811e21',
        image: {
          ...customerInputMock.image,
        },
        alertTypes: [
          {
            alertTypeId: customerInputMock.alertTypes[0],
            customerId: '4053ee9a-401c-4cb0-8f0a-4a9ef4811e21',
            alertType: {
              id: customerInputMock.alertTypes[0],
              type: 'speed',
              name: 'Test Alert',
            },
          },
        ],
        eventCategories: [],
        updatedById: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
      });

      prisma.customer.findMany.mockResolvedValueOnce([customerMock]);
      prisma.customer.count.mockResolvedValueOnce(1);
      const { results, pagination } = await service.findAll({});
      expect(results).toEqual([customerMock]);
      expect(pagination).toEqual({
        total: 1,
        take: 100,
        skip: 0,
        hasMore: false,
        size: 1,
      });
    });
  });

  describe('create customer', () => {
    it('should create customer', async () => {
      const customerMock = mockDeep<ICustomerWithAlertTypes>({
        ...customerInputMock,
        id: '4053ee9a-401c-4cb0-8f0a-4a9ef4811e21',
        image: {
          ...customerInputMock.image,
        },
        eventCategories: [
          {
            id: 'e7808f72-b682-4992-b449-e9adcb5d286f',
            order: 0,
            active: true,
            categoryId: 'c927a229-f62b-44b2-9df8-f03fd883bdeb',
            customerId: '6cfd57ff-dd24-4a9c-9088-86189d469d32',
            reservationTypeId: null,
            updatedById: '2b121c9e-f38d-4b28-a169-50d7b95c1d53',
            category: {
              id: 'c927a229-f62b-44b2-9df8-f03fd883bdeb',
              title: 'Caballos',
              active: true,
              image: {
                url: 'https://s3.amazonaws.com/uploads.demo.countries.basapp.com.ar/customer/d2966fb1-a30f-4e37-9110-46af19750b77.png',
                name: 'd2966fb1-a30f-4e37-9110-46af19750b77.png',
                thumbnailUrl:
                  'https://s3.amazonaws.com/uploads.demo.countries.basapp.com.ar/customer/d2966fb1-a30f-4e37-9110-46af19750b77-thumbnail.png',
              },
            },
          },
        ],
        alertTypes: [
          {
            alertTypeId: customerInputMock.alertTypes[0],
            customerId: '4053ee9a-401c-4cb0-8f0a-4a9ef4811e21',
            alertType: {
              id: customerInputMock.alertTypes[0],
              type: 'speed',
              name: 'Test Alert',
            },
          },
        ],
        sections: {
          alerts: false,
          events: true,
          notifications: true,
          reservations: true,
          protocols: true,
          usefulInformation: true,
          integrations: true,
          lots: true,
          cameras: true,
          locations: true,
        },
        updatedById: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
      });

      prisma.alertType.count.mockResolvedValueOnce(1);
      prisma.eventCategory.count.mockResolvedValueOnce(1);
      prisma.customer.create.mockResolvedValueOnce(customerMock);
      prisma.customer.findMany.mockResolvedValueOnce([]);
      const result = await service.create({
        ...customerInputMock,
        userId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
      });
      expect(result).toEqual(customerMock);
    });

    it('should throw error if event category type does no exit', async () => {
      prisma.alertType.count.mockResolvedValueOnce(1);
      prisma.eventCategory.count.mockResolvedValueOnce(0);
      await expect(
        service.create({
          ...customerInputMock,
          userId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
        }),
      ).rejects.toThrow(
        new UnprocessableEntityException(errorCodes.INVALID_EVENT_CATEGORY),
      );
    });

    it('should throw error if alert type does not exist', async () => {
      prisma.alertType.count.mockResolvedValueOnce(0);
      await expect(
        service.create({
          ...customerInputMock,
          userId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
        }),
      ).rejects.toThrow(
        new UnprocessableEntityException(errorCodes.INVALID_ALERT_TYPE),
      );
    });

    it('should throw error if customer name already exists', async () => {
      const mockCustomer = mockDeep<Customer>({
        ...customerInputMock,
        image: null,
        secretKey: '1234567111',
      });
      prisma.alertType.count.mockResolvedValueOnce(1);
      prisma.customer.findMany.mockResolvedValueOnce([mockCustomer]);
      prisma.customerEventCategory.findMany.mockResolvedValueOnce([]);
      prisma.eventCategory.count.mockResolvedValueOnce(1);

      await expect(
        service.create({
          ...customerInputMock,
          userId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
        }),
      ).rejects.toThrow(
        new UnprocessableEntityException(errorCodes.INVALID_NAME),
      );
    });

    it('should throw error if a customer exists with a given secretKey', async () => {
      const mockCustomer = mockDeep<Customer>({
        ...customerInputMock,
        image: null,
        name: 'alberto',
      });
      prisma.alertType.count.mockResolvedValueOnce(1);
      prisma.customer.findMany.mockResolvedValueOnce([mockCustomer]);
      prisma.customerEventCategory.findMany.mockResolvedValueOnce([]);
      prisma.eventCategory.count.mockResolvedValueOnce(1);

      await expect(
        service.create({
          ...customerInputMock,
          userId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
        }),
      ).rejects.toThrow(
        new UnprocessableEntityException(errorCodes.INVALID_SECRET_KEY),
      );
    });

    it('should throw error if a parent customer does not exist', async () => {
      prisma.alertType.count.mockResolvedValueOnce(1);
      prisma.eventCategory.count.mockResolvedValueOnce(1);
      prisma.customer.count.mockResolvedValueOnce(0);
      prisma.customer.findMany.mockResolvedValueOnce([]);

      await expect(
        service.create({
          ...customerInputMock,
          parent: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
          userId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
        }),
      ).rejects.toThrow(
        new UnprocessableEntityException({
          statusCode: 422,
          message: errorCodes.INVALID_CUSTOMER,
          error: 'There was an error processing parentId customer',
        }),
      );
    });
  });

  describe('update customer', () => {
    it('should update customer', async () => {
      const customerMock = mockDeep<ICustomerWithAlertTypes>({
        ...customerInputMock,
        id: '4053ee9a-401c-4cb0-8f0a-4a9ef4811e21',
        name: 'Updated Customer',
        image: {
          ...customerInputMock.image,
        },
        eventCategories: [
          {
            id: 'e7808f72-b682-4992-b449-e9adcb5d286f',
            order: 0,
            active: true,
            categoryId: 'c927a229-f62b-44b2-9df8-f03fd883bdeb',
            customerId: '6cfd57ff-dd24-4a9c-9088-86189d469d32',
            reservationTypeId: null,
            updatedById: '2b121c9e-f38d-4b28-a169-50d7b95c1d53',
            category: {
              id: 'c927a229-f62b-44b2-9df8-f03fd883bdeb',
              title: 'Caballos',
              active: true,
              image: {
                url: 'https://s3.amazonaws.com/uploads.demo.countries.basapp.com.ar/customer/d2966fb1-a30f-4e37-9110-46af19750b77.png',
                name: 'd2966fb1-a30f-4e37-9110-46af19750b77.png',
                thumbnailUrl:
                  'https://s3.amazonaws.com/uploads.demo.countries.basapp.com.ar/customer/d2966fb1-a30f-4e37-9110-46af19750b77-thumbnail.png',
              },
            },
          },
        ],
        alertTypes: [
          {
            alertTypeId: customerInputMock.alertTypes[0],
            customerId: '4053ee9a-401c-4cb0-8f0a-4a9ef4811e21',
            alertType: {
              id: customerInputMock.alertTypes[0],
              type: 'speed',
              name: 'Test Alert',
            },
          },
        ],
        updatedById: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
      });

      prisma.customer.findUnique.mockResolvedValueOnce(customerMock);
      prisma.alertType.count.mockResolvedValueOnce(1);
      prisma.$transaction.mockResolvedValueOnce([customerMock]);
      prisma.customerEventCategory.findMany.mockResolvedValueOnce([]);

      const result = await service.update(
        '4053ee9a-401c-4cb0-8f0a-4a9ef4811e21',
        {
          name: 'Updated Customer',
          userId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
        },
      );
      expect(result).toEqual(customerMock);
    });

    it('should throw error if alert type does not exist', async () => {
      const customerMock = mockDeep<ICustomerWithAlertTypes>();
      prisma.customer.findUnique.mockResolvedValueOnce(customerMock);
      prisma.alertType.count.mockResolvedValueOnce(0);
      await expect(
        service.update('4053ee9a-401c-4cb0-8f0a-4a9ef4811e21', {
          ...customerInputMock,
          userId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
        }),
      ).rejects.toThrow(
        new UnprocessableEntityException(errorCodes.INVALID_ALERT_TYPE),
      );
    });

    it('should throw error if customer name already exists', async () => {
      const customerMock = mockDeep<ICustomerWithAlertTypes>({
        name: 'mauricio',
      });
      prisma.customer.findUnique.mockResolvedValueOnce(customerMock);
      prisma.alertType.count.mockResolvedValueOnce(1);
      prisma.customer.findMany.mockResolvedValueOnce([
        {
          ...customerMock,
          name: 'alberto',
          secretKey: '123123',
        },
      ]);
      prisma.customerEventCategory.findMany.mockResolvedValueOnce([]);
      prisma.eventCategory.count.mockResolvedValueOnce(1);

      await expect(
        service.update('4053ee9a-401c-4cb0-8f0a-4a9ef4811e21', {
          ...customerInputMock,
          name: 'alberto',
          userId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
        }),
      ).rejects.toThrow(
        new UnprocessableEntityException(errorCodes.INVALID_NAME),
      );
    });

    it('should throw error if a customer exists with a given secretKey', async () => {
      const customerMock = mockDeep<ICustomerWithAlertTypes>();
      prisma.customer.findUnique.mockResolvedValueOnce(customerMock);
      prisma.alertType.count.mockResolvedValueOnce(1);
      prisma.customer.findMany.mockResolvedValueOnce([
        {
          ...customerMock,
          secretKey: '123',
          name: 'andres',
        },
      ]);
      prisma.eventCategory.count.mockResolvedValueOnce(1);
      prisma.customerEventCategory.findMany.mockResolvedValueOnce([]);

      await expect(
        service.update('4053ee9a-401c-4cb0-8f0a-4a9ef4811e21', {
          ...customerInputMock,
          secretKey: '123',
          userId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
        }),
      ).rejects.toThrow(
        new UnprocessableEntityException(errorCodes.INVALID_SECRET_KEY),
      );
    });

    it('should throw error if a parent customer does not exist', async () => {
      const customerMock = mockDeep<ICustomerWithAlertTypes>();
      prisma.customer.findUnique.mockResolvedValueOnce(customerMock);
      prisma.alertType.count.mockResolvedValueOnce(1);
      prisma.eventCategory.count.mockResolvedValueOnce(1);
      prisma.customer.findMany.mockResolvedValueOnce([]);
      prisma.customerEventCategory.findMany.mockResolvedValueOnce([]);

      await expect(
        service.update('4053ee9a-401c-4cb0-8f0a-4a9ef4811e21', {
          ...customerInputMock,
          parent: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
          userId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
        }),
      ).rejects.toThrow(
        new UnprocessableEntityException({
          statusCode: 422,
          message: errorCodes.INVALID_CUSTOMER,
          error: 'There was an error processing parentId customer',
        }),
      );
    });

    it('should throw error if customer does not exist', async () => {
      prisma.customer.findUnique.mockResolvedValueOnce(null);
      prisma.alertType.count.mockResolvedValueOnce(1);
      prisma.customer.count.mockResolvedValueOnce(0);

      await expect(
        service.update('4053ee9a-401c-4cb0-8f0a-4a9ef4811e21', {
          ...customerInputMock,
          userId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
        }),
      ).rejects.toThrow(
        new UnprocessableEntityException(errorCodes.CUSTOMER_NOT_FOUND),
      );
    });
  });

  describe('find one customer', () => {
    it('should return a customer', async () => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const customer = mockDeep<ICustomer>();
      prisma.customer.findUnique.mockResolvedValueOnce(customer);
      const result = await service.findOne(
        '4053ee9a-401c-4cb0-8f0a-4a9ef4811e21',
      );

      expect(result).toEqual(customer);
    });

    it('should return null if customer does not exist', async () => {
      prisma.customer.findUnique.mockResolvedValueOnce(null);

      const result = await service.findOne(
        'f3a8f8f8-f3a8-f3a8-f3a8-f3a8f8f8f8f8',
      );

      expect(result).toBeNull();
      expect(prisma.customer.findUnique).toHaveBeenCalledWith({
        where: {
          id: 'f3a8f8f8-f3a8-f3a8-f3a8-f3a8f8f8f8f8',
        },
      });

      expect(prisma.customer.findUnique).toHaveBeenCalledTimes(1);
    });
  });

  describe('update customer integration', () => {
    it('should update customer integration', async () => {
      const customerMock = mockDeep<Customer>();
      const integrationMock = mockDeep<CustomerIntegration>();
      prisma.customer.findUnique.mockResolvedValueOnce(customerMock);
      prisma.customerIntegration.update.mockResolvedValueOnce(integrationMock);

      const result = await service.updateIntegrations(
        '4053ee9a-401c-4cb0-8f0a-4a9ef4811e21',
        {
          giroVisionId: 'girovisionId',
        },
        'userId',
      );

      expect(result).toEqual(integrationMock);

      expect(prisma.customerIntegration.update).toHaveBeenCalledWith({
        where: {
          customerId: '4053ee9a-401c-4cb0-8f0a-4a9ef4811e21',
        },
        data: {
          giroVisionId: 'girovisionId',
          updatedBy: {
            connect: {
              id: 'userId',
            },
          },
        },
      });

      expect(prisma.customerIntegration.update).toHaveBeenCalledTimes(1);
    });
  });

  describe('update customer settings', () => {
    it('should update customer settings', async () => {
      expect(service.updateSettings).toBeDefined();

      const searchingSettings = mockDeep<CustomerSettings>({
        id: '4e3f8f9b-f8c1-4b5f-b8e9-f8c1b5f8e9f8',
      });
      const settings = mockDeep<CustomerSettings>({
        id: '4e3f8f9b-f8c1-4b5f-b8e9-f8c1b5f8e9f8',
        customerId: '123',
        perimeterViolationNumbers: '123123123',
        alarmActivatedNumbers: '123123123',
        badCompanyNumbers: '123123123',
        panicNumbers: '123123123',
        publicViolenceNumbers: '123123123',
      });
      prisma.customerSettings.findUnique.mockResolvedValueOnce(
        searchingSettings,
      );
      prisma.customerSettings.update.mockResolvedValueOnce(settings);

      const result = await service.updateSettings(
        '123',
        {
          perimeterViolationNumbers: '123123123',
          alarmActivatedNumbers: '123123123',
          badCompanyNumbers: '123123123',
          panicNumbers: '123123123',
          publicViolenceNumbers: '123123123',
        },
        '4e3f8f9b-f8c1-4b5f-b8e9-f8c1b5f8e9f8',
      );

      expect(result).toMatchObject(settings);

      expect(prisma.customerSettings.update).toHaveBeenCalledWith({
        where: {
          id: expect.any(String),
        },
        data: {
          perimeterViolationNumbers: '123123123',
          alarmActivatedNumbers: '123123123',
          badCompanyNumbers: '123123123',
          panicNumbers: '123123123',
          publicViolenceNumbers: '123123123',
          updatedBy: {
            connect: {
              id: '4e3f8f9b-f8c1-4b5f-b8e9-f8c1b5f8e9f8',
            },
          },
        },
      });

      expect(prisma.customerSettings.update).toHaveBeenCalledTimes(1);
    });
  });

  describe('should find customer event categories', () => {
    it('find all customer event categories', async () => {
      const customerEventCategories = mockDeep<CustomerEventCategory>({
        id: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
        updatedById: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
        active: true,
        categoryId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
        customerId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
        order: 0,
      });

      prisma.customerEventCategory.findMany.mockResolvedValueOnce([
        customerEventCategories,
      ]);
      prisma.customerEventCategory.count.mockResolvedValueOnce(1);
      const { results, pagination } = await service.findAllEvents({});
      expect(results).toEqual([customerEventCategories]);
      expect(pagination).toEqual({
        total: 1,
        take: 100,
        skip: 0,
        hasMore: false,
        size: 1,
      });
    });
  });

  describe('update customer event categories', () => {
    it('should throw error finding relating', async () => {
      prisma.customerEventCategory.findFirst.mockResolvedValueOnce(null);

      expect(
        service.updateEvent('123-132-123-123-123', {
          order: 3,
          updatedById: '123-132-123-456-466',
          customerId: '123-132-123-123-123',
        }),
      ).rejects.toThrow(
        new UnprocessableEntityException({
          message: errorCodes.EVENT_NOT_FOUND,
        }),
      );
    });

    it('should throw error different customerId', async () => {
      const mock = mockDeep<CustomerEventCategory>({
        customerId: '456-132-123-123-123',
      });
      prisma.customerEventCategory.findFirst.mockResolvedValueOnce(mock);

      expect(
        service.updateEvent('123-132-123-123-123', {
          order: 3,
          updatedById: '123-132-123-456-466',
          customerId: '123-132-123-123-123',
        }),
      ).rejects.toThrow(
        new ForbiddenException({
          error: 'Forbidden',
          statusCode: 403,
          message: errorCodes.INVALID_UPDATE_EVENT,
        }),
      );
    });

    it('should update', async () => {
      const mock = mockDeep<CustomerEventCategory>({
        id: 'asd-asd-asd-asdasd',
        order: 3,
        updatedById: '123-132-123-456-466',
        customerId: '123-132-123-123-123',
      });
      prisma.customerEventCategory.findFirst.mockResolvedValueOnce(mock);
      prisma.customerEventCategory.update.mockResolvedValueOnce(mock);

      const result = await service.updateEvent('123-132-123-123-123', {
        order: 3,
        updatedById: '123-132-123-456-466',
        customerId: '123-132-123-123-123',
      });
      expect(result).toMatchObject(mock);
    });
  });
});
