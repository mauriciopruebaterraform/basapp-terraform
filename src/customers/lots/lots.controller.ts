import { Policies } from '@src/auth/policies.decorator';
import { Lot } from '@prisma/client';
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
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CustomerVerification } from '@src/auth/customer-verification.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { ListQueryArgsDto } from '@src/common/dto/list-query-args.dto';
import { ListQueryArgsPipe } from '@src/common/pipes/ListQueryArgsPipe';
import { LotsService } from './lots.service';
import { errorCodes } from './lots.constants';
import { IRequestUser } from '@src/interfaces/types';
import { LotList } from './entities/lot-list.entity';
import { LotDto } from './dto/lot.dto';
import { UpdateLotDto } from './dto/update-lot.dto';
import { FileFilterCsv } from '@src/utils';
import { Public } from '@src/auth/public.decorator';

@ApiTags('customer')
@ApiBearerAuth()
@Controller({
  path: 'customers',
  version: '1',
})
export class LotsController {
  constructor(private readonly lotsService: LotsService) {}

  @ApiOperation({
    servers: [{ url: '/v1' }],
    summary: 'Get all lots',
    description: 'Returns a list of lots',
  })
  @Get(':customer/lots')
  @Public()
  findAll(
    @Request() req,
    @Param('customer') id: string,
    @Query(ListQueryArgsPipe) params: ListQueryArgsDto,
  ): Promise<LotList> {
    return this.lotsService.findAll({
      ...params,
      where: {
        ...params.where,
        customerId: id,
      },
    });
  }

  @ApiOperation({
    servers: [{ url: '/v1' }],
    summary: 'create a lot',
    description: 'Return a lot created',
  })
  @Policies('create-lot')
  @Post(':customer/lots')
  @CustomerVerification()
  create(
    @Request() req,
    @Param('customer') id: string,
    @Body() lot: LotDto,
  ): Promise<Lot> {
    const { id: userId } = req.user as IRequestUser;

    return this.lotsService.create({
      ...lot,
      customerId: id,
      userId,
    });
  }

  @ApiOperation({
    servers: [{ url: '/v1' }],
    summary: 'update a lot',
    description: 'Return a lot updated',
  })
  @Policies('modify-lot')
  @Patch(':customer/lots/:id')
  @CustomerVerification()
  async update(
    @Request() req,
    @Param('id') id: string,
    @Param('customer') customer: string,
    @Body() lot: UpdateLotDto,
  ) {
    const { id: userId } = req.user as IRequestUser;

    return this.lotsService.update(id, {
      ...lot,
      userId,
    });
  }

  @ApiOperation({
    servers: [{ url: '/v1' }],
    summary: 'create many lot',
    description: 'Returns the number of lots created',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
      required: ['file'],
    },
  })
  @Policies('create-lot')
  @Post(':customer/lots/import')
  @ApiConsumes('multipart/form-data')
  @CustomerVerification()
  @UseInterceptors(
    FileInterceptor('file', {
      fileFilter: FileFilterCsv,
    }),
  )
  async importLots(
    @Request() req,
    @Param('customer') id: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{ count: number }> {
    const { id: userId } = req.user as IRequestUser;

    if (req.fileValidationError) {
      throw new BadRequestException(errorCodes.INVALID_FILE_EXTENSION);
    }

    return await this.lotsService.loadCsv(file, id, userId);
  }
}
