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
import { ReservationLocksService } from './reservation-locks.service';
import { IRequestUser } from '@src/interfaces/types';
import { ReservationLockList } from './entities/reservation-lock-list.entity';
import { ReservationLockDto } from './dto/reservation-lock.dto';
import { CustomerVerification } from '@src/auth/customer-verification.decorator';
import { UpdateReservationLockDto } from './dto/update-reservation-lock.dto';
import { ReservationLock } from './entities/reservation-lock.entity';
import { PoliciesExclude } from '@src/auth/policies-exclude.decorator';

@ApiTags('customer')
@ApiBearerAuth()
@Controller({
  path: 'customers',
  version: '1',
})
export class ReservationLocksController {
  constructor(
    private readonly reservationLocksService: ReservationLocksService,
  ) {}

  @ApiOperation({
    servers: [{ url: '/v1' }],
    summary: 'Get all reservation locks',
    description: 'Returns a list of reservation locks',
  })
  @Get(':customer/reservation-locks')
  @PoliciesExclude('list-reservation-locks', 'list-reservations')
  findAll(
    @Request() req,
    @Param('customer') id: string,
    @Query(ListQueryArgsPipe) params: ListQueryArgsDto,
  ): Promise<ReservationLockList> {
    return this.reservationLocksService.findAll({
      ...params,
      where: {
        ...params.where,
        customerId: id,
      },
    });
  }

  @ApiOperation({
    servers: [{ url: '/v1' }],
    summary: 'create a reservationLock',
    description: 'Return a reservationLock created',
  })
  @Policies('create-reservation-locks')
  @Post(':customer/reservation-locks')
  @CustomerVerification()
  create(
    @Request() req,
    @Param('customer') id: string,
    @Body() reservationLock: ReservationLockDto,
  ): Promise<ReservationLock> {
    return this.reservationLocksService.create({
      ...reservationLock,
      customerId: id,
    });
  }

  @ApiOperation({
    servers: [{ url: '/v1' }],
    summary: 'update a reservation lock',
    description: 'Return a reservation lock updated',
  })
  @Policies('modify-reservation-locks')
  @Patch(':customer/reservation-locks/:id')
  @CustomerVerification()
  update(
    @Request() req,
    @Param('id') id: string,
    @Param('customer') customer: string,
    @Body() reservationLocks: UpdateReservationLockDto,
  ): Promise<ReservationLock> {
    const { customerId } = req.user as IRequestUser;

    return this.reservationLocksService.update(id, {
      ...reservationLocks,
      customerId,
    });
  }
}
