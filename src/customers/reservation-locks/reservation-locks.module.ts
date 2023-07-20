import { Module } from '@nestjs/common';
import { ReservationLocksController } from './reservation-locks.controller';
import { ReservationLocksService } from './reservation-locks.service';

@Module({
  providers: [ReservationLocksService],
  exports: [ReservationLocksService],
  controllers: [ReservationLocksController],
})
export class ReservationLocksModule {}
