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
import { ReservationSpace } from '@prisma/client';
import { Policies } from '@src/auth/policies.decorator';
import { ListQueryArgsDto } from '@src/common/dto/list-query-args.dto';
import { ListQueryArgsPipe } from '@src/common/pipes/ListQueryArgsPipe';
import { IRequestUser } from '@src/interfaces/types';
import { ReservationSpaceDto } from './dto/reservation-space.dto';
import { UpdateReservationSpaceDto } from './dto/update-reservation-space.dto';
import { ReservationSpaceList } from './entities/reservation-space-list.entity';
import { CustomerVerification } from '@src/auth/customer-verification.decorator';
import { ReservationSpaceService } from './reservation-space.service';
import { PoliciesExclude } from '@src/auth/policies-exclude.decorator';

@ApiTags('customer')
@ApiBearerAuth()
@Controller({
  path: 'customers',
  version: '1',
})
export class ReservationSpaceController {
  constructor(
    private readonly reservationSpaceService: ReservationSpaceService,
  ) {}

  @ApiOperation({
    servers: [{ url: '/v1' }],
    summary: 'Get all reservation spaces',
    description: 'Returns a list of reservation spaces',
  })
  @Get(':customer/reservation-spaces')
  @PoliciesExclude('list-reservation-spaces', 'list-reservations')
  @CustomerVerification()
  findAll(
    @Request() req,
    @Param('customer') id: string,
    @Query(ListQueryArgsPipe) params: ListQueryArgsDto,
  ): Promise<ReservationSpaceList> {
    return this.reservationSpaceService.findAll({
      ...params,
      where: {
        ...params.where,
        customerId: id,
      },
    });
  }

  @ApiOperation({
    servers: [{ url: '/v1' }],
    summary: 'create a reservation space',
    description: 'Return a reservation space created',
  })
  @Policies('create-reservation-spaces')
  @Post(':customer/reservation-spaces')
  @CustomerVerification()
  create(
    @Request() req,
    @Param('customer') id: string,
    @Body() reservation: ReservationSpaceDto,
  ): Promise<ReservationSpace> {
    return this.reservationSpaceService.create({
      ...reservation,
      customerId: id,
    });
  }

  @ApiOperation({
    servers: [{ url: '/v1' }],
    summary: 'update a reservation space',
    description: 'Return a reservation space updated',
  })
  @Policies('modify-reservation-spaces')
  @Patch(':customer/reservation-spaces/:id')
  @CustomerVerification()
  update(
    @Request() req,
    @Param('id') id: string,
    @Param('customer') customer: string,
    @Body() reservationSpace: UpdateReservationSpaceDto,
  ): Promise<ReservationSpace> {
    const { customerId } = req.user as IRequestUser;

    return this.reservationSpaceService.update(id, {
      ...reservationSpace,
      customerId,
    });
  }
}
