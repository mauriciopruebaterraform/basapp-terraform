import { Policies } from '@src/auth/policies.decorator';
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListQueryArgsDto } from '@src/common/dto/list-query-args.dto';
import { ListQueryArgsPipe } from '@src/common/pipes/ListQueryArgsPipe';
import { EventAuthorizationRequestService } from './event-authorization-requests.service';
import { EventAuthorizationRequestList } from './entities/event-authorization-request-list.entity';
import { CustomerVerification } from '@src/auth/customer-verification.decorator';
import { CreateEventAuthorizationRequest } from './dto/event-authorization-request.dto';
import { IRequestUser } from '@src/interfaces/types';
import { Roles } from '@src/auth/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('customer')
@ApiBearerAuth()
@Controller({
  path: 'customers',
  version: '1',
})
export class EventAuthorizationRequestController {
  constructor(
    private readonly eventAuthorizationRequest: EventAuthorizationRequestService,
  ) {}

  @ApiOperation({
    servers: [{ url: '/v1' }],
    summary: 'Get all event authorization request',
    description:
      'Returns a list of event authorization request related to the id of clients',
  })
  @Get(':customer/event-authorization-requests')
  @CustomerVerification()
  @Policies('list-authorizations')
  findAll(
    @Request() req,
    @Param('customer') id: string,
    @Query(ListQueryArgsPipe) params: ListQueryArgsDto,
  ): Promise<EventAuthorizationRequestList> {
    return this.eventAuthorizationRequest.findAll({
      ...params,
      where: {
        ...params.where,
        customerId: id,
      },
    });
  }

  @ApiOperation({
    servers: [{ url: '/v1' }],
    summary: 'create event authorization request',
    description: 'Returns a event authorization request created',
  })
  @Post(':customer/event-authorization-requests')
  @CustomerVerification()
  @Policies('request-authorization')
  async create(
    @Request() req,
    @Param('customer') customerId: string,
    @Body() eventAuthorizationEvent: CreateEventAuthorizationRequest,
  ) {
    const { id: userId } = req.user as IRequestUser;

    return await this.eventAuthorizationRequest.create({
      data: eventAuthorizationEvent,
      userId,
      customerId,
    });
  }

  @ApiOperation({
    servers: [{ url: '/v1' }],
    summary: 'confirm an event authorization request',
    description: 'Returns a event authorization request confirmed',
  })
  @Post(':customer/event-authorization-requests/:id/confirm')
  @CustomerVerification()
  @Roles(Role.user)
  async confirm(
    @Request() req,
    @Param('customer') customerId: string,
    @Param('id') id: string,
  ) {
    return await this.eventAuthorizationRequest.confirm(
      id,
      customerId,
      req.user,
    );
  }

  @ApiOperation({
    servers: [{ url: '/v1' }],
    summary: 'reject an event authorization request',
    description: 'Returns a event authorization request rejected',
  })
  @Post(':customer/event-authorization-requests/:id/reject')
  @CustomerVerification()
  @Roles(Role.user)
  async reject(
    @Request() req,
    @Param('customer') customerId: string,
    @Param('id') id: string,
  ) {
    const { id: userId } = req.user as IRequestUser;

    return await this.eventAuthorizationRequest.reject(id, customerId, userId);
  }
}
