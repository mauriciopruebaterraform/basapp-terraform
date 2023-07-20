import {
  Body,
  Controller,
  Get,
  Post,
  Param,
  Patch,
  Query,
  Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListQueryArgsDto } from '@src/common/dto/list-query-args.dto';
import { ListQueryArgsPipe } from '@src/common/pipes/ListQueryArgsPipe';
import { AlertsService } from './alerts.service';
import { AlertList } from './entities/alert-list.entity';
import { Policies } from '@src/auth/policies.decorator';
import { GetQueryArgsDto } from '@src/common/dto/get-query-args.dto';
import { GetQueryArgsPipe } from '@src/common/pipes/GetQueryArgsPipe';
import { Checkpoint, Role } from '@prisma/client';
import { ChangeStateAlertDto } from './dto/change-state.dto';
import { AlertDto } from './dto/create-alert.dto';
import { IRequestUser } from '@src/interfaces/types';
import { Public } from '@src/auth/public.decorator';
import { CreateAlertSmsDto } from './dto/create-alert-sms.dto';
import { CheckpointDto } from './dto/checkpoint.dto';
import { Alert } from './entities/alert.entity';
import { PoliciesExclude } from '@src/auth/policies-exclude.decorator';
import { ListCsvArgsPipe } from '@src/common/pipes/ListCsvArgsPipe';
import { ListCsvArgsDto } from '@src/common/dto/list-csv-args.dto';
import { ConfigurationService } from '@src/configuration/configuration.service';
import { Roles } from '@src/auth/roles.decorator';
import { StatsArgsDto } from '@src/common/dto/stats.dto';

@ApiTags('alerts')
@ApiBearerAuth()
@Controller({
  path: 'alerts',
  version: '1',
})
export class AlertsController {
  constructor(
    private readonly alertsService: AlertsService,
    private readonly configurationService: ConfigurationService,
  ) {}

  @ApiOperation({
    servers: [{ url: '/v1' }],
    summary: 'create an alert by sms',
    description: 'Return an alert created',
  })
  @Get('sms')
  @Public()
  async createBySms(@Query() query: CreateAlertSmsDto): Promise<void> {
    await this.alertsService.decryptSms(query.msj);

    return;
  }

  @ApiOperation({
    servers: [{ url: '/v1' }],
    summary: 'generate a csv',
  })
  @Get('csv')
  @Policies('list-alerts')
  generateCsv(@Request() req, @Query(ListCsvArgsPipe) params: ListCsvArgsDto) {
    const { customerId, username } = req.user as IRequestUser;

    return this.configurationService.generateCsv(
      {
        ...params,
        where: {
          ...params.where,
          customerId,
        },
        email: username,
      },
      'alert-csv-topic',
    );
  }

  @ApiOperation({
    servers: [{ url: '/v1' }],
    summary: 'Get all alerts',
    description: 'Returns a list of alerts',
  })
  @Get()
  @Policies('list-alerts', 'attend-alert')
  findAll(
    @Request() req,
    @Query(ListQueryArgsPipe) params: ListQueryArgsDto,
  ): Promise<AlertList> {
    return this.alertsService.findAll(params, req.user.customerId);
  }

  @ApiOperation({
    servers: [{ url: '/v1' }],
    description: 'get alerts statistics',
  })
  @Get('/statistics')
  @Policies('alert-statistics')
  @Roles(Role.admin, Role.monitoring, Role.statesman)
  getStatistics(
    @Request() req,
    @Query(ListQueryArgsPipe) params: StatsArgsDto,
  ) {
    return this.alertsService.getStatistics(req.user.customerId, params);
  }

  @ApiOperation({
    servers: [{ url: '/v1' }],
    summary: 'Get alert by id',
  })
  @Get('/:id')
  @PoliciesExclude('list-alerts', 'attend-alert')
  findOne(
    @Request() req,
    @Param('id') id: string,
    @Query(GetQueryArgsPipe) params: GetQueryArgsDto,
  ): Promise<Alert> {
    const { customerId } = req.user as IRequestUser;
    return this.alertsService.findOne(id, customerId, params);
  }

  @ApiOperation({
    servers: [{ url: '/v1' }],
    summary: 'Update alert by id',
  })
  @Patch('/:id/change-state')
  @Policies('attend-alert')
  updateState(
    @Request() req,
    @Param('id') id: string,
    @Body() data: ChangeStateAlertDto,
  ): Promise<Alert> {
    const { id: userId } = req.user as IRequestUser;
    return this.alertsService.changeState(id, userId, data);
  }

  @ApiOperation({
    servers: [{ url: '/v1' }],
    summary: 'create an alert',
    description: 'Return an alert created',
  })
  @Post()
  create(
    @Request() req,
    @Body() alert: AlertDto,
  ): Promise<
    Alert & {
      contactsOnly?: boolean;
    }
  > {
    const { id: userId, customerId } = req.user as IRequestUser;

    return this.alertsService.create({
      ...alert,
      customerId,
      userId,
    });
  }

  @ApiOperation({
    servers: [{ url: '/v1' }],
    summary: 'create a checkpoint',
    description: 'Return an checkpoint created',
  })
  @Get('/:alert/checkpoints')
  @Roles(Role.admin, Role.monitoring, Role.statesman)
  findAllCheckPoints(
    @Param('alert') alertId: string,
    @Query(ListQueryArgsPipe) params: ListQueryArgsDto,
  ) {
    return this.alertsService.findAllCheckPoints({
      ...params,
      where: {
        ...params.where,
        alertId,
      },
    });
  }

  @ApiOperation({
    servers: [{ url: '/v1' }],
    summary: 'create a checkpoint',
    description: 'Return an checkpoint created',
  })
  @Post('/:alert/checkpoint')
  createCheckpoint(
    @Request() req,
    @Param('alert') alertId: string,
    @Body() checkpoint: CheckpointDto,
  ): Promise<Checkpoint> {
    const { customerId } = req.user as IRequestUser;

    return this.alertsService.createCheckpoint({
      ...checkpoint,
      alertId,
      customerId,
    });
  }
}
