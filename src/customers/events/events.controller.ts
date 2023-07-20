import { Policies } from '@src/auth/policies.decorator';
import { CustomerVerification } from '@src/auth/customer-verification.decorator';
import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListQueryArgsDto } from '@src/common/dto/list-query-args.dto';
import { ListQueryArgsPipe } from '@src/common/pipes/ListQueryArgsPipe';
import { EventsService } from './events.service';
import { errorCodes } from '@src/customers/customers.constants';
import { EventList } from './entities/event-list.entity';
import { GetQueryArgsPipe } from '@src/common/pipes/GetQueryArgsPipe';
import { GetQueryArgsDto } from '@src/common/dto/get-query-args.dto';
import { UpdateEventStateDto } from './dto/update-event-state.dto';
import { Event } from './entities/event.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { PoliciesExclude } from '@src/auth/policies-exclude.decorator';
import { Public } from '@src/auth/public.decorator';
import { QrCodeDto } from './dto/qr-code.dto';
import { CreateEvent } from './entities/create-event.entity';
import { Roles } from '@src/auth/roles.decorator';
import { Role } from '@prisma/client';
import { ListCsvArgsPipe } from '@src/common/pipes/ListCsvArgsPipe';
import { ListCsvArgsDto } from '@src/common/dto/list-csv-args.dto';
import { ConfigurationService } from '@src/configuration/configuration.service';
import { IRequestUser } from '@src/interfaces/types';
import { StatsArgsDto } from '@src/common/dto/stats.dto';

@ApiTags('customer')
@ApiBearerAuth()
@Controller({
  path: 'customers',
  version: '1',
})
export class EventsController {
  constructor(
    private readonly eventsService: EventsService,
    private readonly configurationService: ConfigurationService,
  ) {}

  @ApiOperation({
    servers: [{ url: '/v1' }],
    summary: 'Get all events',
    description: 'Returns a list of events',
  })
  @Get(':customer/events')
  @PoliciesExclude('list-events')
  @CustomerVerification()
  findAll(
    @Request() req,
    @Param('customer') id: string,
    @Query(ListQueryArgsPipe) params: ListQueryArgsDto,
  ): Promise<EventList> {
    return this.eventsService.findAll({
      ...params,
      where: {
        ...params.where,
        customerId: id,
      },
    });
  }

  @ApiOperation({
    servers: [{ url: '/v1' }],
    description: 'get events statistics',
  })
  @Get('/events/statistics')
  @Policies('event-statistics')
  @Roles(Role.admin, Role.monitoring, Role.statesman)
  getStatistics(
    @Request() req,
    @Query(ListQueryArgsPipe) params: StatsArgsDto,
  ) {
    return this.eventsService.getStatistics(req.user.customerId, {
      ...params,
      where: {
        reservationId: null,
        ...params.where,
      },
    });
  }

  @ApiOperation({
    servers: [{ url: '/v1' }],
    summary: 'Get all events',
    description: 'Returns a list of events',
  })
  @Get(':customer/events/icm-type')
  @Policies('create-event')
  @CustomerVerification()
  getIcmType(@Request() req, @Param('customer') id: string) {
    return this.eventsService.getIcmType(id);
  }

  @ApiOperation({
    servers: [{ url: '/v1' }],
    summary: 'generate a csv',
  })
  @Get(':customer/events/csv')
  @Policies('list-events')
  @CustomerVerification()
  generateCsv(
    @Request() req,
    @Param('customer') id: string,
    @Query(ListCsvArgsPipe) params: ListCsvArgsDto,
  ) {
    const { username } = req.user as IRequestUser;
    return this.configurationService.generateCsv(
      {
        ...params,
        where: {
          ...params.where,
          customerId: id,
        },
        email: username,
      },
      'event-csv-topic',
    );
  }

  @ApiOperation({
    servers: [{ url: '/v1' }],
    summary: 'Get event by id',
  })
  @Policies('list-events')
  @Get(':customer/events/:id')
  @CustomerVerification()
  async findOne(
    @Request() req,
    @Param('id') id: string,
    @Param('customer') customer: string,
    @Query(GetQueryArgsPipe) params: GetQueryArgsDto,
  ): Promise<Event> {
    const event = await this.eventsService.findOne(id, customer, params);

    if (!event) {
      throw new NotFoundException(errorCodes.EVENT_NOT_FOUND);
    }
    return event;
  }

  @ApiOperation({
    servers: [{ url: '/v1' }],
  })
  @Get(':customer/events/:id/attend')
  @Roles(Role.admin)
  async attendEventGV(
    @Request() req,
    @Param('id') id: string,
    @Param('customer') customer: string,
  ) {
    return await this.eventsService.attendEventGV(id, customer, req.user.id);
  }

  @ApiOperation({
    servers: [{ url: '/v1' }],
    summary: 'Cancel event by id',
  })
  @PoliciesExclude('attend-event')
  @CustomerVerification()
  @Patch(':customer/events/:id/cancel')
  async cancelEvent(@Request() req, @Param('id') id: string) {
    return await this.eventsService.cancelEvent({
      id,
      user: req.user,
    });
  }

  @ApiOperation({
    servers: [{ url: '/v1' }],
    summary: 'update event by id',
  })
  @Policies('attend-event')
  @CustomerVerification()
  @Patch(':customer/events/:id/change-state')
  async eventUpdateState(
    @Request() req,
    @Param('id') id: string,
    @Param('customer') customer: string,
    @Body() event: UpdateEventStateDto,
  ): Promise<Event> {
    return await this.eventsService.eventUpdateState(
      event,
      id,
      req.user.id,
      customer,
    );
  }

  @ApiOperation({
    servers: [{ url: '/v1' }],
    summary: 'create event',
  })
  @Policies('create-event')
  @CustomerVerification()
  @Post(':customer/events')
  async create(
    @Request() req,
    @Param('customer') customer: string,
    @Body() event: CreateEventDto,
  ): Promise<CreateEvent> {
    return await this.eventsService.create({
      data: event,
      userRequest: req.user,
      customerId: customer,
    });
  }

  @ApiOperation({
    servers: [{ url: '/v1' }],
    summary: 'Get event by token',
  })
  @Public()
  @Get('events/token/:token')
  async findByToken(@Param('token') token: string) {
    return await this.eventsService.findByToken(token);
  }

  @ApiOperation({
    servers: [{ url: '/v1' }],
    summary: 'generate QR code',
  })
  @Public()
  @Post('events/qr-code')
  async generateQR(@Body() qr: QrCodeDto) {
    return await this.eventsService.generateQR(qr);
  }
}
