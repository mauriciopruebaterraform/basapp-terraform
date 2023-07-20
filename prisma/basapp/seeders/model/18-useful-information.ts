import { Prisma, PrismaClient } from '@prisma/client';
import { Model } from '../seed';
import { constants } from '../utils/constants';

const { USER_ADMIN_ID, TEST_COUNTRY_ID } = constants;

const model: Model & { data: Prisma.UsefulInformationCreateManyInput[] } = {
  data: [
    {
      code: '800',
      title: 'FAQ BASAPP',
      isCategory: false,
      link: null,
      description: null,
      customerId: TEST_COUNTRY_ID,
      categoryId: null,
      updatedById: USER_ADMIN_ID,
      createdAt: new Date(),
      attachment: {
        name: 'f79cea09-4b19-4490-9e46-9c3ac86cceb3.pdf',
        url: 'https://api.countries.basapp.com.ar/v1/usefulInformation/attachment/f79cea09-4b19-4490-9e46-9c3ac86cceb3.pdf',
      },
    },
    {
      id: '155889a5-a7fa-4e23-82c7-0c22b4b5c2ca',
      code: '100',
      title: 'BASAPP-Como se usa -',
      isCategory: true,
      link: null,
      description: null,
      active: true,
      customerId: TEST_COUNTRY_ID,
      categoryId: null,
      updatedById: USER_ADMIN_ID,
      createdAt: new Date(),
    },
    {
      code: '101',
      title: 'no emitir fraude',
      isCategory: false,
      link: null,
      description: null,
      active: false,
      customerId: TEST_COUNTRY_ID,
      categoryId: null,
      updatedById: USER_ADMIN_ID,
      createdAt: new Date(),
    },
    {
      code: '001',
      title: 'Como emitir Alerta',
      isCategory: false,
      link: 'https://youtu.be/P4O3KJX-JlA',
      description: null,
      customerId: TEST_COUNTRY_ID,
      categoryId: '155889a5-a7fa-4e23-82c7-0c22b4b5c2ca',
      updatedById: USER_ADMIN_ID,
      createdAt: new Date(),
    },
    {
      code: 'c02',
      title: 'Aplicacion COVID-19 del  Ministerio de Salud de la Nación',
      isCategory: false,
      link: 'https://play.google.com/store/apps/details?id=ar.gob.coronavirus',
      description:
        '<p></p><div class="W4P4ne " style="font-size: 14px;text-align: left;"><div class="PHBdkd"><div class="DWPxHb"><div>Coronavirus Covid-19 es la app oficial del Ministerio de Salud de la Nación y tiene como objetivo que los argentinos y las argentinas puedan realizarse un rápido autodiagnóstico para saber si sus síntomas son compatibles con el COVID-19 .<br/>La aplicación tiene las siguientes características:<br/><br/></div><div>-Información sobre diversos temas (síntomas, cómo prevenirlos, qué hacer en caso de sospecha e infección, etc).<br/><br/></div><div>-En caso de sospecha de infección, los ciudadanos recibirán instrucciones y serán remitidos al centro de salud más cercano;<br/><br/></div><div>-Información oficial del Ministerio de Salud en relación al Coronavirus.</div></div></div></div><p><br/></p><p><br/></p><p></p>',
      customerId: TEST_COUNTRY_ID,
      updatedById: USER_ADMIN_ID,
      categoryId: null,
    },
  ],
  async run(prisma: PrismaClient) {
    return prisma.usefulInformation.createMany({
      data: this.data,
      skipDuplicates: true,
    });
  },
};

export default model;
