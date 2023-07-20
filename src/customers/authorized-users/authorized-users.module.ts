import { Module } from '@nestjs/common';
import { AuthorizedUsersService } from './authorized-users.service';
import { AuthorizedUsersController } from './authorized-users.controller';
import { CsvModule } from 'nest-csv-parser';

@Module({
  imports: [CsvModule],
  providers: [AuthorizedUsersService],
  exports: [AuthorizedUsersService],
  controllers: [AuthorizedUsersController],
})
export class AuthorizedUsersModule {}
