/* eslint-disable @typescript-eslint/ban-ts-comment */
import { CustomerType, Prisma, PrismaClient } from '@prisma/client';
import { createAdminUser } from './users';

type CustomerCreateInput = Partial<
  Omit<Prisma.CustomerCreateInput, 'updatedBy'>
> & {
  updatedBy: Prisma.CustomerCreateInput['updatedBy'];
};

export const createCustomer = async (
  prisma: PrismaClient,
  data: Prisma.CustomerCreateInput,
) => {
  const existAdminUser = await prisma.user.count({
    where: {
      role: 'admin',
      id: data.updatedBy?.connect?.id,
    },
  });

  if (!existAdminUser) {
    throw new Error('field updatedBy must to be admin');
  }

  return await prisma.customer.create({
    data: {
      ...data,
      settings: data?.settings,
      updatedBy: data?.updatedBy,
    },
    include: {
      integrations: true,
      settings: true,
      sections: true,
      alertTypes: {
        include: {
          alertType: true,
        },
        orderBy: {
          order: 'asc',
        },
      },
      eventCategories: {
        include: {
          category: true,
        },
        orderBy: {
          order: 'asc',
        },
      },
    },
  });
};

export const createBusinessCustomer = (
  prisma: PrismaClient,
  data: CustomerCreateInput,
) => {
  return createCustomer(prisma, {
    type: CustomerType.business,
    name: 'Test Country',
    state: 'Buenos Aires',
    district: 'San Fernando',
    country: 'Argentina',
    countryCode: '54',
    phoneLength: 10,
    url: 'test-country',
    notes: 'Respete las señales de transito y estacionamiento. Evite multas',
    ...data,
  });
};

export const createGovernmentCustomer = (
  prisma: PrismaClient,
  data: CustomerCreateInput,
) => {
  return createCustomer(prisma, {
    type: CustomerType.government,
    name: 'San Fernando',
    state: 'Buenos Aires',
    district: 'San Fernando',
    country: 'Argentina',
    countryCode: '54',
    phoneLength: 10,
    ...data,
  });
};

export const createBusinessCustomerAndAdmin = async (
  prisma: PrismaClient,
  data?: CustomerCreateInput,
) => {
  const user = await createAdminUser(prisma);
  const customer = await createBusinessCustomer(prisma, {
    ...data,
    updatedBy: {
      connect: {
        id: user.id,
      },
    },
  });

  return { user, customer };
};

export const createGovernmentCustomerAndAdmin = async (
  prisma: PrismaClient,
  data?: CustomerCreateInput,
) => {
  const user = await createAdminUser(prisma);
  const customer = await createGovernmentCustomer(prisma, {
    ...data,
    updatedBy: {
      connect: {
        id: user.id,
      },
    },
  });

  return { user, customer };
};
