import { SmsService } from '@src/sms/sms.service';
import { Global, Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';

@Global()
@Module({
  imports: [HttpModule],
  providers: [SmsService],
  exports: [SmsService],
})
export class SMSModule {}
