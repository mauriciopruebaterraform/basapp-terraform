import { Module } from '@nestjs/common';
import { EventStatesController } from './event-states.controller';
import { EventStatesService } from './event-states.service';

@Module({
  controllers: [EventStatesController],
  providers: [EventStatesService],
})
export class EventStatesModule {}
