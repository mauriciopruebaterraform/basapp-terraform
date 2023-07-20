import { Module } from '@nestjs/common';
import { ReservationModeService } from './reservation-mode.service';
import { ReservationModeController } from './reservation-mode.controller';

@Module({
  providers: [ReservationModeService],
  exports: [ReservationModeService],
  controllers: [ReservationModeController],
})
export class ReservationModeModule {}
