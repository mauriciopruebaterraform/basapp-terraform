import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class AlertTypesService {
  constructor(private readonly prisma: PrismaService) {}
  findAll() {
    return this.prisma.alertType.findMany();
  }
}
