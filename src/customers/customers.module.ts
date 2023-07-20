import { Module } from '@nestjs/common';
import { CustomerService } from './customers.service';
import { CustomerController } from './customers.controller';
import { LotModule } from './lots/lots.module';
import { UsefulInformationModule } from './useful-information/useful-information.module';
import { ProtocolsModule } from './protocols/protocols.module';
import { LocationsModule } from './locations/locations.module';
import { CamerasModule } from './cameras/cameras.module';
import { EventTypesModule } from './event-types/event-types.module';
import { ReservationTypeModule } from './reservation-type/reservation-type.module';
import { ReservationSpaceModule } from './reservation-space/reservation-space.module';
import { ReservationModeModule } from './reservation-mode/reservation-mode.module';
import { AuthorizedUsersModule } from './authorized-users/authorized-users.module';
import { EventsModule } from './events/events.module';
import { ReservationModule } from './reservations/reservations.module';
import { EventAuthorizationRequestModule } from './event-authorization-requests/event-authorization-requests.module';
import { NotificationsModule } from './notifications/notifications.module';
import { NotificationTemplatesModule } from './notification-templates/notification-templates.module';
import { HolidaysModule } from './holidays/holidays.module';
import { ReservationLocksModule } from './reservation-locks/reservation-locks.module';
import { ExternalServiceModule } from './external-service/external-service.module';
import { NeighborhoodModule } from './neighborhood-alarm/neighborhood-alarm.module';

@Module({
  imports: [
    LotModule,
    HolidaysModule,
    UsefulInformationModule,
    ProtocolsModule,
    ReservationLocksModule,
    LocationsModule,
    CamerasModule,
    EventTypesModule,
    ReservationTypeModule,
    ReservationSpaceModule,
    ReservationModeModule,
    AuthorizedUsersModule,
    EventsModule,
    ReservationModule,
    EventAuthorizationRequestModule,
    NotificationTemplatesModule,
    NotificationsModule,
    ExternalServiceModule,
    NeighborhoodModule,
  ],
  providers: [CustomerService],
  exports: [CustomerService],
  controllers: [CustomerController],
})
export class CustomerModule {}
