import { Module } from '@nestjs/common';
import { ProtocolsService } from './protocols.service';
import { ProtocolsController } from './protocols.controller';

@Module({
  providers: [ProtocolsService],
  exports: [ProtocolsService],
  controllers: [ProtocolsController],
})
export class ProtocolsModule {}
