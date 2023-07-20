import { CustomerLot, Role } from '@prisma/client';
import {
  Controller,
  Get,
  Query,
  Post,
  Body,
  Patch,
  Param,
  UploadedFile,
  Request,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { ListQueryArgsDto } from '@src/common/dto/list-query-args.dto';
import { ListQueryArgsPipe } from '@src/common/pipes/ListQueryArgsPipe';
import { CustomerLotsService } from './customer-lots.service';
import { CustomerLotList } from './entities/customer-lot-list.entity';
import { FileInterceptor } from '@nestjs/platform-express';
import { Roles } from '@src/auth/roles.decorator';
import { CustomerLotDto } from './dto/customer-lot.dto';
import { UpdateCustomerLotDto } from './dto/update-customer-lot.dto';
import { errorCodes } from './customer-lots.constants';
import { FileFilterCsv } from '@src/utils';
import { CustomerLotImportDto } from './dto/customer-lot-import.dto';

@ApiTags('customer')
@ApiBearerAuth()
@Controller({
  path: 'customers',
  version: '1',
})
export class CustomerLotsController {
  constructor(private readonly customerLotsService: CustomerLotsService) {}

  @ApiOperation({
    servers: [{ url: '/v1' }],
    summary: 'Get all customer lots',
    description: 'Returns a list of customer lots',
  })
  @Roles(Role.admin)
  @Get('icm-lots')
  findAll(
    @Query(ListQueryArgsPipe) params: ListQueryArgsDto,
  ): Promise<CustomerLotList> {
    return this.customerLotsService.findAll(params);
  }

  @ApiOperation({
    servers: [{ url: '/v1' }],
    summary: 'create a customer lot',
    description: 'Return a customer lot created',
  })
  @Roles(Role.admin)
  @Post('icm-lots')
  create(@Body() customerLots: CustomerLotDto): Promise<CustomerLot> {
    return this.customerLotsService.create(customerLots);
  }

  @ApiOperation({
    servers: [{ url: '/v1' }],
    summary: 'update a customer lot',
    description: 'Return a customer lot updated',
  })
  @Patch('icm-lots/:id')
  @Roles(Role.admin)
  update(
    @Param('id') id: string,
    @Body() customerLot: UpdateCustomerLotDto,
  ): Promise<CustomerLot> {
    return this.customerLotsService.update(id, customerLot);
  }

  @ApiOperation({
    servers: [{ url: '/v1' }],
    summary: 'create many customer lots',
    description: 'Returns the number of customer lots created',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        customerId: {
          type: 'string',
        },
        file: {
          type: 'string',
          format: 'binary',
        },
      },
      required: ['file', 'customerId'],
    },
  })
  @Post('icm-lots/import')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      fileFilter: FileFilterCsv,
    }),
  )
  async importLots(
    @Request() req,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: CustomerLotImportDto,
  ): Promise<{ count: number }> {
    const { customerId } = body;
    if (req.fileValidationError) {
      throw new BadRequestException(errorCodes.INVALID_FILE_EXTENSION);
    }

    return await this.customerLotsService.loadCsv(file, customerId);
  }
}
