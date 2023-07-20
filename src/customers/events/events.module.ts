import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ExternalService } from '@src/common/services/external.service';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { ReservationModule } from '../reservations/reservations.module';

@Module({
  imports: [HttpModule, ReservationModule],
  providers: [EventsService, ExternalService],
  exports: [EventsService],
  controllers: [EventsController],
})
export class EventsModule {}
