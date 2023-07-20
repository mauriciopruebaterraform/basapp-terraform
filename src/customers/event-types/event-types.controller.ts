import { Policies } from '@src/auth/policies.decorator';
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListQueryArgsDto } from '@src/common/dto/list-query-args.dto';
import { ListQueryArgsPipe } from '@src/common/pipes/ListQueryArgsPipe';
import { EventTypesService } from './event-types.service';
import { IRequestUser } from '@src/interfaces/types';
import { EventTypeList } from './entities/event-type-list.entity';
import { EventTypeDto } from './dto/event-type.dto';
import { UpdateEventTypeDto } from './dto/update-event-type.dto';
import { CustomerVerification } from '@src/auth/customer-verification.decorator';
import { EventType } from './entities/event-type.entity';

@ApiTags('customer')
@ApiBearerAuth()
@Controller({
  path: 'customers',
  version: '1',
})
export class EventTypesController {
  constructor(private readonly eventTypesService: EventTypesService) {}

  @ApiOperation({
    servers: [{ url: '/v1' }],
    summary: 'Get all event type',
    description: 'Returns a list of event type related to the id of clients',
  })
  @Get(':customer/event-types')
  @CustomerVerification()
  findAllEventType(
    @Request() req,
    @Param('customer') id: string,
    @Query(ListQueryArgsPipe) params: ListQueryArgsDto,
  ): Promise<EventTypeList> {
    return this.eventTypesService.findAll({
      ...params,
      where: {
        ...params.where,
        customerId: id,
      },
    });
  }

  @ApiOperation({
    servers: [{ url: '/v1' }],
    summary: 'create a event type',
    description: 'Return a event type created',
  })
  @Policies('create-event-type')
  @Post(':customer/event-types')
  @CustomerVerification()
  createEventType(
    @Request() req,
    @Param('customer') id: string,
    @Body() eventType: EventTypeDto,
  ): Promise<EventType> {
    const { id: userId } = req.user as IRequestUser;

    return this.eventTypesService.create({
      ...eventType,
      customerId: id,
      userId,
    });
  }

  @ApiOperation({
    servers: [{ url: '/v1' }],
    summary: 'update a event type',
    description: 'Return a event type updated',
  })
  @Policies('modify-event-type')
  @Patch(':customer/event-types/:id')
  @CustomerVerification()
  updateEventType(
    @Request() req,
    @Param('id') id: string,
    @Param('customer') customer: string,
    @Body() eventType: UpdateEventTypeDto,
  ): Promise<EventType> {
    const { customerId, id: userId } = req.user as IRequestUser;

    return this.eventTypesService.update(id, {
      ...eventType,
      customerId,
      userId,
    });
  }
}
