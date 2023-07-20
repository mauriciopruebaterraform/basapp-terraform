import { Module } from '@nestjs/common';
import { ReservationTypeService } from './reservation-type.service';
import { ReservationTypeController } from './reservation-type.controller';

@Module({
  providers: [ReservationTypeService],
  exports: [ReservationTypeService],
  controllers: [ReservationTypeController],
})
export class ReservationTypeModule {}
