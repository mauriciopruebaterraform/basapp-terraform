import { Module } from '@nestjs/common';
import { LotsService } from './lots.service';
import { LotsController } from './lots.controller';
import { CsvModule } from 'nest-csv-parser';

@Module({
  imports: [CsvModule],
  providers: [LotsService],
  exports: [LotsService],
  controllers: [LotsController],
})
export class LotModule {}
