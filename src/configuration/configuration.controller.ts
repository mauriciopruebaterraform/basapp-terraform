import { Role } from '.prisma/client';
import { Body, Controller, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '@src/auth/roles.decorator';
import { ConfigurationService } from './configuration.service';
import { SmsDto } from './dto/sms.dto';

@ApiTags('configuration')
@ApiBearerAuth()
@Controller({
  path: 'configuration',
  version: '1',
})
export class ConfigurationController {
  constructor(private readonly configurationService: ConfigurationService) {}

  @ApiOperation({
    servers: [{ url: '/v1' }],
    summary: 'Update sms option',
  })
  @Roles(Role.admin)
  @Patch('/sms')
  updateSms(@Body() body: SmsDto) {
    return this.configurationService.updateSms(body.id);
  }
}
