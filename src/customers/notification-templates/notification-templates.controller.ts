import { Policies } from '@src/auth/policies.decorator';
import { CustomerVerification } from '@src/auth/customer-verification.decorator';
import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  Patch,
  Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListQueryArgsDto } from '@src/common/dto/list-query-args.dto';
import { ListQueryArgsPipe } from '@src/common/pipes/ListQueryArgsPipe';
import { NotificationTemplatesService } from './notification-templates.service';
import { NotificationTemplateList } from './entities/notification-template-list.entity';
import { NotificationTemplate } from '@prisma/client';
import { NotificationTemplateDto } from './dto/notification-template.dto';
import { UpdateNotificationTemplateDto } from './dto/update-notification-template.dto';

@ApiTags('customer')
@ApiBearerAuth()
@Controller({
  path: 'customers',
  version: '1',
})
export class NotificationTemplatesController {
  constructor(
    private readonly notificationTemplatesService: NotificationTemplatesService,
  ) {}

  @ApiOperation({
    servers: [{ url: '/v1' }],
    summary: 'Get all notification templates',
    description: 'Returns a list of notification templates',
  })
  @Get(':customer/notification-templates')
  @Policies('list-notification-templates')
  @CustomerVerification()
  findAll(
    @Request() req,
    @Param('customer') id: string,
    @Query(ListQueryArgsPipe) params: ListQueryArgsDto,
  ): Promise<NotificationTemplateList> {
    return this.notificationTemplatesService.findAll({
      ...params,
      where: {
        ...params.where,
        customerId: id,
      },
    });
  }

  @ApiOperation({
    servers: [{ url: '/v1' }],
    summary: 'create a notification template',
    description: 'Return a notification template created',
  })
  @Policies('create-notification-template')
  @Post(':customer/notification-templates')
  @CustomerVerification()
  create(
    @Request() req,
    @Param('customer') customer: string,
    @Body() notificationTemplate: NotificationTemplateDto,
  ): Promise<NotificationTemplate> {
    return this.notificationTemplatesService.create({
      ...notificationTemplate,
      customerId: customer,
    });
  }

  @ApiOperation({
    servers: [{ url: '/v1' }],
    summary: 'update a notification template',
    description: 'Return a notification template updated',
  })
  @Policies('modify-notification-template')
  @Patch(':customer/notification-templates/:id')
  @CustomerVerification()
  update(
    @Request() req,
    @Param('id') id: string,
    @Param('customer') customer: string,
    @Body() notificationTemplate: UpdateNotificationTemplateDto,
  ): Promise<NotificationTemplate> {
    return this.notificationTemplatesService.update(id, {
      ...notificationTemplate,
      customerId: customer,
    });
  }
}
