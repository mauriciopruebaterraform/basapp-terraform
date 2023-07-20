import { Module } from '@nestjs/common';
import { ReservationSpaceService } from './reservation-space.service';
import { ReservationSpaceController } from './reservation-space.controller';

@Module({
  providers: [ReservationSpaceService],
  exports: [ReservationSpaceService],
  controllers: [ReservationSpaceController],
})
export class ReservationSpaceModule {}
