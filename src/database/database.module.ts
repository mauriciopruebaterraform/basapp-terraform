import { Global, Module } from '@nestjs/common';
import { PrismaGirovisionService, PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService, PrismaGirovisionService],
  exports: [PrismaService, PrismaGirovisionService],
})
export class DatabaseModule {}
