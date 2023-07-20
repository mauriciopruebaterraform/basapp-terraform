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
import { HolidaysService } from './holidays.service';
import { IRequestUser } from '@src/interfaces/types';
import { HolidayList } from './entities/holiday-list.entity';
import { HolidayDto } from './dto/holiday.dto';
import { CustomerVerification } from '@src/auth/customer-verification.decorator';
import { UpdateHolidayDto } from './dto/update-holiday.dto';
import { Holidays } from './entities/holidays.entity';
import { PoliciesExclude } from '@src/auth/policies-exclude.decorator';

@ApiTags('customer')
@ApiBearerAuth()
@Controller({
  path: 'customers',
  version: '1',
})
export class HolidaysController {
  constructor(private readonly holidaysService: HolidaysService) {}

  @ApiOperation({
    servers: [{ url: '/v1' }],
    summary: 'Get all holidays',
    description: 'Returns a list of holidays',
  })
  @Get(':customer/holidays')
  @PoliciesExclude('list-holidays', 'list-reservations')
  findAll(
    @Request() req,
    @Param('customer') id: string,
    @Query(ListQueryArgsPipe) params: ListQueryArgsDto,
  ): Promise<HolidayList> {
    return this.holidaysService.findAll({
      ...params,
      where: {
        ...params.where,
        customerId: id,
      },
    });
  }

  @ApiOperation({
    servers: [{ url: '/v1' }],
    summary: 'create a holiday',
    description: 'Return a holiday created',
  })
  @Policies('create-holidays')
  @Post(':customer/holidays')
  @CustomerVerification()
  create(
    @Request() req,
    @Param('customer') id: string,
    @Body() holiday: HolidayDto,
  ): Promise<Holidays> {
    return this.holidaysService.create({
      ...holiday,
      customerId: id,
    });
  }

  @ApiOperation({
    servers: [{ url: '/v1' }],
    summary: 'update a holiday',
    description: 'Return a holiday updated',
  })
  @Policies('modify-holidays')
  @Patch(':customer/holidays/:id')
  @CustomerVerification()
  update(
    @Request() req,
    @Param('id') id: string,
    @Param('customer') customer: string,
    @Body() holidays: UpdateHolidayDto,
  ): Promise<Holidays> {
    const { customerId } = req.user as IRequestUser;

    return this.holidaysService.update(id, {
      ...holidays,
      customerId,
    });
  }
}
