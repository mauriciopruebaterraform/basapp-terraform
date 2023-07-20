import {
  Controller,
  Get,
  Request,
  Query,
  Post,
  Body,
  Patch,
  Param,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { ListQueryArgsPipe } from '@src/common/pipes/ListQueryArgsPipe';
import { ListQueryArgsDto } from '@src/common/dto/list-query-args.dto';
import { Roles } from '@src/auth/roles.decorator';
import { EventStatesService } from './event-states.service';
import { EventStatesList } from './entities/event-states-list.entity';
import { CreateEventState } from './dto/create-event-state.dto';
import { Policies } from '@src/auth/policies.decorator';
import { UpdateEventState } from './dto/update-event-state.dto';
import { IRequestUser } from '@src/interfaces/types';

@ApiTags('event-states')
@ApiBearerAuth()
@Controller({
  path: 'event-states',
  version: '1',
})
export class EventStatesController {
  constructor(private readonly eventStatesService: EventStatesService) {}

  @ApiOperation({
    servers: [{ url: '/v1' }],
    summary: 'Get all event states',
    description: 'Returns a list of event states',
  })
  @Get()
  @Roles(Role.monitoring, Role.statesman, Role.admin)
  findAll(
    @Request() req,
    @Query(ListQueryArgsPipe) params: ListQueryArgsDto,
  ): Promise<EventStatesList> {
    const { user } = req;
    if (user.role === Role.statesman || user.role === Role.monitoring) {
      params.where = {
        ...params.where,
        OR: [
          {
            customerId: user.customerId,
          },
          {
            customerId: null,
          },
        ],
      };
    }
    return this.eventStatesService.findAll(params);
  }

  @ApiOperation({
    servers: [{ url: '/v1' }],
    summary: 'create event state',
    description: 'create a event state',
  })
  @Post()
  @Policies('create-event-state')
  @Roles(Role.monitoring, Role.statesman)
  create(@Request() req, @Body() eventState: CreateEventState) {
    const { user } = req;
    return this.eventStatesService.create({
      ...eventState,
      customerId: user.customerId,
    });
  }

  @ApiOperation({
    servers: [{ url: '/v1' }],
    summary: 'update event state',
    description: 'update a event state',
  })
  @Patch(':id')
  @Policies('modify-event-state')
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body() eventState: UpdateEventState,
  ) {
    const { customerId } = req.user as IRequestUser;

    return await this.eventStatesService.update(id, {
      ...eventState,
      customerId,
    });
  }
}
