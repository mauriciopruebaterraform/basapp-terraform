import { Policies } from '@src/auth/policies.decorator';
import { PoliciesExclude } from '@src/auth/policies-exclude.decorator';
import { UsefulInformation } from '@prisma/client';
import {
  BadRequestException,
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
import { errorCodes } from './useful-information.constants';
import { IRequestUser } from '@src/interfaces/types';
import { UsefulInformationList } from './entities/useful-information-list.entity';
import { UsefulInformationDto } from './dto/useful-information.dto';
import { UpdateUsefulInformationDto } from './dto/update-useful-information.dto';
import { CustomerVerification } from '@src/auth/customer-verification.decorator';
import { UsefulInformationService } from './useful-information.service';

@ApiTags('customer')
@ApiBearerAuth()
@Controller({
  path: 'customers',
  version: '1',
})
export class UsefulInformationController {
  constructor(
    private readonly usefulInformationService: UsefulInformationService,
  ) {}

  @ApiOperation({
    servers: [{ url: '/v1' }],
    summary: 'Get all useful information',
    description: 'Returns a list of useful information',
  })
  @Get(':customer/useful-information')
  @PoliciesExclude('list-useful-information')
  @CustomerVerification()
  findAll(
    @Request() req,
    @Param('customer') id: string,
    @Query(ListQueryArgsPipe) params: ListQueryArgsDto,
  ): Promise<UsefulInformationList> {
    return this.usefulInformationService.findAll({
      ...params,
      where: {
        ...params.where,
        customerId: id,
      },
    });
  }

  @ApiOperation({
    servers: [{ url: '/v1' }],
    summary: 'create a useful information',
    description: 'Return a useful information created',
  })
  @Policies('create-useful-information')
  @Post(':customer/useful-information')
  @CustomerVerification()
  create(
    @Request() req,
    @Param('customer') id: string,
    @Body() usefulInformation: UsefulInformationDto,
  ): Promise<UsefulInformation> {
    const { id: userId } = req.user as IRequestUser;
    return this.usefulInformationService.create({
      ...usefulInformation,
      customerId: id,
      userId,
    });
  }

  @ApiOperation({
    servers: [{ url: '/v1' }],
    summary: 'update a useful information',
    description: 'Return a useful information updated',
  })
  @Policies('modify-useful-information')
  @Patch(':customer/useful-information/:id')
  @CustomerVerification()
  async update(
    @Request() req,
    @Param('id') id: string,
    @Param('customer') customer: string,
    @Body() usefulInformation: UpdateUsefulInformationDto,
  ) {
    const { id: userId } = req.user as IRequestUser;

    if (usefulInformation.categoryId === id) {
      throw new BadRequestException(
        errorCodes.INVALID_SAME_CATEGORY_USEFUL_INFORMATION,
      );
    }
    return this.usefulInformationService.update(id, {
      ...usefulInformation,
      userId,
    });
  }
}
