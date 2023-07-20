import { Module } from '@nestjs/common';
import { EventTypesService } from './event-types.service';
import { EventTypesController } from './event-types.controller';

@Module({
  providers: [EventTypesService],
  exports: [EventTypesService],
  controllers: [EventTypesController],
})
export class EventTypesModule {}
