import {
  Controller,
  Get,
  Query,
  Request,
  Param,
  Patch,
  Post,
  Body,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { ListQueryArgsDto } from '@src/common/dto/list-query-args.dto';
import { ListQueryArgsPipe } from '@src/common/pipes/ListQueryArgsPipe';
import { AuthorizedUsersService } from './authorized-users.service';
import { AuthorizedUserList } from './entities/authorized-user-list.entity';
import { Policies } from '@src/auth/policies.decorator';
import { IRequestUser } from '@src/interfaces/types';
import { AuthorizedUser } from '@prisma/client';
import { CustomerVerification } from '@src/auth/customer-verification.decorator';
import { AuthorizedUserDto } from './dto/authorized-user.dto';
import { UpdateAuthorizedUserDto } from './dto/update-authorized-user.dto';
import { FileFilterCsv } from '@src/utils';
import { errorCodes } from './authorized-users.constants';
import { AuthorizedUserImportDto } from './dto/import-authorized-user.dto';
import { ListCsvArgsPipe } from '@src/common/pipes/ListCsvArgsPipe';
import { ListCsvArgsDto } from '@src/common/dto/list-csv-args.dto';
import { ConfigurationService } from '@src/configuration/configuration.service';

@ApiTags('customer')
@ApiBearerAuth()
@Controller({
  path: 'customers',
  version: '1',
})
export class AuthorizedUsersController {
  constructor(
    private readonly authorizedUserService: AuthorizedUsersService,
    private readonly configurationService: ConfigurationService,
  ) {}

  @ApiOperation({
    servers: [{ url: '/v1' }],
    summary: 'Get all authorized users',
    description: 'Returns a list of authorized users',
  })
  @Get(':customer/authorized-users')
  @Policies(
    'list-authorized-users',
    'list-reservations',
    'attend-alert',
    'list-events',
  )
  @CustomerVerification()
  findAll(
    @Request() req,
    @Param('customer') id: string,
    @Query(ListQueryArgsPipe) params: ListQueryArgsDto,
  ): Promise<AuthorizedUserList> {
    return this.authorizedUserService.findAll({
      ...params,
      where: {
        ...params.where,
        customerId: id,
      },
    });
  }

  @ApiOperation({
    servers: [{ url: '/v1' }],
    summary: 'generate a csv',
  })
  @Get(':customer/authorized-users/csv')
  @Policies('list-authorized-users')
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
      'authorized-user-csv-topic',
    );
  }

  @ApiOperation({
    servers: [{ url: '/v1' }],
    summary: 'create a authorized user',
    description: 'Return a authorized user created',
  })
  @Policies('create-authorized-user')
  @Post(':customer/authorized-users')
  @CustomerVerification()
  create(
    @Request() req,
    @Param('customer') id: string,
    @Body() authorizedUser: AuthorizedUserDto,
  ): Promise<AuthorizedUser> {
    const { id: userId } = req.user as IRequestUser;

    return this.authorizedUserService.create({
      ...authorizedUser,
      customerId: id,
      userId,
    });
  }

  @ApiOperation({
    servers: [{ url: '/v1' }],
    summary: 'update a authorized user',
    description: 'Return a authorized user updated',
  })
  @Policies('modify-authorized-user')
  @Patch(':customer/authorized-users/:id')
  @CustomerVerification()
  update(
    @Request() req,
    @Param('id') id: string,
    @Param('customer') customer: string,
    @Body() authorizedUser: UpdateAuthorizedUserDto,
  ): Promise<AuthorizedUser> {
    const { customerId, id: userId } = req.user as IRequestUser;

    return this.authorizedUserService.update(id, {
      ...authorizedUser,
      customerId,
      userId,
    });
  }

  @ApiOperation({
    servers: [{ url: '/v1' }],
    summary: 'create many authorized user',
    description: 'Returns the number of authorized user created',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        reservationTypes: {
          type: 'array',
          nullable: true,
          items: {
            type: 'string',
            nullable: true,
            example: '88867c3e-941f-40d8-8cde-3852b1e25f23',
          },
        },
      },
      required: ['file'],
    },
  })
  @Policies('create-authorized-user')
  @Post(':customer/authorized-users/import')
  @ApiConsumes('multipart/form-data')
  @CustomerVerification()
  @UseInterceptors(
    FileInterceptor('file', {
      fileFilter: FileFilterCsv,
    }),
  )
  async importAuthorizedUsers(
    @Request() req,
    @Param('customer') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() authorizedUser?: AuthorizedUserImportDto,
  ): Promise<{ count: number }> {
    const { id: userId } = req.user as IRequestUser;

    if (req.fileValidationError) {
      throw new BadRequestException(errorCodes.INVALID_FILE_EXTENSION);
    }

    const reservationTypes = authorizedUser?.reservationTypes?.split(',');
    return await this.authorizedUserService.loadCsv(file, {
      reservationTypes,
      customerId: id,
      userId,
    });
  }
}
