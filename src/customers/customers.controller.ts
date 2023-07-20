import { Policies } from './../auth/policies.decorator';
import { Role, CustomerEventCategory } from '@prisma/client';
import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '@src/auth/roles.decorator';
import { ListQueryArgsDto } from '@src/common/dto/list-query-args.dto';
import { ListQueryArgsPipe } from '@src/common/pipes/ListQueryArgsPipe';
import { CustomerService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { CustomerVerification } from '@src/auth/customer-verification.decorator';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CustomerList } from './entities/customer-list.entity';
import { Customer } from './entities/customer.entity';
import { errorCodes } from '@src/customers/customers.constants';
import { GetQueryArgsDto } from '@src/common/dto/get-query-args.dto';
import { GetQueryArgsPipe } from '@src/common/pipes/GetQueryArgsPipe';
import { IRequestUser } from '@src/interfaces/types';
import { errorCodes as errorCodesAuth } from '@src/auth/auth.constants';
import { CustomerIntegrationsDto } from './dto/customer-integrations.dto';
import { CustomerIntegrationEntity } from './entities/customer-integration.entity';
import { UpdateCustomerSettings } from './dto/update-settings.dto';
import { CustomerEventCategoriesList } from '../customers/entities/list-customer-event-categories.entity';
import { UpdateCustomerEventCategoriesDto } from './dto/update-customer-event-categories.dto';
import { Public } from '@src/auth/public.decorator';
import { FindCustomerDto } from './dto/find-customer.dto';
import { PoliciesExclude } from '@src/auth/policies-exclude.decorator';
import { ListCsvArgsPipe } from '@src/common/pipes/ListCsvArgsPipe';
import { ListCsvArgsDto } from '@src/common/dto/list-csv-args.dto';
import { ConfigurationService } from '@src/configuration/configuration.service';

@ApiTags('customer')
@ApiBearerAuth()
@Controller({
  path: 'customers',
  version: '1',
})
export class CustomerController {
  constructor(
    private readonly customerService: CustomerService,
    private readonly configurationService: ConfigurationService,
  ) {}

  @ApiOperation({
    servers: [{ url: '/v1' }],
    summary: 'Get all customers',
    description: 'Returns a list of customers',
  })
  @Roles(Role.admin, Role.monitoring, Role.statesman, Role.user)
  @Get()
  findAll(
    @Request() req,
    @Query(ListQueryArgsPipe) params: ListQueryArgsDto,
  ): Promise<CustomerList> {
    const { role, customerId } = req.user as IRequestUser;

    if (role !== Role.admin && role !== Role.user) {
      params = {
        ...params,
        where: {
          ...params.where,
          OR: [
            {
              parentId: customerId,
            },
            {
              id: customerId,
            },
          ],
        },
      };
    }
    return this.customerService.findAll(params);
  }

  @ApiOperation({
    servers: [{ url: '/v1' }],
    summary: 'generate a csv',
  })
  @Get('/csv')
  @Roles(Role.admin)
  generateCsv(@Request() req, @Query(ListCsvArgsPipe) params: ListCsvArgsDto) {
    const { username } = req.user as IRequestUser;

    return this.configurationService.generateCsv(
      { ...params, email: username },
      'customer-csv-topic',
    );
  }

  @ApiOperation({
    servers: [{ url: '/v1' }],
    summary: 'Create a new customer',
  })
  @Post()
  @Roles(Role.admin)
  async create(
    @Request() req,
    @Body() customer: CreateCustomerDto,
  ): Promise<Customer> {
    const data = {
      ...customer,
      userId: req.user.id,
    };
    return this.customerService.create(data);
  }

  @ApiOperation({
    servers: [{ url: '/v1' }],
    summary: 'update customer settings',
  })
  @Patch(':id/settings')
  @Roles(Role.admin, Role.monitoring, Role.statesman)
  @Policies('configure-customer')
  async updateSettings(
    @Request() req,
    @Param('id') id: string,
    @Body() customerSettings: UpdateCustomerSettings,
  ) {
    const { customerId, role, id: userId } = req.user as IRequestUser;
    if (customerId !== id && role !== 'admin') {
      throw new ForbiddenException(errorCodesAuth.ACTION_NOT_ALLOWED);
    }
    return this.customerService.updateSettings(id, customerSettings, userId);
  }

  @ApiOperation({
    servers: [{ url: '/v1' }],
    summary: 'Update a customer',
  })
  @Patch(':id')
  @Roles(Role.admin)
  update(
    @Request() req,
    @Param('id') id: string,
    @Body() customer: UpdateCustomerDto,
  ): Promise<Customer> {
    const data = {
      ...customer,
      userId: req.user.id,
    };
    return this.customerService.update(id, data);
  }

  @ApiOperation({
    servers: [{ url: '/v1' }],
    summary:
      'get a customer by secret key or zone (district, state and country)',
  })
  @Public()
  @Get('exists')
  async findCustomer(@Query() params: FindCustomerDto) {
    const customer = await this.customerService.findFirst({
      ...params,
    });

    if (!customer) {
      throw new NotFoundException(errorCodes.CUSTOMER_NOT_FOUND);
    }
    return customer;
  }

  @ApiOperation({
    servers: [{ url: '/v1' }],
    summary: 'Get customer by id',
  })
  @Get(':id')
  async findOne(
    @Request() req,
    @Param('id') id: string,
    @Query(GetQueryArgsPipe) params: GetQueryArgsDto,
  ): Promise<Customer> {
    const { role, customerId } = req.user as IRequestUser;
    if (role !== Role.admin && customerId !== id) {
      throw new ForbiddenException(errorCodesAuth.AUTHORIZATION_REQUIRED);
    }

    const customer = await this.customerService.findOne(id, params);

    if (!customer) {
      throw new NotFoundException(errorCodes.CUSTOMER_NOT_FOUND);
    }
    return customer;
  }

  @ApiOperation({
    servers: [{ url: '/v1' }],
    summary: 'Update customer integrations',
  })
  @Patch(':id/integrations')
  @Roles(Role.admin, Role.monitoring, Role.statesman)
  @Policies('modify-integrations')
  async updateIntegrations(
    @Request() req,
    @Param('id') id: string,
    @Body() customerIntegrations: CustomerIntegrationsDto,
  ): Promise<CustomerIntegrationEntity> {
    const { id: userId, role, customerId } = req.user as IRequestUser;
    if (role !== Role.admin && customerId !== id) {
      throw new ForbiddenException(errorCodesAuth.AUTHORIZATION_REQUIRED);
    }

    const integrations = await this.customerService.updateIntegrations(
      id,
      customerIntegrations,
      userId,
    );

    return integrations;
  }

  @ApiOperation({
    servers: [{ url: '/v1' }],
    summary: 'Get all customer event categories',
    description: 'Returns a list of customer event categories',
  })
  @Get(':customer/event-categories')
  @PoliciesExclude('configure-category')
  @CustomerVerification()
  findAllEvents(
    @Request() req,
    @Param('customer') id: string,
    @Query(ListQueryArgsPipe) params: ListQueryArgsDto,
  ): Promise<CustomerEventCategoriesList> {
    return this.customerService.findAllEvents({
      ...params,
      where: {
        ...params.where,
        customerId: id,
        active: true,
      },
      include: {
        ...params.include,
        category: true,
      },
    });
  }

  @ApiOperation({
    servers: [{ url: '/v1' }],
    summary: 'update all event related',
    description: 'update all customer event categories',
  })
  @Patch(':id/event-categories')
  @Policies('configure-category')
  async updateEvent(
    @Request() req,
    @Param('id') id: string,
    @Body() customerEvent: UpdateCustomerEventCategoriesDto,
  ): Promise<CustomerEventCategory> {
    const data = {
      ...customerEvent,
      updatedById: req.user.id,
      customerId: req.user.customerId,
    };
    return this.customerService.updateEvent(id, data);
  }

  @ApiOperation({
    servers: [{ url: '/v1' }],
    summary: 'get a customer by url',
  })
  @Public()
  @Get('url/:url')
  getCustomerByUrl(@Param('url') url: string) {
    return this.customerService.findFirst(
      {
        url,
      },
      {
        select: {
          id: true,
          name: true,
          image: true,
          notes: true,
          speed: true,
        },
      },
    );
  }

  @ApiOperation({
    servers: [{ url: '/v1' }],
  })
  @Public()
  @Get('locations/neighborhood')
  async getNeighborhoods(
    @Query('district') district: string,
    @Query('state') state: string,
    @Query('country') country: string,
  ) {
    const customer = await this.customerService.findFirst(
      {
        active: true,
        district: district || '',
        state: state || '',
        country: country || '',
        type: 'government',
      },
      {
        select: {
          locations: {
            where: {
              type: 'neighborhood',
            },
          },
        },
      },
    );

    if (customer) {
      return customer.locations;
    }
    return [];
  }
}
