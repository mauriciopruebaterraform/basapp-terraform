import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AlertTypesService } from './alert-types.service';
import { AlertType } from './entities/alert-type.entity';

@ApiTags('alert-types')
@ApiBearerAuth()
@Controller({
  path: 'alert-types',
  version: '1',
})
export class AlertTypesController {
  constructor(private readonly alertTypesService: AlertTypesService) {}
  @ApiOperation({
    servers: [{ url: '/v1' }],
    summary: 'Get all types of alerts',
    description: 'Returns all types of alerts that are used in the app',
  })
  @Get()
  findAll(): Promise<AlertType[]> {
    return this.alertTypesService.findAll();
  }
}
