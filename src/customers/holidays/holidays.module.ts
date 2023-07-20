import { Module } from '@nestjs/common';
import { HolidaysController } from './holidays.controller';
import { HolidaysService } from './holidays.service';

@Module({
  providers: [HolidaysService],
  exports: [HolidaysService],
  controllers: [HolidaysController],
})
export class HolidaysModule {}
