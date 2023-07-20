import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
  Request,
  Res,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Reservation } from '@prisma/client';
import { Policies } from '@src/auth/policies.decorator';
import { GetQueryArgsDto } from '@src/common/dto/get-query-args.dto';
import { ListQueryArgsDto } from '@src/common/dto/list-query-args.dto';
import { GetQueryArgsPipe } from '@src/common/pipes/GetQueryArgsPipe';
import { ListQueryArgsPipe } from '@src/common/pipes/ListQueryArgsPipe';
import { ReservationList } from './entities/reservation-list.entity';
import { CustomerVerification } from '@src/auth/customer-verification.decorator';
import { errorCodes } from './reservations.constants';
import { ReservationService } from './reservations.service';
import { PoliciesExclude } from '@src/auth/policies-exclude.decorator';
import { LastYearReservationDto } from './dto/last-year-reservation.dto';
import { ReservationDto } from './dto/reservation.dto';
import { IRequestUser } from '@src/interfaces/types';
import { CancelReservationEventDto } from './dto/cancel-reservation-event.dto';
import { CancelReservationDto } from './dto/cancel-reservation.dto';
import { ChangeStateReservationDto } from './dto/change-state-reservation.dto';
import { ConfirmReservationDto } from './dto/confirm-reservation.dto';
import { ListCsvArgsDto } from '@src/common/dto/list-csv-args.dto';
import { ListCsvArgsPipe } from '@src/common/pipes/ListCsvArgsPipe';
import { ConfigurationService } from '@src/configuration/configuration.service';
import { Response } from 'express';
import { GetQueryReservationDetailDto } from './dto/get-query-reservation-detail.dto';
import { Role } from '@prisma/client';
import { Roles } from '@src/auth/roles.decorator';
import { StatsArgsDto } from '@src/common/dto/stats.dto';

@ApiTags('customer')
@ApiBearerAuth()
@Controller({
  path: 'customers',
  version: '1',
})
export class ReservationController {
  constructor(
    private readonly reservationService: ReservationService,
    private readonly configurationService: ConfigurationService,
  ) {}

  @ApiOperation({
    servers: [{ url: '/v1' }],
    summary: 'Get all reservations',
    description: 'Returns a list of reservations',
  })
  @Get(':customer/reservations')
  @PoliciesExclude('list-reservations')
  @CustomerVerification()
  findAll(
    @Request() req,
    @Param('customer') id: string,
    @Query(ListQueryArgsPipe) params: ListQueryArgsDto,
  ): Promise<ReservationList> {
    return this.reservationService.findAll({
      ...params,
      where: {
        ...params.where,
        customerId: id,
      },
    });
  }

  @ApiOperation({
    servers: [{ url: '/v1' }],
    description: 'get alerts statistics',
  })
  @Get('/reservations/statistics')
  @Roles(Role.admin, Role.monitoring, Role.statesman)
  getStatistics(
    @Request() req,
    @Query(ListQueryArgsPipe) params: StatsArgsDto,
  ) {
    return this.reservationService.getStatistics(req.user.customerId, params);
  }

  @ApiOperation({
    servers: [{ url: '/v1' }],
    summary: 'generate a csv',
  })
  @Get(':customer/reservations/csv')
  @Policies('list-reservations')
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
      'reservation-csv-topic',
    );
  }

  @ApiOperation({
    servers: [{ url: '/v1' }],
    summary: 'Get all last year reservations',
  })
  @Get(':customer/reservations/find-last-year-reservations')
  @PoliciesExclude('create-reservation')
  @CustomerVerification()
  async findLastYearReservations(@Query() params: LastYearReservationDto) {
    return this.reservationService.findLastYearReservations(params);
  }

  @ApiOperation({
    servers: [{ url: '/v1' }],
    summary: 'find a reservations',
    description: 'Return a reservations found',
  })
  @Get(':customer/reservations/find-reservations')
  @PoliciesExclude('create-reservation')
  @CustomerVerification()
  findReservations(
    @Query(GetQueryArgsPipe)
    params: GetQueryArgsDto,
  ) {
    return this.reservationService.findReservations(params);
  }

  @ApiOperation({
    servers: [{ url: '/v1' }],
    summary: 'get reservation csv list',
  })
  @Get(':customer/reservations/download-detail')
  @CustomerVerification()
  @Policies('list-reservations')
  async downloadDetailList(
    @Param('customer') id: string,
    @Query()
    params: GetQueryReservationDetailDto,
    @Res() res: Response,
  ) {
    const csv = await this.reservationService.downloadDetailList(params);
    res.writeHead(200, {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment;filename=reservas.csv',
    });
    res.write(csv);
    res.end();
    return;
  }

  @ApiOperation({
    servers: [{ url: '/v1' }],
    summary: 'Cancel a reservation event',
  })
  @Post(':customer/reservations/cancel-reservation-event')
  @PoliciesExclude('create-reservation')
  @CustomerVerification()
  cancelReservationEvent(
    @Request() req,
    @Body() reservation: CancelReservationEventDto,
  ) {
    const { id: userId } = req.user as IRequestUser;

    return this.reservationService.cancelReservationAndEvent({
      ...reservation,
      userId,
    });
  }

  @ApiOperation({
    servers: [{ url: '/v1' }],
    summary: 'cancel a reservation',
  })
  @Post(':customer/reservations/cancel-reservation')
  @PoliciesExclude('create-reservation')
  @CustomerVerification()
  cancelReservation(@Request() req, @Body() reservation: CancelReservationDto) {
    const { id: userId } = req.user as IRequestUser;

    return this.reservationService.cancelReservation({
      ...reservation,
      userId,
    });
  }

  @ApiOperation({
    servers: [{ url: '/v1' }],
    summary: 'Change reservation state',
  })
  @Post(':customer/reservations/change-state')
  @PoliciesExclude('create-reservation')
  @CustomerVerification()
  changeState(@Request() req, @Body() reservation: ChangeStateReservationDto) {
    const { id: userId } = req.user as IRequestUser;

    return this.reservationService.changeState({
      ...reservation,
      userId,
    });
  }

  @ApiOperation({
    servers: [{ url: '/v1' }],
    summary: 'confirm reservation',
  })
  @Post(':customer/reservations/confirm-reservation')
  @PoliciesExclude('create-reservation')
  @CustomerVerification()
  confirmReservation(
    @Request() req,
    @Body() reservation: ConfirmReservationDto,
  ) {
    const { id: userId } = req.user as IRequestUser;

    return this.reservationService.confirmReservation({
      ...reservation,
      userId,
    });
  }

  @ApiOperation({
    servers: [{ url: '/v1' }],
    summary: 'Get reservation by id',
  })
  @Policies('list-reservations')
  @Get(':customer/reservations/:id')
  @CustomerVerification()
  async findOne(
    @Request() req,
    @Param('id') id: string,
    @Param('customer') customer: string,
    @Query(GetQueryArgsPipe) params: GetQueryArgsDto,
  ): Promise<Reservation> {
    const reservation = await this.reservationService.findOne(
      id,
      customer,
      params,
    );

    if (!reservation) {
      throw new NotFoundException(errorCodes.RESERVATION_NOT_FOUND);
    }
    return reservation;
  }

  @ApiOperation({
    servers: [{ url: '/v1' }],
    summary: 'create a reservation ',
    description: 'Return a reservation created',
  })
  @PoliciesExclude('create-reservation')
  @Post(':customer/reservations')
  @CustomerVerification()
  create(
    @Request() req,
    @Param('customer') customerId: string,
    @Body() reservation: ReservationDto,
  ) {
    const { id: userId } = req.user as IRequestUser;

    return this.reservationService.create({
      ...reservation,
      userLoggedId: userId,
      customerId,
    });
  }
}
