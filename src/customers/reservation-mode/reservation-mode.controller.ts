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
import { Policies } from '@src/auth/policies.decorator';
import { ListQueryArgsDto } from '@src/common/dto/list-query-args.dto';
import { ListQueryArgsPipe } from '@src/common/pipes/ListQueryArgsPipe';
import { IRequestUser } from '@src/interfaces/types';
import { ReservationModeDto } from './dto/reservation-mode.dto';
import { UpdateReservationModeDto } from './dto/update-reservation-space.dto';
import { ReservationModeList } from './entities/reservation-mode-list.entity';
import { CustomerVerification } from '@src/auth/customer-verification.decorator';
import { ReservationMode } from './entities/reservation-mode.entity';
import { ReservationModeService } from './reservation-mode.service';
import { PoliciesExclude } from '@src/auth/policies-exclude.decorator';

@ApiTags('customer')
@ApiBearerAuth()
@Controller({
  path: 'customers',
  version: '1',
})
export class ReservationModeController {
  constructor(
    private readonly reservationModeService: ReservationModeService,
  ) {}

  @ApiOperation({
    servers: [{ url: '/v1' }],
    summary: 'Get all reservation modes',
    description: 'Returns a list of reservation modes',
  })
  @Get(':customer/reservation-modes')
  @PoliciesExclude('list-reservation-modes', 'list-reservations')
  @CustomerVerification()
  findAll(
    @Request() req,
    @Param('customer') id: string,
    @Query(ListQueryArgsPipe) params: ListQueryArgsDto,
  ): Promise<ReservationModeList> {
    return this.reservationModeService.findAll({
      ...params,
      where: {
        ...params.where,
        customerId: id,
      },
    });
  }

  @ApiOperation({
    servers: [{ url: '/v1' }],
    summary: 'create reservation mode',
    description: 'create a reservation mode',
  })
  @Policies('create-reservation-mode')
  @Post(':customer/reservation-modes')
  @CustomerVerification()
  create(
    @Request() req,
    @Param('customer') id: string,
    @Body() reservationMode: ReservationModeDto,
  ): Promise<ReservationMode> {
    const { customerId, id: userId } = req.user as IRequestUser;
    return this.reservationModeService.create({
      ...reservationMode,
      userId,
      customerId: customerId,
    });
  }

  @ApiOperation({
    servers: [{ url: '/v1' }],
    summary: 'update a reservation mode',
    description: 'Return a reservation mode updated',
  })
  @Policies('modify-reservation-mode')
  @Patch(':customer/reservation-modes/:id')
  @CustomerVerification()
  update(
    @Request() req,
    @Param('id') id: string,
    @Param('customer') customer: string,
    @Body() reservationMode: UpdateReservationModeDto,
  ): Promise<ReservationMode> {
    const { customerId, id: userId } = req.user as IRequestUser;

    return this.reservationModeService.update(id, {
      ...reservationMode,
      customerId,
      userId,
    });
  }
}
