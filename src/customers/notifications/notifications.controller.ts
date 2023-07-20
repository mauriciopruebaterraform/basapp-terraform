import { Notification, Role } from '@prisma/client';
import { Policies } from '@src/auth/policies.decorator';
import {
  Controller,
  Get,
  Body,
  Param,
  Query,
  Request,
  Post,
  NotFoundException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListQueryArgsDto } from '@src/common/dto/list-query-args.dto';
import { ListQueryArgsPipe } from '@src/common/pipes/ListQueryArgsPipe';
import { NotificationList } from './entities/notification-list.entity';
import { CustomerVerification } from '@src/auth/customer-verification.decorator';
import { NotificationsService } from './notifications.service';
import { IRequestUser } from '@src/interfaces/types';
import { NotificationDto } from './dto/notification.dto';
import { GetQueryArgsDto } from '@src/common/dto/get-query-args.dto';
import { GetQueryArgsPipe } from '@src/common/pipes/GetQueryArgsPipe';
import { errorCodes } from './notifications.constants';
import { Roles } from '@src/auth/roles.decorator';
import { NotificationUser } from '@src/users/entities/notification-user.entity';
import { SendMessageDto } from './dto/send-message.dto';

@ApiTags('customer')
@ApiBearerAuth()
@Controller({
  path: 'customers',
  version: '1',
})
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @ApiOperation({
    servers: [{ url: '/v1' }],
    summary: 'Get all notifications',
    description: 'Returns a list of all notifications',
  })
  @Get(':customer/notifications')
  @Policies('list-notifications')
  @CustomerVerification()
  findAll(
    @Request() req,
    @Param('customer') id: string,
    @Query(ListQueryArgsPipe) params: ListQueryArgsDto,
  ): Promise<NotificationList> {
    return this.notificationsService.findAll({
      ...params,
      where: {
        ...params.where,
        customerId: id,
      },
    });
  }

  @ApiOperation({
    servers: [{ url: '/v1' }],
    summary: 'Get all notifications',
  })
  @Get(':customer/notifications/panic')
  @Roles(Role.monitoring)
  @CustomerVerification()
  panic(@Request() req) {
    const { id: userId } = req.user as IRequestUser;
    return this.notificationsService.panic(userId);
  }

  @ApiOperation({
    servers: [{ url: '/v1' }],
    summary: 'create a notification',
    description: 'Return a notification created',
  })
  @Policies('create-notification')
  @Post(':customer/notifications')
  @CustomerVerification()
  create(
    @Request() req,
    @Param('customer') id: string,
    @Body() notification: NotificationDto,
  ): Promise<Notification> {
    const { id: userId } = req.user as IRequestUser;
    return this.notificationsService.create({
      ...notification,
      customerId: id,
      userId,
    });
  }

  @ApiOperation({
    servers: [{ url: '/v1' }],
    summary: 'create a notification',
  })
  @Policies('create-notification')
  @Roles(Role.monitoring)
  @Post(':customer/notifications/send-message')
  @CustomerVerification()
  sendMessage(
    @Request() req,
    @Param('customer') id: string,
    @Body() notification: SendMessageDto,
  ): Promise<Notification> {
    const { id: userId } = req.user as IRequestUser;
    return this.notificationsService.createMessage({
      ...notification,
      customerId: id,
      userId,
    });
  }

  @ApiOperation({
    servers: [{ url: '/v1' }],
    summary: 'Get notification by id',
  })
  @Policies('list-notifications')
  @Get(':customer/notifications/:id')
  @CustomerVerification()
  async findOne(
    @Request() req,
    @Param('id') id: string,
    @Param('customer') customer: string,
    @Query(GetQueryArgsPipe) params: GetQueryArgsDto,
  ): Promise<Notification> {
    const notification = await this.notificationsService.findOne(
      id,
      customer,
      params,
    );

    if (!notification) {
      throw new NotFoundException(errorCodes.NOTIFICATION_NOT_FOUND);
    }
    return notification;
  }

  @ApiOperation({
    servers: [{ url: '/v1' }],
    summary: 'mark notification as read',
  })
  @Get(':customer/notifications/:notificationUser/read')
  @Roles('user')
  @CustomerVerification()
  async notificationRead(
    @Request() req,
    @Param('notificationUser') id: string,
    @Param('customer') customer: string,
  ): Promise<Pick<NotificationUser, 'id' | 'read' | 'notificationId'>> {
    const { id: userId } = req.user as IRequestUser;

    return this.notificationsService.notificationRead(id, customer, userId);
  }
}
