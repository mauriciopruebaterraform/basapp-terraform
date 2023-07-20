import {
  Controller,
  Get,
  Param,
  Request,
  Query,
  Post,
  Body,
  Patch,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { ListQueryArgsPipe } from '@src/common/pipes/ListQueryArgsPipe';
import { IRequestUser } from '@src/interfaces/types';
import { ListQueryArgsDto } from '@src/common/dto/list-query-args.dto';
import { AlertStateService } from './alert-states.service';
import { AlertStatesList } from './entities/alert-states-list.entity';
import { Policies } from '@src/auth/policies.decorator';
import { CreateAlertState } from './dto/create-alert-state.dto';
import { AlertState } from './entities/alert-states.entity';
import { UpdateAlertStateDto } from './dto/update-alert-state.dto';

@ApiTags('alert-states')
@ApiBearerAuth()
@Controller({
  path: 'alert-states',
  version: '1',
})
export class AlertStatesController {
  constructor(private readonly alertStatesService: AlertStateService) {}

  @ApiOperation({
    servers: [{ url: '/v1' }],
    summary: 'Get all alert states',
    description: 'Returns a list of alert states',
  })
  @Get()
  @Policies('list-alert-states', 'attend-alert')
  findAll(
    @Request() req,
    @Query(ListQueryArgsPipe) params: ListQueryArgsDto,
  ): Promise<AlertStatesList> {
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
    return this.alertStatesService.findAll(params);
  }

  @ApiOperation({
    servers: [{ url: '/v1' }],
    summary: 'create new alert state',
    description: 'allows to create new alert states',
  })
  @Post()
  @Policies('create-alert-state')
  async create(
    @Request() req,
    @Body() alertState: CreateAlertState,
  ): Promise<AlertState> {
    return this.alertStatesService.create({
      ...alertState,
      customerId: req.user.customerId,
    });
  }

  @ApiOperation({
    servers: [{ url: '/v1' }],
    summary: 'Update an alert state',
  })
  @Policies('modify-alert-state')
  @Patch(':id')
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body() alertState: UpdateAlertStateDto,
  ): Promise<AlertState> {
    const { customerId, role } = req.user as IRequestUser;

    return await this.alertStatesService.update(id, {
      edit: alertState,
      customerId,
      role,
    });
  }
}
