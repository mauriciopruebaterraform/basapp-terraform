import { Prisma, PrismaClient, Role } from '@prisma/client';
import { Model } from '../seed';
import * as bcrypt from 'bcryptjs';
import { constants, finalUser, authorizedUser } from '../utils/constants';

const {
  SAN_FERNANDO_ID,
  TEST_COUNTRY_ID,
  MONITORING_SAN_FERNANDO,
  STATESMAN,
  MONITOR,
  USER_ADMIN_ID,
} = constants;
const {
  FINAL_USER_FERNANDO,
  FINAL_USER_NERINA,
  FINAL_USER_SAN_FERNANDO,
  FINAL_USER_GUIDO,
  FINAL_USER_MAURICIO,
} = finalUser;

const { AUTHORIZED_USER_MAURICIO } = authorizedUser;

const hashedPassword = bcrypt.hashSync('sg2021BAS', 10);

const model: Model & { data: Prisma.UserCreateInput[] } = {
  data: [
    {
      id: MONITOR,
      firstName: 'Monitoring',
      lastName: 'Country',
      fullName: 'Monitoring Country',
      username: 'monitor-cyb@sysgarage.com',
      password: hashedPassword,
      role: Role.monitoring,
      active: true,
      customerId: TEST_COUNTRY_ID,
      userPermissions: {
        create: {},
      },
    },
    {
      id: STATESMAN,
      firstName: 'Estadista',
      lastName: 'Country',
      fullName: 'Estadista Country',
      username: 'estadista-cyb@sysgarage.com',
      password: hashedPassword,
      role: Role.statesman,
      active: true,
      customerId: TEST_COUNTRY_ID,
      userPermissions: {
        create: {},
      },
    },
    {
      id: MONITORING_SAN_FERNANDO,
      firstName: 'Monitoring Municipio',
      lastName: 'San Fernando',
      fullName: 'Monitoring San Fernando',
      username: 'monitor-mun@sysgarage.com',
      password: hashedPassword,
      role: Role.monitoring,
      active: true,
      customerId: SAN_FERNANDO_ID,
      userPermissions: {
        create: {},
      },
    },
    {
      firstName: 'Estadista Municipio',
      lastName: 'San Fernando',
      fullName: 'Estadista San Fernando',
      username: 'estadista-mun@sysgarage.com',
      password: hashedPassword,
      role: Role.statesman,
      active: true,
      customerId: SAN_FERNANDO_ID,
      userPermissions: {
        create: {},
      },
    },
    {
      firstName: 'test prueba',
      lastName: 'correos',
      fullName: 'test prueba correos',
      username: 'estadista@sysgarage.test',
      password: hashedPassword,
      role: Role.statesman,
      active: true,
      customerId: SAN_FERNANDO_ID,
      userPermissions: {
        create: {},
      },
    },
    {
      firstName: 'test prueba 1',
      lastName: 'numeros',
      fullName: 'test prueba 1 numeros',
      username: '541148253698',
      password: hashedPassword,
      role: Role.user,
      customerType: 'business',
      active: true,
      customerId: TEST_COUNTRY_ID,
    },
    {
      firstName: 'test prueba 2',
      lastName: 'numeros',
      fullName: 'test prueba 2 numeros',
      username: '541148253678',
      password: hashedPassword,
      role: Role.user,
      customerType: 'business',
      active: true,
      customerId: TEST_COUNTRY_ID,
    },
    {
      firstName: 'test prueba 3',
      lastName: 'numeros',
      fullName: 'test prueba 3 numeros',
      username: '541166480622',
      password: hashedPassword,
      role: Role.user,
      customerType: 'business',
      active: true,
      customerId: TEST_COUNTRY_ID,
    },
    {
      firstName: 'testing',
      lastName: 'change password',
      fullName: 'testing change password',
      username: 'password@sysgarage.test',
      password: hashedPassword,
      role: Role.admin,
      active: true,
      userPermissions: {
        create: {},
      },
    },
    {
      id: FINAL_USER_FERNANDO,
      username: '541150281459',
      verificationCode: '201914',
      createdAt: new Date('2021-11-05 09:57:34.726'),
      password: hashedPassword,
      firstName: 'Fernando',
      lastName: 'Bello',
      fullName: 'Fernando Bello',
      status: 'active',
      pushId: '495a7cb2-a607-11ec-a592-02f2e64235a7',
      role: 'user',
      customerType: 'business',
      image: {
        name: '8f84df8d-444a-4fc4-b161-c6b9f8cdf88d.jpg',
        url: 'https://s3.amazonaws.com/uploads.basapp.com.ar/users/image/8f84df8d-444a-4fc4-b161-c6b9f8cdf88d.jpg',
        thumbnailUrl:
          'https://s3.amazonaws.com/uploads.basapp.com.ar/users/image/8f84df8d-444a-4fc4-b161-c6b9f8cdf88d-thumbnail.jpg',
      },
      updatedAt: new Date('2021-11-05 09:57:34.726'),
      customerId: TEST_COUNTRY_ID,
      lot: '15',
      idCard: '33111222',
      lastStateUpdatedTime: new Date('2021-11-05 09:57:34.726'),
      stateUpdatedUserId: STATESMAN,
      lastAccessToMenu: new Date('2021-11-05 09:57:34.726'),
    },
    {
      id: FINAL_USER_SAN_FERNANDO,
      username: '541166281422',
      createdAt: new Date('2021-11-05 09:57:34.726'),
      password: hashedPassword,
      firstName: 'Guido',
      lastName: 'Bello',
      fullName: 'Guido Bello',
      status: 'active',
      role: 'user',
      customerType: 'government',
      updatedAt: new Date('2021-11-05 09:57:34.726'),
      customerId: SAN_FERNANDO_ID,
      lastStateUpdatedTime: new Date('2021-11-05 09:57:34.726'),
      stateUpdatedUserId: STATESMAN,
      lastAccessToMenu: new Date('2021-11-05 09:57:34.726'),
    },
    {
      id: FINAL_USER_NERINA,
      password: hashedPassword,
      firstName: 'Nerina',
      lastName: 'Capital',
      fullName: 'Nerina Capital',
      username: '541123199052',
      lot: '504',
      status: 'registered',
      pushId: '6b7bd8c0-e394-4b27-ab30-b5d5faa9df45',
      role: 'user',
      image: {
        name: '3ba8b71b-717c-4f73-841c-8a3ad273f95c.jpg',
        url: 'https://s3.amazonaws.com/uploads.countries.basapp.com.ar/users/image/3ba8b71b-717c-4f73-841c-8a3ad273f95c.jpg',
        thumbnailUrl:
          'https://s3.amazonaws.com/uploads.countries.basapp.com.ar/users/image/3ba8b71b-717c-4f73-841c-8a3ad273f95c-thumbnail.jpg',
      },
      createdAt: new Date('2021-11-05 09:57:34.726'),
      updatedAt: new Date('2021-11-05 09:57:34.726'),
      customerType: 'business',
      customerId: TEST_COUNTRY_ID,
      lastAccessToMenu: new Date('2021-11-05 09:57:34.726'),
    },
    {
      id: FINAL_USER_GUIDO,
      password: hashedPassword,
      firstName: 'Guido',
      lastName: 'Capital',
      fullName: 'Guido Capital',
      username: '541161755226',
      lot: '504',
      status: 'registered',
      pushId: '6b7bd8c0-e394-4b27-ab30-b5d5faa9df45',
      role: 'user',
      customerType: 'business',
      image: {
        name: '3ba8b71b-717c-4f73-841c-8a3ad273f95c.jpg',
        url: 'https://s3.amazonaws.com/uploads.countries.basapp.com.ar/users/image/3ba8b71b-717c-4f73-841c-8a3ad273f95c.jpg',
        thumbnailUrl:
          'https://s3.amazonaws.com/uploads.countries.basapp.com.ar/users/image/3ba8b71b-717c-4f73-841c-8a3ad273f95c-thumbnail.jpg',
      },
      createdAt: new Date('2021-11-05 09:57:34.726'),
      updatedAt: new Date('2021-11-05 09:57:34.726'),
      customerId: TEST_COUNTRY_ID,
      lastAccessToMenu: new Date('2021-11-05 09:57:34.726'),
    },
    {
      id: FINAL_USER_MAURICIO,
      authorizedUser: {
        create: {
          id: AUTHORIZED_USER_MAURICIO,
          firstName: 'Mauricio',
          lastName: 'Gallego',
          username: '1166480626',
          lot: '504',
          description: null,
          sendEvents: true,
          customerId: TEST_COUNTRY_ID,
          createdAt: new Date(),
          updatedAt: new Date(),
          expireDate: null,
          updatedById: USER_ADMIN_ID,
          isOwner: true,
        },
      },
      password: hashedPassword,
      firstName: 'Mauricio',
      lastName: 'Capital',
      fullName: 'Mauricio Capital',
      username: '541166480626',
      lot: '504',
      customerType: 'business',
      status: 'registered',
      pushId: '6b7bd8c0-e394-4b27-ab30-b5d5faa9df45',
      role: 'user',
      image: {
        name: '3ba8b71b-717c-4f73-841c-8a3ad273f95c.jpg',
        url: 'https://s3.amazonaws.com/uploads.countries.basapp.com.ar/users/image/3ba8b71b-717c-4f73-841c-8a3ad273f95c.jpg',
        thumbnailUrl:
          'https://s3.amazonaws.com/uploads.countries.basapp.com.ar/users/image/3ba8b71b-717c-4f73-841c-8a3ad273f95c-thumbnail.jpg',
      },
      createdAt: new Date('2021-11-05 09:57:34.726'),
      updatedAt: new Date('2021-11-05 09:57:34.726'),
      customer: {
        connect: {
          id: TEST_COUNTRY_ID,
        },
      },
      lastAccessToMenu: new Date('2021-11-05 09:57:34.726'),
    },
  ],
  async run(prisma: PrismaClient) {
    for (const user of this.data) {
      await prisma.user.create({
        data: user,
      });
    }

    return true;
  },
};

export default model;
