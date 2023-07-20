import { Module } from '@nestjs/common';
import { ExternalServiceController } from './external-service.controller';
import { ExternalServiceService } from './external-service.service';

@Module({
  providers: [ExternalServiceService],
  exports: [ExternalServiceService],
  controllers: [ExternalServiceController],
})
export class ExternalServiceModule {}
