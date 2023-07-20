import { INestApplication } from '@nestjs/common';
import {
  PrismaGirovisionService,
  PrismaService,
} from '@src/database/prisma.service';

export const cleanData = async (
  prisma: PrismaService,
  app: INestApplication,
  prismaGV?: PrismaGirovisionService,
) => {
  if (prismaGV) {
    await prismaGV.invitados.deleteMany({});
  }
  await prisma.userDeleted.deleteMany({});
  await prisma.iCMService.deleteMany({});
  await prisma.neighborhoodAlarmUsers.deleteMany({});
  await prisma.neighborhoodAlarm.deleteMany({});
  await prisma.smsProvider.deleteMany({});
  await prisma.reservationGuests.deleteMany({});
  await prisma.externalService.deleteMany({});
  await prisma.reservationGuests.deleteMany({});
  await prisma.notificationUser.deleteMany({});
  await prisma.reservationLock.deleteMany({});
  await prisma.customerHolidays.deleteMany({});
  await prisma.notificationTemplate.deleteMany({});
  await prisma.notificationCustomer.deleteMany({});
  await prisma.checkpoint.deleteMany({});
  await prisma.alert.deleteMany({});
  await prisma.event.deleteMany({});
  await prisma.eventAuthorizationRequest.deleteMany({});
  await prisma.reservation.deleteMany({});
  await prisma.authorizedUserReservationType.deleteMany({});
  await prisma.authorizedUser.deleteMany({});
  await prisma.customerLot.deleteMany({});
  await prisma.reservationSpaceReservationMode.deleteMany({});
  await prisma.reservationMode.deleteMany({});
  await prisma.reservationSpace.deleteMany({});
  await prisma.camera.deleteMany({});
  await prisma.lot.deleteMany({});
  await prisma.usefulInformation.deleteMany({});
  await prisma.protocol.deleteMany({});
  await prisma.location.deleteMany({});
  await prisma.customerEventCategory.deleteMany({});
  await prisma.customerAlertType.deleteMany({});
  await prisma.alert.deleteMany({});
  await prisma.contactAlertType.deleteMany({});
  await prisma.alertType.deleteMany({});
  await prisma.contact.deleteMany({});
  await prisma.eventType.deleteMany({});
  await prisma.eventCategory.deleteMany({});
  await prisma.alertState.deleteMany({});
  await prisma.customerSections.deleteMany({});
  await prisma.customerSettings.deleteMany({});
  await prisma.eventState.deleteMany({});
  await prisma.reservationType.deleteMany({});
  await prisma.monitoringCustomer.deleteMany({});
  await prisma.userPermission.deleteMany({});
  await prisma.permission.deleteMany({});
  await prisma.customerIntegration.deleteMany({});
  await prisma.passwordRecoveryToken.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.customer.deleteMany({});
  await prisma.user.deleteMany({});
  await app.close();
};
