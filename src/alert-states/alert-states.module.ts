import { Module } from '@nestjs/common';
import { AlertStatesController } from './alert-states.controller';
import { AlertStateService } from './alert-states.service';

@Module({
  controllers: [AlertStatesController],
  providers: [AlertStateService],
})
export class AlertStatesModule {}
