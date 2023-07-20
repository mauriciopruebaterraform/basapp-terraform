import { Module } from '@nestjs/common';
import { CamerasService } from './cameras.service';
import { CamerasController } from './cameras.controller';

@Module({
  providers: [CamerasService],
  exports: [CamerasService],
  controllers: [CamerasController],
})
export class CamerasModule {}
