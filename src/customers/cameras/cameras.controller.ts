import { Policies } from '@src/auth/policies.decorator';
import { Camera } from '@prisma/client';
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
import { CamerasService } from './cameras.service';
import { IRequestUser } from '@src/interfaces/types';
import { CustomerVerification } from '@src/auth/customer-verification.decorator';
import { CameraList } from './entities/camera-list.entity';
import { CameraDto } from './dto/camera.dto';
import { UpdateCameraDto } from './dto/update-camera.dto';

@ApiTags('customer')
@ApiBearerAuth()
@Controller({
  path: 'customers',
  version: '1',
})
export class CamerasController {
  constructor(private readonly camerasService: CamerasService) {}

  @ApiOperation({
    servers: [{ url: '/v1' }],
    summary: 'Get all cameras',
    description: 'Returns a list of cameras',
  })
  @Get(':customer/cameras')
  @Policies('list-cameras', 'attend-alert')
  @CustomerVerification()
  findAll(
    @Request() req,
    @Param('customer') id: string,
    @Query(ListQueryArgsPipe) params: ListQueryArgsDto,
  ): Promise<CameraList> {
    return this.camerasService.findAll({
      ...params,
      where: {
        ...params.where,
        customerId: id,
      },
    });
  }

  @ApiOperation({
    servers: [{ url: '/v1' }],
    summary: 'create a camera',
    description: 'Return a camera created',
  })
  @Policies('create-camera')
  @Post(':customer/camera')
  @CustomerVerification()
  create(
    @Request() req,
    @Param('customer') id: string,
    @Body() camera: CameraDto,
  ): Promise<Camera> {
    const { id: userId } = req.user as IRequestUser;

    return this.camerasService.create({
      ...camera,
      customerId: id,
      userId,
    });
  }

  @ApiOperation({
    servers: [{ url: '/v1' }],
    summary: 'update a camera',
    description: 'Return a camera updated',
  })
  @Policies('modify-camera')
  @Patch(':customer/camera/:id')
  @CustomerVerification()
  update(
    @Request() req,
    @Param('id') id: string,
    @Param('customer') customer: string,
    @Body() camera: UpdateCameraDto,
  ): Promise<Camera> {
    const { customerId, id: userId } = req.user as IRequestUser;

    return this.camerasService.update(id, {
      ...camera,
      customerId,
      userId,
    });
  }
}
