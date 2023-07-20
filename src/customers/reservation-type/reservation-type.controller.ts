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
import { ReservationType } from '@prisma/client';
import { Policies } from '@src/auth/policies.decorator';
import { ListQueryArgsDto } from '@src/common/dto/list-query-args.dto';
import { ListQueryArgsPipe } from '@src/common/pipes/ListQueryArgsPipe';
import { IRequestUser } from '@src/interfaces/types';
import { ReservationTypeDto } from './dto/reservation-type.dto';
import { UpdateReservationTypeDto } from './dto/update-reservation-type.dto';
import { ReservationTypeList } from './entities/reservation-type-list.entity';
import { ReservationTypeService } from './reservation-type.service';
import { CustomerVerification } from '@src/auth/customer-verification.decorator';
import { PoliciesExclude } from '@src/auth/policies-exclude.decorator';

@ApiTags('customer')
@ApiBearerAuth()
@Controller({
  path: 'customers',
  version: '1',
})
export class ReservationTypeController {
  constructor(
    private readonly reservationTypeService: ReservationTypeService,
  ) {}

  @ApiOperation({
    servers: [{ url: '/v1' }],
    summary: 'Get all reservation types',
    description: 'Returns a list of reservation types',
  })
  @Get(':customer/reservation-types')
  @PoliciesExclude('list-reservation-types', 'list-reservations')
  @CustomerVerification()
  findAll(
    @Request() req,
    @Param('customer') id: string,
    @Query(ListQueryArgsPipe) params: ListQueryArgsDto,
  ): Promise<ReservationTypeList> {
    return this.reservationTypeService.findAll({
      ...params,
      where: {
        ...params.where,
        customerId: id,
      },
    });
  }

  @ApiOperation({
    servers: [{ url: '/v1' }],
    summary: 'create a reservation type',
    description: 'Return a reservation type created',
  })
  @Policies('create-reservation-type')
  @Post(':customer/reservation-types')
  @CustomerVerification()
  create(
    @Request() req,
    @Param('customer') id: string,
    @Body() reservation: ReservationTypeDto,
  ): Promise<ReservationType> {
    return this.reservationTypeService.create({
      ...reservation,
      customerId: id,
    });
  }

  @ApiOperation({
    servers: [{ url: '/v1' }],
    summary: 'update a reservation type',
    description: 'Return a reservation type updated',
  })
  @Policies('modify-reservation-type')
  @Patch(':customer/reservation-types/:id')
  @CustomerVerification()
  update(
    @Request() req,
    @Param('id') id: string,
    @Param('customer') customer: string,
    @Body() reservationType: UpdateReservationTypeDto,
  ): Promise<ReservationType> {
    const { customerId } = req.user as IRequestUser;

    return this.reservationTypeService.update(id, {
      ...reservationType,
      customerId,
    });
  }
}
