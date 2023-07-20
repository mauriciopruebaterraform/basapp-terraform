import { Module } from '@nestjs/common';
import { UsefulInformationService } from './useful-information.service';
import { UsefulInformationController } from './useful-information.controller';

@Module({
  providers: [UsefulInformationService],
  exports: [UsefulInformationService],
  controllers: [UsefulInformationController],
})
export class UsefulInformationModule {}
