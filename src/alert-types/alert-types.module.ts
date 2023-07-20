import { Module } from '@nestjs/common';
import { AlertTypesService } from './alert-types.service';
import { AlertTypesController } from './alert-types.controller';

@Module({
  providers: [AlertTypesService],
  exports: [AlertTypesService],
  controllers: [AlertTypesController],
})
export class AlertTypesModule {}
