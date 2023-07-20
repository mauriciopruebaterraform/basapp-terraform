import { UserList } from './entities/user-list.entity';
import { Role } from '@prisma/client';
import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UnprocessableEntityException,
  UnauthorizedException,
  Delete,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Policies } from '@src/auth/policies.decorator';
import { PoliciesExclude } from '@src/auth/policies-exclude.decorator';
import { Public } from '@src/auth/public.decorator';
import { Roles } from '@src/auth/roles.decorator';
import { ListQueryArgsDto } from '@src/common/dto/list-query-args.dto';
import { ListQueryArgsPipe } from '@src/common/pipes/ListQueryArgsPipe';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UsersService } from './users.service';
import { errorCodes } from './users.constants';
import { CreateUserDto } from './dto/create-user.dto';
import { UserWithoutPassword } from './entities/user.entity';
import { IRequestUser, IUserWithCustomer } from '@src/interfaces/types';
import { GetQueryArgsDto } from '@src/common/dto/get-query-args.dto';
import { GetQueryArgsPipe } from '@src/common/pipes/GetQueryArgsPipe';
import { UpdateUserDto } from './dto/update-user.dto';
import { errorCodes as authErrorCodes } from '@src/auth/auth.constants';
import { ChangePasswordDto } from './dto/change-password';
import { RegisterDto } from './dto/register.dto';
import { NotificationUserList } from './entities/notification-user-list.entity';
import { ConfigurationService } from '@src/configuration/configuration.service';
import { ListCsvArgsDto } from '@src/common/dto/list-csv-args.dto';
import { ListCsvArgsPipe } from '@src/common/pipes/ListCsvArgsPipe';
import { DeleteUserDto } from './dto/delete-user.dto';

@ApiTags('users')
@ApiBearerAuth()
@Controller({ path: 'users', version: '1' })
export class UsersController {
  constructor(
    private userService: UsersService,
    private configurationService: ConfigurationService,
  ) {}
  @ApiOperation({
    servers: [{ url: '/v1' }],
    summary: 'Get user information based on request token',
  })
  @Get('me')
  @Roles(Role.admin, Role.statesman, Role.monitoring)
  async getMe(@Request() req): Promise<IUserWithCustomer> {
    const user: IUserWithCustomer = await this.userService.findOne(
      req.user.id,
      {
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              image: true,
              active: true,
              type: true,
            },
          },
          userPermissions: {
            include: {
              monitoringAlertTypes: true,
              monitoringEventTypes: true,
              monitoringCustomers: true,
            },
          },
        },
      },
    );

    if (
      !user?.active ||
      (!user?.customer?.active && user?.role !== Role.admin)
    ) {
      throw new UnauthorizedException({
        statusCode: 401,
        error: 'Unauthorized',
        message: authErrorCodes.AUTHORIZATION_REQUIRED,
      });
    }

    return user;
  }

  @ApiOperation({
    servers: [{ url: '/v1' }],
    summary: 'generate a csv',
  })
  @Get('csv')
  @Policies('list-users')
  generateCsv(@Request() req, @Query(ListCsvArgsPipe) params: ListCsvArgsDto) {
    const { customerId, username } = req.user as IRequestUser;
    return this.configurationService.generateCsv(
      {
        ...params,
        where: {
          ...params.where,
          customerId,
        },
        email: username,
      },
      'user-csv-topic',
    );
  }

  @ApiOperation({
    servers: [{ url: '/v1' }],
    summary: 'Get user information based on request token',
  })
  @Roles(Role.user)
  @Get('/user/me')
  async getFinalUser(
    @Request() req,
    @Query(GetQueryArgsPipe) params: GetQueryArgsDto,
  ): Promise<IUserWithCustomer> {
    const user: IUserWithCustomer = await this.userService.findOne(
      req.user.id,
      {
        ...params,
        include: {
          customer: true,
          ...params.include,
        },
      },
    );

    if (!user?.customer?.active) {
      throw new UnauthorizedException({
        statusCode: 401,
        error: 'Unauthorized',
        message: authErrorCodes.AUTHORIZATION_REQUIRED,
      });
    }

    return user;
  }

  @ApiOperation({
    servers: [{ url: '/v1' }],
    summary: 'Get user information based on request token',
  })
  @Roles(Role.user)
  @Delete(':id/delete')
  async delete(
    @Request() req,
    @Param('id') id: string,
    @Body() body: DeleteUserDto,
  ) {
    return await this.userService.deleteAcc(id, req.user, body.code);
  }

  @ApiOperation({
    servers: [{ url: '/v1' }],
    summary: 'Get all users',
    description: 'Get all users',
  })
  @PoliciesExclude('list-users')
  @Get()
  async findAll(
    @Request() req,
    @Query(ListQueryArgsPipe) params: ListQueryArgsDto,
  ): Promise<UserList> {
    const { user }: { user: IRequestUser } = req;
    if (user.role === Role.statesman || user.role === Role.monitoring) {
      params.where = {
        ...params.where,
        NOT: [{ customer: null }],
        customerId: user.customerId,
      };
    }

    if (user.role === Role.user) {
      params.include = undefined;
      params.where = {
        ...params.where,
        role: Role.user,
        NOT: [{ customer: null }, { id: user.id }],
        customerId: user.customerId,
      };

      params.select = {
        id: true,
        firstName: true,
        lastName: true,
        fullName: true,
        lot: true,
        customerId: true,
      };
    }
    return await this.userService.findAll(params);
  }

  @ApiOperation({
    servers: [{ url: '/v1' }],
    summary: 'Request password reset',
  })
  @Public()
  @HttpCode(200)
  @Post('request-password-reset')
  async requestPasswordReset(@Body() passwordReset: RequestPasswordResetDto) {
    await this.userService.requestPasswordReset(passwordReset.username);
    return { message: 'Password reset email sent' };
  }

  @ApiOperation({
    servers: [{ url: '/v1' }],
    summary: 'Reset password',
  })
  @ApiResponse({
    status: 200,
    description: 'Successful operation',
    schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          example: 'success',
        },
        message: {
          type: 'string',
          example: 'Password updated',
        },
      },
    },
  })
  @Public()
  @HttpCode(200)
  @Post('reset-password')
  async resetPassword(@Body() passwordReset: ResetPasswordDto) {
    await this.userService.resetPasswordWithToken(
      passwordReset.token,
      passwordReset.password,
    );

    return { status: 'success', message: 'Password updated' };
  }

  @ApiOperation({
    servers: [{ url: '/v1' }],
    summary: 'Get user by id',
  })
  @Roles(Role.admin, Role.statesman, Role.monitoring)
  @Get(':id')
  async findOne(
    @Request() req,
    @Param('id') id: string,
    @Query(GetQueryArgsPipe) params: GetQueryArgsDto,
  ): Promise<UserWithoutPassword> {
    const { role } = req.user as IRequestUser;
    const user = await this.userService.findOne(id, params);

    if (
      !user ||
      (role !== Role.admin && user.customerId !== req.user.customerId)
    ) {
      throw new NotFoundException(errorCodes.USER_NOT_FOUND);
    }
    return user;
  }

  @ApiOperation({
    servers: [{ url: '/v1' }],
    summary: 'Create a new user',
  })
  @Roles(Role.admin, Role.statesman, Role.monitoring)
  @Policies('create-user')
  @Post()
  async create(
    @Request() req,
    @Body() user: CreateUserDto,
  ): Promise<UserWithoutPassword> {
    if (user.role === Role.admin && req.user.role !== Role.admin) {
      throw new ForbiddenException(authErrorCodes.ACTION_NOT_ALLOWED);
    }

    if (req.user.role === Role.statesman || req.user.role === Role.monitoring) {
      user.customerId = req.user.customerId;
    }

    const data = {
      ...user,
      updatedById: req.user.id,
    };

    return this.userService.create(data);
  }

  @ApiOperation({
    servers: [{ url: '/v1' }],
    summary: 'Update a user',
  })
  @Patch(':id')
  @PoliciesExclude('modify-user')
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body() user: UpdateUserDto,
  ): Promise<UserWithoutPassword> {
    if (req.user.id === id && req.user.role !== 'user') {
      throw new UnprocessableEntityException(
        errorCodes.USER_CANNOT_UPDATE_SELF,
      );
    }

    if (req.user.id !== id && req.user.role === 'user') {
      throw new ForbiddenException({
        error: 'Forbidden',
        statusCode: 403,
        message: authErrorCodes.AUTHORIZATION_REQUIRED,
      });
    }

    if (req.user.role === Role.statesman || req.user.role === Role.monitoring) {
      if (
        user.role &&
        user.role !== Role.statesman &&
        user.role !== Role.monitoring
      ) {
        throw new UnprocessableEntityException({
          message: errorCodes.INVALID_USER_ROLE,
          statusCode: 403,
        });
      }
    }

    const data = {
      ...user,
      updatedById: req.user.id,
      reqUserCustomerId: req.user.customerId,
    };

    return this.userService.update(id, data);
  }

  @ApiOperation({
    servers: [{ url: '/v1' }],
    summary: 'Change password',
  })
  @Patch(':id/reset-password')
  async updatePassword(
    @Request() req,
    @Param('id') id: string,
    @Body() body: ChangePasswordDto,
  ) {
    if (req.user.id !== id) {
      throw new ForbiddenException({
        statusCode: 403,
        message: errorCodes.ONLY_SELF_PASSWORD_UPDATE_ALLOWED,
      });
    }
    await this.userService.updatePassword(id, body);
    return { status: 'success', message: 'Password updated' };
  }

  @ApiOperation({
    servers: [{ url: '/v1' }],
    summary: 'register a user',
  })
  @Public()
  @Post('/register')
  async register(@Body() body: RegisterDto) {
    return await this.userService.register(body);
  }

  @ApiOperation({
    servers: [{ url: '/v1' }],
    summary: 'Get all notifications',
    description: 'Get all notifications',
  })
  @Get('/:id/notifications')
  async findAllNotifications(
    @Param('id') id: string,
    @Query(ListQueryArgsPipe) params: ListQueryArgsDto,
  ): Promise<NotificationUserList> {
    params.where = {
      ...params.where,
      userId: id,
    };

    params.include = {
      notification: true,
      ...params.include,
    };

    return await this.userService.findAllNotifications(params, id);
  }
}
