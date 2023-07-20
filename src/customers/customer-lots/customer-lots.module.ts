import { Module } from '@nestjs/common';
import { CustomerLotsService } from './customer-lots.service';
import { CustomerLotsController } from './customer-lots.controller';
import { CsvModule } from 'nest-csv-parser';

@Module({
  imports: [CsvModule],
  providers: [CustomerLotsService],
  exports: [CustomerLotsService],
  controllers: [CustomerLotsController],
})
export class CustomerLotsModule {}
