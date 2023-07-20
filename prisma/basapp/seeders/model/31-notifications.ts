import { Prisma, PrismaClient } from '@prisma/client';
import { Model } from '../seed';

const model: Model & { data: Prisma.NotificationCreateManyInput[] } = {
  data: [
    {
      title: 'APERTURA DEL PUENTE',
      description:
        'SE PROCEDERÁ CON LA APERTURA DEL PUENTE POR EGRESO DE EMBARCACIÓN',
      createdAt: new Date('2022-08-13 16:25:37'),
      userId: '126d14a6-6a1f-46f7-a798-a45016848c90',
      customerId: 'a7e63a98-bcdf-4c9d-8041-8d82e2b9e8a1',
      emergency: false,
      fromLot: null,
      toLot: null,
      authorizationRequestId: null,
      notificationType: 'massive',
    },
    {
      title:
        'MARTES 16.08.2022: ESTACIONAMIENTO CASUARINAS cerrado x poda y DESVIOS.',
      description: `Sr. Copropietario.
      Se informa que desde las 08:00 hasta las 17:00 hs. del día martes 16.08.2022, el ESTACIONAMIENTO del SECTOR de CASUARINAS, permanecerá CERRADO por trabajos de poda. 
      Por otro lado se informa que a partir de las 08.00 hs. del día martes 16.08.2022 se llevaran a cabo tareas de poda en las casuarinas ubicadas entre la zona de la uf 22 y la Casa Vieja. 
   Por cuando -por tramos breves de tiempo- se verá interrumpido el transito normal, por favor prestar atención a las indicaciones de desvío y del personal de seguridad y/o mantenimiento.
   Solicitamos las disculpas del caso por las molestias ocasionadas
   Atte. 
   Adm. gccc`,
      createdAt: new Date('2022-08-13 14:44:11'),
      userId: '126d14a6-6a1f-46f7-a798-a45016848c90',
      customerId: '1bb5fadd-056d-4faa-afd9-a141928dff4a',
      emergency: false,
      fromLot: null,
      toLot: null,
      authorizationRequestId: null,
      notificationType: 'massive',
    },
    {
      title: 'HORARIOS del DOMINGO 14.08.2022 y del FERIADO 15.08.2022',
      description: `Sr. Copropietario 
      Se informan los horarios de la administración y de la recolección de residuos del DOMINGO 14.08.2022 y del FERIADO del 15.08.2022.
      
                                           << ADMINISTRACION >> 
      - Sábado 13.08.2022: de 08:00 a 12:00 y de 12:30 a 17:30 hs. 
      - Domingo 14.08.2022: de 08:00 a 12:00 y de 12:30 a 16:30 hs. 
      - Lunes FERIADO 15.08.2022: de 08:00 a 12:00 y de 12:30 a 16:30 hs.
      
                                   << RECOLECCIÓN de RESIDUOS >> 
      - Sábado 13.08.2022: 10 horas.
      - Domingo 14.08.2022: NO habrá recolección de residuos.
      - Lunes FERIADO 15.08.2022: NO habrá recolección de residuos
      
      Atte. Adm. gccc`,
      createdAt: new Date('2022-08-13 14:25:52'),
      userId: '126d14a6-6a1f-46f7-a798-a45016848c90',
      customerId: '1bb5fadd-056d-4faa-afd9-a141928dff4a',
      emergency: false,
      fromLot: null,
      toLot: null,
      authorizationRequestId: null,
      notificationType: 'massive',
    },
    {
      title: 'Prueba de funcionamiento del puente',
      description:
        'Informamos que se procederá a efectuar la prueba de funcionamiento del puente.',
      createdAt: new Date('2022-08-13 11:49:43'),
      userId: '126d14a6-6a1f-46f7-a798-a45016848c90',
      customerId: 'a7e63a98-bcdf-4c9d-8041-8d82e2b9e8a1',
      emergency: false,
      fromLot: null,
      toLot: null,
      authorizationRequestId: null,
      notificationType: 'massive',
    },
    {
      title: 'Club House',
      description: `Les informamos que el Club  House estará cerrado por evento el Domingo a la noche y el Lunes al mediodía. El dia
      Martes el concesionario no brindará servicios durante toda la jornada.`,
      createdAt: new Date('2022-08-12 19:33:25'),
      userId: '126d14a6-6a1f-46f7-a798-a45016848c90',
      customerId: 'a7e63a98-bcdf-4c9d-8041-8d82e2b9e8a1',
      emergency: false,
      fromLot: null,
      toLot: null,
      authorizationRequestId: null,
      notificationType: 'massive',
    },
    {
      title: 'recepción de paquetería',
      description:
        'Estimado/a vecino/a, le informamos que se recibió en guardia un paquete para su lote ',
      createdAt: new Date('2022-08-12 16:36:04'),
      userId: '126d14a6-6a1f-46f7-a798-a45016848c90',
      customerId: 'a7e63a98-bcdf-4c9d-8041-8d82e2b9e8a1',
      image: 'null',
      emergency: false,
      fromLot: '007',
      toLot: '007',
      authorizationRequestId: null,
      notificationType: 'massive',
    },
    {
      title: 'recepción de paquetería',
      description:
        'Estimado/a vecino/a, le informamos que se recibió en guardia un paquete para su lote ',
      createdAt: new Date('2022-08-12 16:09:14'),
      userId: '126d14a6-6a1f-46f7-a798-a45016848c90',
      customerId: 'a7e63a98-bcdf-4c9d-8041-8d82e2b9e8a1',
      image: 'null',
      emergency: false,
      fromLot: '107',
      toLot: '107',
      authorizationRequestId: null,
      notificationType: 'massive',
    },
    {
      title: 'recepción de paquetería',
      description:
        'Estimado/a vecino/a, le informamos que se recibió en guardia un paquete para su lote ',
      createdAt: new Date('2022-08-12 16:09:05'),
      userId: '126d14a6-6a1f-46f7-a798-a45016848c90',
      customerId: 'a7e63a98-bcdf-4c9d-8041-8d82e2b9e8a1',
      image: 'null',
      emergency: false,
      fromLot: '012',
      toLot: '012',
      authorizationRequestId: null,
      notificationType: 'massive',
    },
    {
      title: 'recepción de paquetería',
      description:
        'Estimado/a vecino/a, le informamos que se recibió en guardia un paquete para su lote ',
      createdAt: new Date('2022-08-12 16:08:14'),
      userId: '126d14a6-6a1f-46f7-a798-a45016848c90',
      customerId: 'a7e63a98-bcdf-4c9d-8041-8d82e2b9e8a1',
      image: 'null',
      emergency: false,
      fromLot: '046',
      toLot: '046',
      authorizationRequestId: null,
      notificationType: 'massive',
    },
    {
      title: 'INFORMACION AGOSTO 2022',
      description: `Sr. copropietario
      Como continúan los inconvenientes en el envió masivo de mail desde las direcciones del Golf Chascomús C.C., se informa que se haya a disposición en el basapp y en la página web del consorcio la información correspondiente de agosto 2022:
      •	Acta N° 560
      •	Saldos al 01.08.2022
      •	Ingresos y egresos al 31.07.2022
      •	Normas de convivencia agosto 2022
      Por cualquier inconveniente puede solicitar a la administración del consorcio, vía mail o WhatsApp, la información precedente.
      Estamos trabajando para solucionar a la brevedad posible los inconvenientes, una vez solucionado se enviara la información vía mail.
      Pedimos disculpas por las molestias ocasionadas.
      Atte.
      Adm.gccc`,
      createdAt: new Date('2022-08-12 14:07:55'),
      userId: '126d14a6-6a1f-46f7-a798-a45016848c90',
      customerId: '1bb5fadd-056d-4faa-afd9-a141928dff4a',
      emergency: false,
      fromLot: null,
      toLot: null,
      authorizationRequestId: null,
      notificationType: 'massive',
    },
    {
      title: 'IMPORTANTE: CORTE DE LUZ PROGRAMADO VIERNES 12',
      description: `Estimados socios:
      Comunicamos lo informado por la empresa EDENOR sobre el corte de suministro que se va a realizar el día viernes 12 de Agosto de 8 a 17 hs por tareas de mantenimiento de la empresa.`,
      createdAt: new Date('2022-08-10 17:25:00'),
      userId: '126d14a6-6a1f-46f7-a798-a45016848c90',
      customerId: 'a7e63a98-bcdf-4c9d-8041-8d82e2b9e8a1',
      image: {
        container: 'notifications_image',
        name: 'afeac245-5c26-4525-8f71-bf49c4e4c401.png',
        type: 'image/png',
        size: 28949,
        url: 'https://s3.amazonaws.com/uploads.countries.basapp.com.ar/notifications/image/afeac245-5c26-4525-8f71-bf49c4e4c401.png',
        resizedUrl:
          'https://s3.amazonaws.com/uploads.countries.basapp.com.ar/notifications/image/afeac245-5c26-4525-8f71-bf49c4e4c401-1024w-1024h.png',
        thumbnailUrl:
          'https://s3.amazonaws.com/uploads.countries.basapp.com.ar/notifications/image/afeac245-5c26-4525-8f71-bf49c4e4c401-thumbnail.png',
      },
      emergency: false,
      fromLot: null,
      toLot: null,
      authorizationRequestId: null,
      notificationType: 'massive',
    },
    {
      title: 'Anteproyecto Huarte',
      description: `Podrás visualizar el anteproyecto presentado por el Arq. Rodolfo Huarte en la reunión de ayer, martes 9 de agosto. Dirigiéndote al Menú de la aplicación Basapp (tres líneas). Eligiendo el primer ítem, Anteproyecto Huarte 08-22.
  
      Sino podrás solicitarlo a cvera@avn-nordelta.com ó a mtorregiani@avn-nordelta.com
      
      Agradecemos a los integrantes de la Comisión Ad Hoc y les recordamos que en la Asamblea del próximo 22 de agosto se elegirá entre el proyecto adjunto y el presentado semanas atrás por el Arq. Ignacio Ramos.`,
      createdAt: new Date('2022-08-10 17:17:57'),
      userId: '126d14a6-6a1f-46f7-a798-a45016848c90',
      customerId: 'a7e63a98-bcdf-4c9d-8041-8d82e2b9e8a1',
      emergency: false,
      fromLot: null,
      toLot: null,
      authorizationRequestId: null,
      notificationType: 'massive',
    },
    {
      title: 'Anteproyecto estudio Huarte',
      description: `Adjuntamos el link del anteproyecto presentado por el Arq. Rodolfo Huarte en la reunión de ayer, martes 9 de agosto.
  
      https://u15236847.ct.sendgrid.net/ls/click?upn=OL8lCwdEwW7-2FLOklmni2dL5347OHyz4fzqsEJLOSqj5Pq2KLifhS8aL2g3oUAhAhU-2F57QsP6elNJmvVbK1SyPZaNFttuDbYnwdGnuoJ21szEN3L9D4jaEyEaYT4mR2rgEFzCrRhAZ2dY10uUxSmzdQ-3D-3DlHiW_LicyJFRvSMThLBkFyNgfi-2B5qTjczG7SPPsB6GEy3IKupb7shEi7MIH1F5YDbGdtejX6M2zOyActPbpN-2B3SBuhmowEGAfrmBbEPd75q4P8KSLbH6AO7oObNfbI6to7nAn25Ef3B1wgOj-2BCxPmOSff-2FbQegPLSCb-2Fbb85CoDi58sVfaSMx0sWgPutU2ygLBDKYgLTpQXnggC7m9q5kc0vN6QMLHJsWcF7yaXucCFDpSNI-3D
      
      Agradecemos a los integrantes de la Comisión Ad Hoc y les recordamos que en la Asamblea del próximo 22 de agosto se elegirá entre el proyecto adjunto y el presentado semanas atrás por el Arq. Ignacio Ramos.`,
      createdAt: new Date('2022-08-10 15:13:57'),
      userId: '126d14a6-6a1f-46f7-a798-a45016848c90',
      customerId: 'a7e63a98-bcdf-4c9d-8041-8d82e2b9e8a1',
      emergency: false,
      fromLot: '100',
      toLot: '100',
      authorizationRequestId: null,
      notificationType: 'massive',
    },
    {
      title: 'Reunión: proyecto para el área recreativa y deportiva',
      description: `Te recordamos la invitación a la reunión que se realizará hoy martes 9 de agosto a las 19:00 horas con el fin de presentar el proyecto para el área recreativa y deportiva del barrio a cargo del Estudio Huarte. 
      Esta reunión se llevará a cabo de manera presencial en el Club House del barrio.
      Te esperamos.`,
      createdAt: new Date('2022-08-09 16:17:30'),
      userId: '126d14a6-6a1f-46f7-a798-a45016848c90',
      customerId: 'a7e63a98-bcdf-4c9d-8041-8d82e2b9e8a1',
      emergency: false,
      fromLot: null,
      toLot: null,
      authorizationRequestId: null,
      notificationType: 'massive',
    },
    {
      title: 'Mascota extraviada',
      description: 'Se perdió Pipa, gato Bengalí Gris.',
      createdAt: new Date('2022-08-09 16:10:26'),
      userId: '126d14a6-6a1f-46f7-a798-a45016848c90',
      customerId: 'a7e63a98-bcdf-4c9d-8041-8d82e2b9e8a1',
      image: {
        container: 'notifications_image',
        name: 'a6377cf5-8377-4e05-9f11-9bcfe3077732.jpeg',
        type: 'image/jpeg',
        size: 118677,
        url: 'https://s3.amazonaws.com/uploads.countries.basapp.com.ar/notifications/image/a6377cf5-8377-4e05-9f11-9bcfe3077732.jpeg',
        resizedUrl:
          'https://s3.amazonaws.com/uploads.countries.basapp.com.ar/notifications/image/a6377cf5-8377-4e05-9f11-9bcfe3077732-1024w-1024h.jpeg',
        thumbnailUrl:
          'https://s3.amazonaws.com/uploads.countries.basapp.com.ar/notifications/image/a6377cf5-8377-4e05-9f11-9bcfe3077732-thumbnail.jpeg',
      },
      emergency: false,
      fromLot: null,
      toLot: null,
      authorizationRequestId: null,
      notificationType: 'massive',
    },
    {
      title: 'TENIS: ACTIVIDADES e INFORMACION',
      description: `Sr. copropietario
      Se informa que a partir del día de la fecha, 9 de agosto de 2022, permanecerá cerrada la cancha de tenis nro.6, por el termino de una semana para realizar trabajos de mantenimiento y recambio de postes de red.
      Por otro lado se informa que el día 20 de agosto se llevara a cabo un torneo de tenis de menores, para lo cual quedaran afectadas 4 canchas de 09.00 a 18.00 hs, destinando para uso exclusivo de la copropiedad 2 canchas de tenis en dicha franja horaria.
   atte.
   adm. gccc `,
      createdAt: new Date('2022-08-09 13:38:39'),
      userId: '126d14a6-6a1f-46f7-a798-a45016848c90',
      customerId: '1bb5fadd-056d-4faa-afd9-a141928dff4a',
      image: {
        container: 'notifications_image',
        name: '049794d0-dcea-4584-8d29-68dd0ead96c5.jpg',
        type: 'image/jpeg',
        size: 69846,
        url: 'https://s3.amazonaws.com/uploads.countries.basapp.com.ar/notifications/image/049794d0-dcea-4584-8d29-68dd0ead96c5.jpg',
        resizedUrl:
          'https://s3.amazonaws.com/uploads.countries.basapp.com.ar/notifications/image/049794d0-dcea-4584-8d29-68dd0ead96c5-1024w-1024h.jpg',
        thumbnailUrl:
          'https://s3.amazonaws.com/uploads.countries.basapp.com.ar/notifications/image/049794d0-dcea-4584-8d29-68dd0ead96c5-thumbnail.jpg',
      },
      emergency: false,
      fromLot: null,
      toLot: null,
      authorizationRequestId: null,
      notificationType: 'massive',
    },
    {
      title: 'recepción de paquetería',
      description:
        'Estimado/a vecino/a, le informamos que se recibió en guardia un paquete para su lote ',
      createdAt: new Date('2022-08-09 12:49:52'),
      userId: '126d14a6-6a1f-46f7-a798-a45016848c90',
      customerId: 'a7e63a98-bcdf-4c9d-8041-8d82e2b9e8a1',
      image: 'null',
      emergency: false,
      fromLot: '136',
      toLot: '136',
      authorizationRequestId: null,
      notificationType: 'massive',
    },
    {
      title: 'recepción de paquetería',
      description:
        'Estimado/a vecino/a, le informamos que se recibió en guardia un paquete para su lote ',
      createdAt: new Date('2022-08-09 12:49:41'),
      userId: '126d14a6-6a1f-46f7-a798-a45016848c90',
      customerId: 'a7e63a98-bcdf-4c9d-8041-8d82e2b9e8a1',
      image: 'null',
      emergency: false,
      fromLot: '131',
      toLot: '131',
      authorizationRequestId: null,
      notificationType: 'massive',
    },
    {
      title: 'recepción de paquetería',
      description:
        'Estimado/a vecino/a, le informamos que se recibió en guardia un paquete para su lote ',
      createdAt: new Date('2022-08-09 12:49:29'),
      userId: '126d14a6-6a1f-46f7-a798-a45016848c90',
      customerId: 'a7e63a98-bcdf-4c9d-8041-8d82e2b9e8a1',
      image: 'null',
      emergency: false,
      fromLot: '107',
      toLot: '107',
      authorizationRequestId: null,
      notificationType: 'massive',
    },
    {
      title: 'Prueba de funcionamiento del puente',
      description:
        'Informamos que se procederá a efectuar la prueba de funcionamiento del puente.',
      createdAt: new Date('2022-08-06 12:03:51'),
      userId: '126d14a6-6a1f-46f7-a798-a45016848c90',
      customerId: 'a7e63a98-bcdf-4c9d-8041-8d82e2b9e8a1',
      emergency: false,
      fromLot: null,
      toLot: null,
      authorizationRequestId: null,
      notificationType: 'massive',
    },
    {
      title: 'recepción de paquetería',
      description:
        'Estimado/a vecino/a, le informamos que se recibió en guardia un paquete para su lote ',
      createdAt: new Date('2022-08-05 17:11:51'),
      userId: '126d14a6-6a1f-46f7-a798-a45016848c90',
      customerId: 'a7e63a98-bcdf-4c9d-8041-8d82e2b9e8a1',
      image: 'null',
      emergency: false,
      fromLot: '253',
      toLot: '253',
      authorizationRequestId: null,
      notificationType: 'massive',
    },
    {
      title: 'recepción de paquetería',
      description:
        'Estimado/a vecino/a, le informamos que se recibió en guardia un paquete para su lote ',
      createdAt: new Date('2022-08-05 17:11:17'),
      userId: '126d14a6-6a1f-46f7-a798-a45016848c90',
      customerId: 'a7e63a98-bcdf-4c9d-8041-8d82e2b9e8a1',
      image: 'null',
      emergency: false,
      fromLot: '006',
      toLot: '006',
      authorizationRequestId: null,
      notificationType: 'massive',
    },
    {
      title: 'recepción de paquetería',
      description:
        'Estimado/a vecino/a, le informamos que se recibió en guardia un paquete para su lote ',
      createdAt: new Date('2022-08-05 17:11:03'),
      userId: '126d14a6-6a1f-46f7-a798-a45016848c90',
      customerId: 'a7e63a98-bcdf-4c9d-8041-8d82e2b9e8a1',
      image: 'null',
      emergency: false,
      fromLot: '204',
      toLot: '204',
      authorizationRequestId: null,
      notificationType: 'massive',
    },
    {
      title: 'recepción de paquetería',
      description:
        'Estimado/a vecino/a, le informamos que se recibió en guardia un paquete para su lote ',
      createdAt: new Date('2022-08-04 16:57:20'),
      userId: '126d14a6-6a1f-46f7-a798-a45016848c90',
      customerId: 'a7e63a98-bcdf-4c9d-8041-8d82e2b9e8a1',
      image: 'null',
      emergency: false,
      fromLot: '069',
      toLot: '069',
      authorizationRequestId: null,
      notificationType: 'massive',
    },
    {
      title: 'recepción de paquetería',
      description:
        'Estimado/a vecino/a, le informamos que se recibió en guardia un paquete para su lote ',
      createdAt: new Date('2022-08-04 15:48:35'),
      userId: '126d14a6-6a1f-46f7-a798-a45016848c90',
      customerId: 'a7e63a98-bcdf-4c9d-8041-8d82e2b9e8a1',
      image: 'null',
      emergency: false,
      fromLot: '035',
      toLot: '035',
      authorizationRequestId: null,
      notificationType: 'massive',
    },
    {
      title: 'recepción de paquetería',
      description:
        'Estimado/a vecino/a, le informamos que se recibió en guardia un paquete para su lote ',
      createdAt: new Date('2022-08-04 15:48:19'),
      userId: '126d14a6-6a1f-46f7-a798-a45016848c90',
      customerId: 'a7e63a98-bcdf-4c9d-8041-8d82e2b9e8a1',
      image: 'null',
      emergency: false,
      fromLot: '01',
      toLot: '01',
      authorizationRequestId: null,
      notificationType: 'massive',
    },
    {
      title: 'recepción de paquetería',
      description:
        'Estimado/a vecino/a, le informamos que se recibió en guardia un paquete para su lote ',
      createdAt: new Date('2022-08-04 14:06:38'),
      userId: '126d14a6-6a1f-46f7-a798-a45016848c90',
      customerId: 'a7e63a98-bcdf-4c9d-8041-8d82e2b9e8a1',
      image: 'null',
      emergency: false,
      fromLot: '107',
      toLot: '107',
      authorizationRequestId: null,
      notificationType: 'massive',
    },
    {
      title: 'Evento en el Club House 05/08/22',
      description:
        'Señores vecinos, les queremos informar que el dia viernes 05/08 se realizarán dos eventos en el Club House, por tal motivo se verá afectado  el servicio de restorant y delivery',
      createdAt: new Date('2022-08-04 12:45:03'),
      userId: '126d14a6-6a1f-46f7-a798-a45016848c90',
      customerId: 'a7e63a98-bcdf-4c9d-8041-8d82e2b9e8a1',
      emergency: false,
      fromLot: null,
      toLot: null,
      authorizationRequestId: null,
      notificationType: 'massive',
    },
    {
      title: 'recepción de paquetería',
      description:
        'Estimado/a vecino/a, le informamos que se recibió en guardia un paquete para su lote ',
      createdAt: new Date('2022-08-03 19:50:08'),
      userId: '126d14a6-6a1f-46f7-a798-a45016848c90',
      customerId: 'a7e63a98-bcdf-4c9d-8041-8d82e2b9e8a1',
      image: 'null',
      emergency: false,
      fromLot: '012',
      toLot: '012',
      authorizationRequestId: null,
      notificationType: 'massive',
    },
    {
      title: 'recepción de paquetería',
      description:
        'Estimado/a vecino/a, le informamos que se recibió en guardia un paquete para su lote ',
      createdAt: new Date('2022-08-03 19:49:52'),
      userId: '126d14a6-6a1f-46f7-a798-a45016848c90',
      customerId: 'a7e63a98-bcdf-4c9d-8041-8d82e2b9e8a1',
      image: 'null',
      emergency: false,
      fromLot: '107',
      toLot: '107',
      authorizationRequestId: null,
      notificationType: 'massive',
    },
    {
      title: 'Corte de Energia',
      description:
        'Se informa a los vecinos que habra un corte de energia en el dia de hoy de 14hs a 17hs',
      createdAt: new Date('2022-08-03 19:24:26'),
      userId: '126d14a6-6a1f-46f7-a798-a45016848c90',
      customerId: 'a7e63a98-bcdf-4c9d-8041-8d82e2b9e8a1',
      image: {
        container: 'notifications_image',
        name: '5e07ad4e-1d86-428b-be54-2d6235fa0159.png',
        type: 'image/png',
        size: 55541,
        url: 'https://s3.amazonaws.com/uploads.countries.basapp.com.ar/notifications/image/5e07ad4e-1d86-428b-be54-2d6235fa0159.png',
        resizedUrl:
          'https://s3.amazonaws.com/uploads.countries.basapp.com.ar/notifications/image/5e07ad4e-1d86-428b-be54-2d6235fa0159-1024w-1024h.png',
        thumbnailUrl:
          'https://s3.amazonaws.com/uploads.countries.basapp.com.ar/notifications/image/5e07ad4e-1d86-428b-be54-2d6235fa0159-thumbnail.png',
      },
      emergency: false,
      fromLot: null,
      toLot: null,
      authorizationRequestId: null,
      notificationType: 'massive',
    },
    {
      title: 'recepción de paquetería',
      description:
        'Estimado/a vecino/a, le informamos que se recibió en guardia un paquete para su lote ',
      createdAt: new Date('2022-08-03 16:30:46'),
      userId: '126d14a6-6a1f-46f7-a798-a45016848c90',
      customerId: 'a7e63a98-bcdf-4c9d-8041-8d82e2b9e8a1',
      image: 'null',
      emergency: false,
      fromLot: '131',
      toLot: '131',
      authorizationRequestId: null,
      notificationType: 'massive',
    },
    {
      title: 'recepción de paquetería',
      description:
        'Estimado/a vecino/a, le informamos que se recibió en guardia un paquete para su lote ',
      createdAt: new Date('2022-08-03 16:11:16'),
      userId: '126d14a6-6a1f-46f7-a798-a45016848c90',
      customerId: 'a7e63a98-bcdf-4c9d-8041-8d82e2b9e8a1',
      image: 'null',
      emergency: false,
      fromLot: '154',
      toLot: '154',
      authorizationRequestId: null,
      notificationType: 'massive',
    },
    {
      title: 'recepción de paquetería',
      description:
        'Estimado/a vecino/a, le informamos que se recibió en guardia un paquete para su lote ',
      createdAt: new Date('2022-08-03 16:11:00'),
      userId: '126d14a6-6a1f-46f7-a798-a45016848c90',
      customerId: 'a7e63a98-bcdf-4c9d-8041-8d82e2b9e8a1',
      image: 'null',
      emergency: false,
      fromLot: '035',
      toLot: '035',
      authorizationRequestId: null,
      notificationType: 'massive',
    },
    {
      title: 'recepción de paquetería',
      description:
        'Estimado/a vecino/a, le informamos que se recibió en guardia un paquete para su lote ',
      createdAt: new Date('2022-08-03 16:10:42'),
      userId: '126d14a6-6a1f-46f7-a798-a45016848c90',
      customerId: 'a7e63a98-bcdf-4c9d-8041-8d82e2b9e8a1',
      image: 'null',
      emergency: false,
      fromLot: '007',
      toLot: '007',
      authorizationRequestId: null,
      notificationType: 'massive',
    },
    {
      title: 'recepción de paquetería',
      description:
        'Estimado/a vecino/a, le informamos que se recibió en guardia un paquete para su lote ',
      createdAt: new Date('2022-08-03 16:09:20'),
      userId: '126d14a6-6a1f-46f7-a798-a45016848c90',
      customerId: 'a7e63a98-bcdf-4c9d-8041-8d82e2b9e8a1',
      image: 'null',
      emergency: false,
      fromLot: '048',
      toLot: '048',
      authorizationRequestId: null,
      notificationType: 'massive',
    },
    {
      title: 'prueba',
      description: 'prueba',
      createdAt: new Date('2022-08-03 16:01:17'),
      userId: '126d14a6-6a1f-46f7-a798-a45016848c90',
      customerId: 'a7e63a98-bcdf-4c9d-8041-8d82e2b9e8a1',
      emergency: false,
      fromLot: '000',
      toLot: '000',
      authorizationRequestId: null,
      notificationType: 'massive',
    },
    {
      title: 'pruebaprueba',
      description: 'prueba',
      createdAt: new Date('2022-08-03 15:59:19'),
      userId: '126d14a6-6a1f-46f7-a798-a45016848c90',
      customerId: 'a7e63a98-bcdf-4c9d-8041-8d82e2b9e8a1',
      emergency: false,
      fromLot: '0',
      toLot: '0',
      authorizationRequestId: null,
      notificationType: 'massive',
    },
    {
      title: 'pelota encontrada en perímetro del quincho',
      description:
        'Se retira una pelota del perímetro del quincho. La misma queda en la guardia a la espera de su reclamo',
      createdAt: new Date('2022-08-01 18:42:42'),
      userId: '126d14a6-6a1f-46f7-a798-a45016848c90',
      customerId: 'a7e63a98-bcdf-4c9d-8041-8d82e2b9e8a1',
      image: {
        container: 'notifications_image',
        name: '53352143-3302-48b0-b279-7ccb38e8e3be.jpg',
        type: 'image/jpeg',
        size: 270160,
        url: 'https://s3.amazonaws.com/uploads.countries.basapp.com.ar/notifications/image/53352143-3302-48b0-b279-7ccb38e8e3be.jpg',
        resizedUrl:
          'https://s3.amazonaws.com/uploads.countries.basapp.com.ar/notifications/image/53352143-3302-48b0-b279-7ccb38e8e3be-1024w-1024h.jpg',
        thumbnailUrl:
          'https://s3.amazonaws.com/uploads.countries.basapp.com.ar/notifications/image/53352143-3302-48b0-b279-7ccb38e8e3be-thumbnail.jpg',
      },
      emergency: false,
      fromLot: null,
      toLot: null,
      authorizationRequestId: null,
      notificationType: 'massive',
    },
    {
      title: 'APERTURA DEL PUENTE',
      description: 'Se realiza apertura para ingreso de una chata',
      createdAt: new Date('2022-08-01 14:30:43'),
      userId: '126d14a6-6a1f-46f7-a798-a45016848c90',
      customerId: 'a7e63a98-bcdf-4c9d-8041-8d82e2b9e8a1',
      image: {
        container: 'notifications_image',
        name: '86c5fe76-9623-4b87-b2f9-fce5544636a9.jpg',
        type: 'image/jpeg',
        size: 210933,
        url: 'https://s3.amazonaws.com/uploads.countries.basapp.com.ar/notifications/image/86c5fe76-9623-4b87-b2f9-fce5544636a9.jpg',
        resizedUrl:
          'https://s3.amazonaws.com/uploads.countries.basapp.com.ar/notifications/image/86c5fe76-9623-4b87-b2f9-fce5544636a9-1024w-1024h.jpg',
        thumbnailUrl:
          'https://s3.amazonaws.com/uploads.countries.basapp.com.ar/notifications/image/86c5fe76-9623-4b87-b2f9-fce5544636a9-thumbnail.jpg',
      },
      emergency: false,
      fromLot: null,
      toLot: null,
      authorizationRequestId: null,
      notificationType: 'massive',
    },
    {
      title: 'Prueba de funcionamiento del puente',
      description:
        'Informamos que se procederá a efectuar la prueba de funcionamiento del puente.',
      createdAt: new Date('2022-07-30 12:08:37'),
      userId: '126d14a6-6a1f-46f7-a798-a45016848c90',
      customerId: 'a7e63a98-bcdf-4c9d-8041-8d82e2b9e8a1',
      emergency: false,
      fromLot: null,
      toLot: null,
      authorizationRequestId: null,
      notificationType: 'massive',
    },
    {
      title: 'PERRO SE RETIRA POR PORTERIA',
      description: 'Se informa que el perro ya fue encontrado por su dueño',
      createdAt: new Date('2022-07-24 18:08:25'),
      userId: '126d14a6-6a1f-46f7-a798-a45016848c90',
      customerId: 'a7e63a98-bcdf-4c9d-8041-8d82e2b9e8a1',
      emergency: false,
      fromLot: null,
      toLot: null,
      authorizationRequestId: null,
      notificationType: 'massive',
    },
    {
      title: 'PERRO SE RETIRA POR PORTERIA',
      description:
        'Estimados para su conocimiento se informa que se acaba de retirar un perro marrón por la guardia, al intentar agarrarlo el mismo salió corriendo y en este momento se encuentra en las inmediaciones del barrio pero no lo podemos hacer ingresar',
      createdAt: new Date('2022-07-24 17:54:05'),
      userId: '126d14a6-6a1f-46f7-a798-a45016848c90',
      customerId: 'a7e63a98-bcdf-4c9d-8041-8d82e2b9e8a1',
      image: {
        container: 'notifications_image',
        name: '9e511997-ae68-4275-9474-82056e462408.jpg',
        type: 'image/jpeg',
        size: 214472,
        url: 'https://s3.amazonaws.com/uploads.countries.basapp.com.ar/notifications/image/9e511997-ae68-4275-9474-82056e462408.jpg',
        resizedUrl:
          'https://s3.amazonaws.com/uploads.countries.basapp.com.ar/notifications/image/9e511997-ae68-4275-9474-82056e462408-1024w-1024h.jpg',
        thumbnailUrl:
          'https://s3.amazonaws.com/uploads.countries.basapp.com.ar/notifications/image/9e511997-ae68-4275-9474-82056e462408-thumbnail.jpg',
      },
      emergency: false,
      fromLot: null,
      toLot: null,
      authorizationRequestId: null,
      notificationType: 'massive',
    },
    {
      title: 'PRUEBA DE PUENTE',
      description:
        'SE PROCEDERÁ A EFECTUAR PRUEBA DE FUNCIONAMIENTO DEL PUENTE',
      createdAt: new Date('2022-07-23 12:13:58'),
      userId: '126d14a6-6a1f-46f7-a798-a45016848c90',
      customerId: 'a7e63a98-bcdf-4c9d-8041-8d82e2b9e8a1',
      emergency: false,
      fromLot: null,
      toLot: null,
      authorizationRequestId: null,
      notificationType: 'massive',
    },
    {
      title: 'Corte de agua de riego',
      description: 'se informa corte',
      createdAt: new Date('2022-07-21 18:54:08'),
      userId: '126d14a6-6a1f-46f7-a798-a45016848c90',
      customerId: 'a7e63a98-bcdf-4c9d-8041-8d82e2b9e8a1',
      emergency: true,
      fromLot: null,
      toLot: null,
      authorizationRequestId: null,
      notificationType: 'massive',
    },
    {
      title: 'Bulldog Frances encontrado',
      description:
        'Buenas tardes, estimados vecinos, se informa que se encontró un bulldog francés color atigrado en la cercanía de la guardia, si alguien sabe a quien pertenece lo tenemos en el canil, desde ya muchas gracias    ',
      createdAt: new Date('2022-07-21 18:23:27'),
      userId: '126d14a6-6a1f-46f7-a798-a45016848c90',
      customerId: 'a7e63a98-bcdf-4c9d-8041-8d82e2b9e8a1',
      image: {
        container: 'notifications_image',
        name: '74b162cd-1640-4ece-aa79-5d70bbb79508.jpeg',
        type: 'image/jpeg',
        size: 49495,
        url: 'https://s3.amazonaws.com/uploads.countries.basapp.com.ar/notifications/image/74b162cd-1640-4ece-aa79-5d70bbb79508.jpeg',
        resizedUrl:
          'https://s3.amazonaws.com/uploads.countries.basapp.com.ar/notifications/image/74b162cd-1640-4ece-aa79-5d70bbb79508-1024w-1024h.jpeg',
        thumbnailUrl:
          'https://s3.amazonaws.com/uploads.countries.basapp.com.ar/notifications/image/74b162cd-1640-4ece-aa79-5d70bbb79508-thumbnail.jpeg',
      },
      emergency: false,
      fromLot: null,
      toLot: null,
      authorizationRequestId: null,
      notificationType: 'massive',
    },
    {
      title: 'Corte de Energia',
      description:
        'Se informa un corte de energía en el día de hoy hasta las 14hs',
      createdAt: new Date('2022-07-20 14:30:08'),
      userId: '126d14a6-6a1f-46f7-a798-a45016848c90',
      customerId: 'a7e63a98-bcdf-4c9d-8041-8d82e2b9e8a1',
      image: {
        container: 'notifications_image',
        name: 'ba3a67b1-3d85-4ca6-9aa6-585f2f641dd3.jpg',
        type: 'image/jpeg',
        size: 32172,
        url: 'https://s3.amazonaws.com/uploads.countries.basapp.com.ar/notifications/image/ba3a67b1-3d85-4ca6-9aa6-585f2f641dd3.jpg',
        resizedUrl:
          'https://s3.amazonaws.com/uploads.countries.basapp.com.ar/notifications/image/ba3a67b1-3d85-4ca6-9aa6-585f2f641dd3-1024w-1024h.jpg',
        thumbnailUrl:
          'https://s3.amazonaws.com/uploads.countries.basapp.com.ar/notifications/image/ba3a67b1-3d85-4ca6-9aa6-585f2f641dd3-thumbnail.jpg',
      },
      emergency: false,
      fromLot: null,
      toLot: null,
      authorizationRequestId: null,
      notificationType: 'massive',
    },
    {
      title: 'ESCUELITA DE FUTBOL',
      description: `Sres. copropietarios 
      Les informamos que sigue la ESCUELITA de FUTBOL, para los niños y niñas de Country.
      Los días Sábados y Domingo de 10 a 12hs 
      Información: Prof. Leandro Biaiñ 02241-15582023
      
      Atte. 
      Adm. gccc`,
      createdAt: new Date('2022-07-19 14:29:06'),
      userId: '126d14a6-6a1f-46f7-a798-a45016848c90',
      customerId: '1bb5fadd-056d-4faa-afd9-a141928dff4a',
      image: {
        container: 'notifications_image',
        name: '2cfa18e9-900d-4fbe-ae7d-0bfa828202ff.jpg',
        type: 'image/jpeg',
        size: 200065,
        url: 'https://s3.amazonaws.com/uploads.countries.basapp.com.ar/notifications/image/2cfa18e9-900d-4fbe-ae7d-0bfa828202ff.jpg',
        resizedUrl:
          'https://s3.amazonaws.com/uploads.countries.basapp.com.ar/notifications/image/2cfa18e9-900d-4fbe-ae7d-0bfa828202ff-1024w-1024h.jpg',
        thumbnailUrl:
          'https://s3.amazonaws.com/uploads.countries.basapp.com.ar/notifications/image/2cfa18e9-900d-4fbe-ae7d-0bfa828202ff-thumbnail.jpg',
      },
      emergency: false,
      fromLot: null,
      toLot: null,
      authorizationRequestId: null,
      notificationType: 'massive',
    },
    {
      title: 'DIA del NIÑO: DONACION de JUGUETES !!!!',
      description: `Sres. copropietarios
      Se solicita a Uds. la colaboración de juguetes, -usados y/o nuevos-, para obsequiar el día del niño a los pequeños de los barrios más necesitados, como ser el Comedor y Merendero San Cayetano.
      La administración recepcionará la donación de los juguetes.
      Desde ya muchas gracias ¡!!
      Atte.
      Adm. gccc`,
      createdAt: new Date('2022-07-16 19:36:51'),
      userId: '126d14a6-6a1f-46f7-a798-a45016848c90',
      customerId: '1bb5fadd-056d-4faa-afd9-a141928dff4a',
      emergency: false,
      fromLot: null,
      toLot: null,
      authorizationRequestId: null,
      notificationType: 'massive',
    },
    {
      title: 'CANCHAS DE TENIS-HABILITACIÓN TEMPORAL',
      description:
        'Mañana Sábado 16/07 las canchas de tenis estarán habilitadas temporalmente desde las 08:00 hasta las 12:00hs. inclusive. Posteriormente se cerrarán hasta nuevo aviso, dependiendo de la rehabilitación del servicio de agua de riego.',
      createdAt: new Date('2022-07-16 00:09:51'),
      userId: '126d14a6-6a1f-46f7-a798-a45016848c90',
      customerId: 'a7e63a98-bcdf-4c9d-8041-8d82e2b9e8a1',
      emergency: false,
      fromLot: null,
      toLot: null,
      authorizationRequestId: null,
      notificationType: 'massive',
    },
    {
      title: 'AVISO METEOROLOGICO A MUY CORTO',
      description: `AVISO METEOROLOGICO A MUY CORTO PLAZO N2272 PARA  BRANDSEN - CHASCOMUS - GRAL PAZ - LA PLATA - LEZAMA - MAGDALENA - PUNTA INDIO - SAN VICENTE POR TORMENTAS FUERTES CON RAFAGAS Y OCASIONAL CAIDA DE GRANIZO.
  
      VALIDEZ: DOS (2) HORAS POSTERIORES A LA EMISIÓN. 
      
      FUENTE: SMN.`,
      createdAt: new Date('2022-08-15 06:50:13'),
      userId: '126d14a6-6a1f-46f7-a798-a45016848c90',
      customerId: '1bb5fadd-056d-4faa-afd9-a141928dff4a',
      locationId: null,
      emergency: false,
      notificationType: 'massive',
    },
    {
      title: 'Alerta Meteorologica',
      description:
        'Se informa a la poblacion de posibles granizo durante la noche de hoy',
      createdAt: new Date('2022-08-11 14:55:14'),
      userId: '126d14a6-6a1f-46f7-a798-a45016848c90',
      customerId: '1bb5fadd-056d-4faa-afd9-a141928dff4a',
      locationId: null,
      emergency: false,
      notificationType: 'massive',
    },
    {
      title: 'Alerta',
      description:
        'Se alerta a la población que ante llamados de secuestros extorsivos y/o secuestros virtuales deben cortar inmediatamente el comunicación, no aportar ningún dato y llamar al 911.',
      createdAt: new Date('2022-07-07 10:56:07'),
      userId: '126d14a6-6a1f-46f7-a798-a45016848c90',
      customerId: '1bb5fadd-056d-4faa-afd9-a141928dff4a',
      locationId: null,
      emergency: true,
      notificationType: 'massive',
    },
    {
      title: 'Fiebre Hemorrágica Campaña de vacunación',
      description: `La secretaria de Salud de la Municipalidad de Rojas, está llevando a cabo una campaa de vacunación contra la fiebre hemorrágica o mal de rastrojo.
      Para vacunarse solicitar turno de Lunes a Viernes de 7:30hs a 12:30hs en el vacunatorio Hospital Saturnino E. Unzue a los teléfonos 02475-465316/465410`,
      createdAt: new Date('2022-06-23 00:49:53'),
      userId: '126d14a6-6a1f-46f7-a798-a45016848c90',
      customerId: '1bb5fadd-056d-4faa-afd9-a141928dff4a',
      image: {
        container: 'notifications_image',
        name: 'cec34fc4-3b9f-4454-8691-22888a560913.png',
        type: 'image/png',
        size: 53149,
        url: 'https://s3.amazonaws.com/uploads.basapp.com.ar/notifications/image/cec34fc4-3b9f-4454-8691-22888a560913.png',
        resizedUrl:
          'https://s3.amazonaws.com/uploads.basapp.com.ar/notifications/image/cec34fc4-3b9f-4454-8691-22888a560913-1024w-1024h.png',
        thumbnailUrl:
          'https://s3.amazonaws.com/uploads.basapp.com.ar/notifications/image/cec34fc4-3b9f-4454-8691-22888a560913-thumbnail.png',
      },
      locationId: null,
      emergency: false,
      notificationType: 'massive',
    },
  ],
  async run(prisma: PrismaClient) {
    for (const user of this.data) {
      await prisma.notification.createMany({
        data: user,
      });
    }

    return true;
  },
};

export default model;
