import { Module, forwardRef } from '@nestjs/common';
import { AlertsService } from './alerts.service';
import { AlertsController } from './alerts.controller';
import { ExternalService } from '@src/common/services/external.service';
import { HttpModule } from '@nestjs/axios';
import { NeighborhoodModule } from '@src/customers/neighborhood-alarm/neighborhood-alarm.module';

@Module({
  imports: [HttpModule, forwardRef(() => NeighborhoodModule)],
  providers: [AlertsService, ExternalService],
  exports: [AlertsService],
  controllers: [AlertsController],
})
export class AlertsModule {}
