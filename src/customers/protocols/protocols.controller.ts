import { Policies } from '@src/auth/policies.decorator';
import { Protocol } from '@prisma/client';
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
import { IRequestUser } from '@src/interfaces/types';
import { ProtocolList } from './entities/protocol-list.entity';
import { ProtocolDto } from './dto/protocol.dto';
import { UpdateProtocolDto } from './dto/update-protocol.dto';
import { CustomerVerification } from '@src/auth/customer-verification.decorator';
import { ProtocolsService } from './protocols.service';

@ApiTags('customer')
@ApiBearerAuth()
@Controller({
  path: 'customers',
  version: '1',
})
export class ProtocolsController {
  constructor(private readonly protocolsService: ProtocolsService) {}

  @ApiOperation({
    servers: [{ url: '/v1' }],
    summary: 'Get all protocols',
    description: 'Returns a list of protocols',
  })
  @Get(':customer/protocols')
  @Policies('list-protocols')
  @CustomerVerification()
  findAll(
    @Request() req,
    @Param('customer') id: string,
    @Query(ListQueryArgsPipe) params: ListQueryArgsDto,
  ): Promise<ProtocolList> {
    return this.protocolsService.findAll({
      ...params,
      where: {
        ...params.where,
        customerId: id,
      },
    });
  }

  @ApiOperation({
    servers: [{ url: '/v1' }],
    summary: 'create a protocol',
    description: 'Return a protocol created',
  })
  @Policies('create-protocol')
  @Post(':customer/protocols')
  @CustomerVerification()
  create(
    @Request() req,
    @Param('customer') id: string,
    @Body() protocol: ProtocolDto,
  ): Promise<Protocol> {
    const { id: userId } = req.user as IRequestUser;
    return this.protocolsService.create({
      ...protocol,
      customerId: id,
      userId,
    });
  }

  @ApiOperation({
    servers: [{ url: '/v1' }],
    summary: 'update a protocol',
    description: 'Return a protocol updated',
  })
  @Policies('modify-protocol')
  @Patch(':customer/protocols/:id')
  @CustomerVerification()
  update(
    @Request() req,
    @Param('id') id: string,
    @Param('customer') customer: string,
    @Body() protocol: UpdateProtocolDto,
  ): Promise<Protocol> {
    const { id: userId } = req.user as IRequestUser;

    return this.protocolsService.update(id, {
      ...protocol,
      userId,
    });
  }
}
