import { Prisma, PrismaClient } from '@prisma/client';
import { Model } from '../seed';

const model: Model & { data: Prisma.PermissionCreateInput[] } = {
  data: [
    {
      id: '3051dd96-c11d-427f-8031-93319b9ec5bf',
      action: 'deactivate-locations',
      name: 'Desactivar localidades y barrios',
      category: 'locations',
      monitoring: false,
      statesman: true,
    },
    {
      id: '8cf37c80-fda9-4218-acc0-56fa82688ab4',
      action: 'create-holidays',
      name: 'Crear feriados',
      category: 'reservation',
      monitoring: false,
      statesman: true,
    },
    {
      id: '84ff60e0-0f48-467b-b206-5b58e5fdbf23',
      action: 'list-holidays',
      name: 'Listar feriados',
      category: 'reservation',
      monitoring: false,
      statesman: true,
    },
    {
      id: 'f20d627f-dd4d-40ac-a996-fbef7d3f75c6',
      action: 'modify-holidays',
      name: 'Modificar feriados',
      category: 'reservation',
      monitoring: false,
      statesman: true,
    },
    {
      id: '65ce091c-78e8-49df-be45-d4002cc6532c',
      action: 'create-reservation-locks',
      name: 'Crear bloqueo de reservas',
      category: 'reservation',
      monitoring: false,
      statesman: true,
    },
    {
      id: 'd038fc2e-aef4-48ca-9a7a-c9fcbacabe9f',
      action: 'list-reservation-locks',
      name: 'Listar bloqueos de reservas',
      category: 'reservation',
      monitoring: false,
      statesman: true,
    },
    {
      id: '753e2f9d-5b69-430e-a168-54c9f2a81819',
      action: 'modify-reservation-locks',
      name: 'Modificar bloqueo de reservas',
      category: 'reservation',
      monitoring: false,
      statesman: true,
    },
    {
      id: 'fddc7c7c-6d35-43e7-be6f-34fd4a11da73',
      action: 'list-locations',
      name: 'Listar localidades y barrios',
      category: 'locations',
      monitoring: false,
      statesman: true,
    },
    {
      id: '1efeea2c-cf0f-429a-8be7-97c5b99e4b44',
      action: 'modify-locations',
      name: 'Modificar localidades y barrios',
      category: 'locations',
      monitoring: false,
      statesman: true,
    },
    {
      id: 'a6d7ba81-3795-43e6-9e80-0dcbde546ba6',
      action: 'create-locations',
      name: 'Crear localidades y barrios',
      category: 'locations',
      monitoring: false,
      statesman: true,
    },
    {
      id: '799c4674-ab27-4bdf-9ff1-a79fd22ab31b',
      action: 'monitor-alert',
      name: 'Monitoreo de alertas',
      category: 'alert',
      statesman: true,
    },
    {
      id: '0072ba56-cd93-4562-a643-f0981d116262',
      action: 'attend-alert',
      name: 'Atender alertas',
      category: 'alert',
      statesman: true,
    },
    {
      id: 'd85dada8-26d1-453b-8e9b-d55085576c59',
      action: 'monitor-event',
      name: 'Monitoreo de eventos',
      category: 'event',
      statesman: true,
    },
    {
      id: '3ef4053c-03a8-4374-985b-4e9374aa5353',
      action: 'attend-event',
      name: 'Atender eventos',
      category: 'event',
      statesman: true,
    },
    {
      id: '5de30f5c-8fd5-4986-ad22-bf0a73a1cfa1',
      action: 'monitor-reservation',
      name: 'Monitoreo de reservas',
      category: 'reservation',
      statesman: true,
    },
    {
      id: 'bf266d48-38b4-4c10-98fd-1920241e79d7',
      action: 'attend-reservation',
      name: 'Atender reservas',
      category: 'reservation',
      statesman: true,
    },
    {
      id: '58b29672-2e92-443b-be5f-22d251ba8ca1',
      action: 'request-authorization',
      name: 'Solicitar autorización',
      category: 'event',
      statesman: true,
    },
    {
      id: '9ce63e13-0b6b-44b1-9bac-0d69e78633be',
      action: 'list-authorizations',
      name: 'Listar solicitudes de autorización',
      category: 'event',
      statesman: true,
    },
    {
      id: '8d63c567-acf3-49bd-a84a-7a185a690441',
      action: 'create-reservation',
      name: 'Crear reserva',
      category: 'reservation',
      statesman: true,
    },
    {
      id: 'ad6ad4ff-7e54-4f08-add7-7c5a42e505ad',
      action: 'alert-statistics',
      name: 'Ver estadísticas de alertas',
      category: 'alert',
      statesman: true,
    },
    {
      id: '10d1d756-4e6f-4464-a9c7-2423462110b9',
      action: 'list-alerts',
      name: 'Listar alertas',
      category: 'alert',
      statesman: true,
    },
    {
      id: '29e95e97-d26d-47dd-973d-c339f6512017',
      action: 'event-statistics',
      name: 'Ver estadísticas de eventos',
      category: 'event',
      statesman: true,
    },
    {
      id: '3b5dac84-3205-435c-965d-f5153aca9b3f',
      action: 'list-events',
      name: 'Listar eventos',
      category: 'event',
      statesman: true,
    },
    {
      id: 'c62f67fc-6071-410d-bc21-5ba467d02d73',
      action: 'create-event',
      name: 'Registrar eventos',
      category: 'event',
      statesman: true,
    },
    {
      id: '830c6a95-e4aa-4a23-a452-f928253629eb',
      action: 'list-reservations',
      name: 'Listar reservas',
      category: 'reservation',
      statesman: true,
    },
    {
      id: 'daa23ff1-fa74-4f9a-b459-e299326e2c71',
      action: 'create-notification',
      name: 'Enviar notificaciones masivas',
      category: 'notification',
      statesman: true,
    },
    {
      id: '53601000-aabf-4c07-9d78-7e23ce89bc34',
      action: 'list-notifications',
      name: 'Listar notificaciones enviadas',
      category: 'notification',
      statesman: true,
    },
    {
      id: '66a9f182-a220-4826-9037-08e383e1067f',
      action: 'list-notification-templates',
      name: 'Listar plantillas de notificaciones',
      category: 'notification',
      statesman: true,
    },
    {
      id: '85b079f4-5932-4bbf-9b6d-00f27917a0b5',
      action: 'create-notification-template',
      name: 'Crear plantillas de notificaciones',
      category: 'notification',
      statesman: true,
    },
    {
      id: 'ea66179c-d424-4589-9b88-4c8047cba7ec',
      action: 'modify-notification-template',
      name: 'Modificar plantillas de notificaciones',
      category: 'notification',
      statesman: true,
    },
    {
      id: 'a0abcc4d-2db9-4f66-a33b-8ad3b4731865',
      action: 'list-users',
      name: 'Listar usuarios',
      category: 'user',
      statesman: true,
    },
    {
      id: '49cd664b-6816-45e5-896c-0dce5c10ab93',
      action: 'create-user',
      name: 'Crear usuarios',
      category: 'user',
      statesman: true,
    },
    {
      id: 'd4e8ebb5-709e-4fb1-99b3-c512761b5a88',
      action: 'modify-user',
      name: 'Modificar usuarios',
      category: 'user',
      statesman: true,
    },
    {
      id: 'ebe267bb-308e-4c68-85ce-b044ca2cb9c3',
      action: 'deactivate-user',
      name: 'Desactivar usuarios',
      category: 'user',
      statesman: true,
    },
    {
      id: '21192eb2-8dfc-49e5-ae42-9f50b81e960b',
      action: 'configure-customer',
      name: 'Configurar cliente',
      category: 'customer',
      statesman: true,
      monitoring: false,
    },
    {
      id: 'd90bc43d-7923-4a47-bb3d-120a3317fe83',
      action: 'modify-integrations',
      name: 'Modificar integraciones',
      category: 'customer',
      statesman: true,
    },
    {
      id: '4854ca50-89ff-4313-b77e-d74fb36df9ae',
      action: 'list-authorized-users',
      name: 'Listar usuarios habilitados',
      category: 'user',
      statesman: true,
    },
    {
      id: 'e85a8c21-0943-485b-8cd4-33ade1b884e2',
      action: 'create-authorized-user',
      name: 'Crear usuarios habilitados',
      category: 'user',
      statesman: true,
    },
    {
      id: '86f1512e-93d9-4e2f-92c1-31002e83d1fb',
      action: 'modify-authorized-user',
      name: 'Modificar usuarios habilitados',
      category: 'user',
      statesman: true,
    },
    {
      id: 'c5080346-0fc6-4d72-98fc-00a3eccedf6d',
      action: 'deactivate-authorized-user',
      name: 'Desactivar usuarios habilitados',
      category: 'user',
      statesman: true,
    },
    {
      id: '94ecb21e-8f3d-4c8f-94d9-a0ebba82e2df',
      action: 'list-cameras',
      name: 'Listar cámaras',
      category: 'camera',
      statesman: true,
    },
    {
      id: '50b13c4f-bc49-4ca0-af07-b292300efadf',
      action: 'create-camera',
      name: 'Crear cámaras',
      category: 'camera',
      statesman: true,
    },
    {
      id: '7e9a016e-019f-41a8-bec0-b4333c1c116a',
      action: 'modify-camera',
      name: 'Modificar cámaras',
      category: 'camera',
      statesman: true,
    },
    {
      id: 'f3b22b16-697b-431e-83d4-d0e802c49892',
      action: 'deactivate-camera',
      name: 'Desactivar cámaras',
      category: 'camera',
      statesman: true,
    },
    {
      id: '132f515c-0d2d-457c-adb6-bbca525bc0d0',
      action: 'list-lots',
      name: 'Listar lotes',
      category: 'lot',
      statesman: true,
    },
    {
      id: '80635a59-3d11-4c1d-a32e-c4941af96178',
      action: 'create-lot',
      name: 'Crear lotes',
      category: 'lot',
      statesman: true,
    },
    {
      id: '12b1c13b-93f1-4ded-9a19-b18c4d6f8268',
      action: 'modify-lot',
      name: 'Modificar lotes',
      category: 'lot',
      statesman: true,
    },
    {
      id: 'e20c9266-2252-40e4-a0ec-ae20b48dc10e',
      action: 'deactivate-lot',
      name: 'Desactivar lotes',
      category: 'lot',
      statesman: true,
    },
    {
      id: 'd4609376-fd8c-43f6-823f-50e7787bcf87',
      action: 'list-useful-information',
      name: 'Listar información útil',
      category: 'useful-information',
      statesman: true,
    },
    {
      id: 'f7e8984a-9bd0-4804-8eee-2f131e49453b',
      action: 'create-useful-information',
      name: 'Crear información útil',
      category: 'useful-information',
      statesman: true,
    },
    {
      id: 'ec836518-32f1-4af9-8694-c2c9cb74164e',
      action: 'modify-useful-information',
      name: 'Modificar información útil',
      category: 'useful-information',
      statesman: true,
    },
    {
      id: '028e0cfe-e852-4118-9f14-9c59cb2ce5d7',
      action: 'deactivate-useful-information',
      name: 'Desactivar información útil',
      category: 'useful-information',
      statesman: true,
    },
    {
      id: 'a7d3c62c-55df-49cf-b7c4-98572338f043',
      action: 'list-protocols',
      name: 'Listar protocolos',
      category: 'protocol',
      statesman: true,
    },
    {
      id: '833dafcd-a704-4ef1-ae2d-a370021d628d',
      action: 'create-protocol',
      name: 'Crear protocolos',
      category: 'protocol',
      statesman: true,
    },
    {
      id: '0df5c722-5732-4d44-9a27-2c3e72fbfb8f',
      action: 'modify-protocol',
      name: 'Modificar protocolos',
      category: 'protocol',
      statesman: true,
    },
    {
      id: '19809622-2d11-486d-b8df-b22e524ed4ac',
      action: 'deactivate-protocol',
      name: 'Desactivar protocolos',
      category: 'protocol',
      statesman: true,
    },
    {
      id: 'bf094071-418b-49bf-8445-718d277c8603',
      action: 'list-alert-states',
      name: 'Listar estados de alertas',
      category: 'alert',
      statesman: true,
    },
    {
      id: '91603062-6c2a-4094-a642-3b32feaf0cc1',
      action: 'create-alert-state',
      name: 'Crear estados de alertas',
      category: 'alert',
      statesman: true,
    },
    {
      id: '10177fc8-7410-4840-9882-f82d239d085a',
      action: 'modify-alert-state',
      name: 'Modificar estados de alertas',
      category: 'alert',
      statesman: true,
    },
    {
      id: 'b38a654e-08f6-40fc-ad5f-b25b906c0639',
      action: 'deactivate-alert-state',
      name: 'Desactivar estados de alertas',
      category: 'alert',
      statesman: true,
    },
    {
      id: '278df34b-59db-411a-be40-52de42b82dc3',
      action: 'list-event-types',
      name: 'Listar tipos de eventos',
      category: 'event',
      statesman: true,
    },
    {
      id: '826cee14-897d-4076-9e56-29e088ff5a88',
      action: 'create-event-type',
      name: 'Crear tipos de eventos',
      category: 'event',
      statesman: true,
    },
    {
      id: '883698fc-228b-48c7-823f-619eb4938bc8',
      action: 'modify-event-type',
      name: 'Modificar tipos de eventos',
      category: 'event',
      statesman: true,
    },
    {
      id: '13ce4131-f324-4bff-ae2e-da82862b8fe3',
      action: 'deactivate-event-type',
      name: 'Desactivar tipos de eventos',
      category: 'event',
      statesman: true,
    },
    {
      id: '68f8876b-27e0-4a3c-8372-8d039f99fd4e',
      action: 'list-event-states',
      name: 'Listar estados de eventos',
      category: 'event',
      statesman: true,
    },
    {
      id: 'd1567825-e85b-4502-bdaa-915a15ed67af',
      action: 'create-event-state',
      name: 'Crear estados de eventos',
      category: 'event',
      statesman: true,
    },
    {
      id: '54533a16-a25c-4d94-be20-299e42c2d1ee',
      action: 'modify-event-state',
      name: 'Modificar estados de eventos',
      category: 'event',
      statesman: true,
    },
    {
      id: '55009487-aa9f-4c94-9171-f18d443b6d8d',
      action: 'deactivate-event-state',
      name: 'Desactivar estados de eventos',
      category: 'event',
      statesman: true,
    },
    {
      id: '33c2e25f-e60c-443d-b234-ce43ffb0bcc7',
      action: 'configure-category',
      name: 'Configurar categorías de eventos',
      category: 'event',
      statesman: true,
    },
    {
      id: '80b8b5eb-dfa9-4c09-bf63-c041d9676def',
      action: 'list-reservation-types',
      name: 'Listar tipos de reservas',
      category: 'reservation',
      statesman: true,
    },
    {
      id: '7a842174-a2cd-4ef6-b0fc-f97b36d12b56',
      action: 'create-reservation-type',
      name: 'Crear tipos de reservas',
      category: 'reservation',
      statesman: true,
    },
    {
      id: 'baccaaf6-d68b-4528-9321-7e2ba2cf0e47',
      action: 'modify-reservation-type',
      name: 'Modificar tipos de reservas',
      category: 'reservation',
      statesman: true,
    },
    {
      id: '54859dbd-b660-4c9f-a6de-6b208f92d061',
      action: 'deactivate-reservation-type',
      name: 'Desactivar tipos de reservas',
      category: 'reservation',
      statesman: true,
    },
    {
      id: 'a2808140-2769-431f-9915-8a7c4c9a3d22',
      action: 'list-reservation-spaces',
      name: 'Listar espacios y canchas',
      category: 'reservation',
      statesman: true,
    },
    {
      id: '68b02996-0add-4ba5-b50b-62abac20f5e9',
      action: 'create-reservation-spaces',
      name: 'Crear espacios y canchas',
      category: 'reservation',
      statesman: true,
    },
    {
      id: 'e4cb3d4c-757e-47c3-a54d-d0d4eaae7b80',
      action: 'modify-reservation-spaces',
      name: 'Modificar espacios y canchas',
      category: 'reservation',
      statesman: true,
    },
    {
      id: '7e519e19-b22a-4877-9e1b-6d5a877b3cfd',
      action: 'deactivate-reservation-spaces',
      name: 'Desactivar espacios y canchas',
      category: 'reservation',
      statesman: true,
    },
    {
      id: '024f0029-7579-4068-84f9-e839574e1a68',
      action: 'list-reservation-modes',
      name: 'Listar modalidades de reservas',
      category: 'reservation',
      statesman: true,
    },
    {
      id: '62bd43c3-940c-4d1a-a0e8-c62182c77947',
      action: 'create-reservation-mode',
      name: 'Crear modalidades de reservas',
      category: 'reservation',
      statesman: true,
    },
    {
      id: '0a57e24c-0410-458b-ab0d-2d50cd1ef34c',
      action: 'modify-reservation-mode',
      name: 'Modificar modalidades de reservas',
      category: 'reservation',
      statesman: true,
    },
    {
      id: '2afef13d-7c53-49cd-9e35-7475a8c257d9',
      action: 'deactivate-reservation-mode',
      name: 'Desactivar modalidades de reservas',
      category: 'reservation',
      statesman: true,
    },
  ],
  async run(prisma: PrismaClient) {
    return prisma.permission.createMany({
      data: this.data,
      skipDuplicates: true,
    });
  },
};

export default model;