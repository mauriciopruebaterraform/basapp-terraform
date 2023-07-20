import { CustomerVerification } from '@src/auth/customer-verification.decorator';
import { Controller, Get, Request, Post, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListQueryArgsDto } from '@src/common/dto/list-query-args.dto';
import { ListQueryArgsPipe } from '@src/common/pipes/ListQueryArgsPipe';
import { NeighborhoodService } from './neighborhood-alarm.service';
import { NeighborhoodAlarmList } from './entities/neighborhood-alarm-list.entity';
import { NeighborhoodAlarm, Role } from '@prisma/client';
import { Roles } from '@src/auth/roles.decorator';
import { IRequestUser } from '@src/interfaces/types';

@ApiTags('customer')
@ApiBearerAuth()
@Controller({
  path: 'customers',
  version: '1',
})
export class NeighborhoodController {
  constructor(private readonly neighborhoodService: NeighborhoodService) {}

  @ApiOperation({
    servers: [{ url: '/v1' }],
    summary: 'Get all neighborhood alarms',
    description: 'Returns a list of neighborhood alarms',
  })
  @Get(':customer/neighborhood-alarm')
  @Roles(Role.monitoring, Role.statesman)
  @CustomerVerification()
  findAll(
    @Param('customer') id: string,
    @Query(ListQueryArgsPipe) params: ListQueryArgsDto,
  ): Promise<NeighborhoodAlarmList> {
    return this.neighborhoodService.findAll({
      ...params,
      where: {
        ...params.where,
        customerId: id,
      },
    });
  }

  @ApiOperation({
    servers: [{ url: '/v1' }],
    summary: 'create a neighborhood alarm',
    description: 'Return a neighborhood alarm created',
  })
  @Post(':customer/neighborhood-alarm')
  @Roles(Role.user)
  @CustomerVerification()
  create(
    @Request() req,
    @Param('customer') customer: string,
  ): Promise<NeighborhoodAlarm> {
    const { id } = req.user as IRequestUser;

    return this.neighborhoodService.create({
      customerId: customer,
      userId: id,
    });
  }
}
