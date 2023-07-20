import { Policies } from '@src/auth/policies.decorator';
import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListQueryArgsDto } from '@src/common/dto/list-query-args.dto';
import { ListQueryArgsPipe } from '@src/common/pipes/ListQueryArgsPipe';
import { ExternalServiceService } from './external-service.service';
import { ExternalServiceList } from './entities/external-service-list.entity';
import { CustomerVerification } from '@src/auth/customer-verification.decorator';

@ApiTags('customer')
@ApiBearerAuth()
@Controller({
  path: 'customers',
  version: '1',
})
export class ExternalServiceController {
  constructor(
    private readonly externalServiceService: ExternalServiceService,
  ) {}

  @ApiOperation({
    servers: [{ url: '/v1' }],
    summary: 'Get all external services',
    description: 'Returns a list of external services',
  })
  @Get(':customer/external-service')
  @CustomerVerification()
  @Policies('list-alerts', 'attend-alert')
  findAll(
    @Query(ListQueryArgsPipe) params: ListQueryArgsDto,
  ): Promise<ExternalServiceList> {
    return this.externalServiceService.findAll(params);
  }
}
