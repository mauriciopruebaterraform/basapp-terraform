import { Policies } from '@src/auth/policies.decorator';
import { Location } from '@prisma/client';
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
import { LocationsService } from './locations.service';
import { IRequestUser } from '@src/interfaces/types';
import { LocationList } from './entities/location-list.entity';
import { LocationDto } from './dto/location.dto';
import { CustomerVerification } from '@src/auth/customer-verification.decorator';
import { UpdateLocationDto } from './dto/update-location.dto';

@ApiTags('customer')
@ApiBearerAuth()
@Controller({
  path: 'customers',
  version: '1',
})
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @ApiOperation({
    servers: [{ url: '/v1' }],
    summary: 'Get all locations',
    description: 'Returns a list of locations',
  })
  @Get(':customer/locations')
  @Policies('list-locations')
  @CustomerVerification()
  findAll(
    @Request() req,
    @Param('customer') id: string,
    @Query(ListQueryArgsPipe) params: ListQueryArgsDto,
  ): Promise<LocationList> {
    return this.locationsService.findAll({
      ...params,
      where: {
        ...params.where,
        customerId: id,
      },
    });
  }

  @ApiOperation({
    servers: [{ url: '/v1' }],
    summary: 'create a location',
    description: 'Return a location created',
  })
  @Policies('create-locations')
  @Post(':customer/locations')
  @CustomerVerification()
  create(
    @Request() req,
    @Param('customer') id: string,
    @Body() location: LocationDto,
  ): Promise<Location> {
    const { id: userId } = req.user as IRequestUser;

    return this.locationsService.create({
      ...location,
      customerId: id,
      userId,
    });
  }

  @ApiOperation({
    servers: [{ url: '/v1' }],
    summary: 'update a location',
    description: 'Return a location updated',
  })
  @Policies('modify-locations')
  @Patch(':customer/locations/:id')
  @CustomerVerification()
  update(
    @Request() req,
    @Param('id') id: string,
    @Param('customer') customer: string,
    @Body() location: UpdateLocationDto,
  ): Promise<Location> {
    const { customerId, id: userId } = req.user as IRequestUser;

    return this.locationsService.update(id, {
      ...location,
      customerId,
      userId,
    });
  }
}
