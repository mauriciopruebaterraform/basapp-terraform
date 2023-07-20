import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
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
import { ContactsService } from './contacts.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { ContactList } from './entities/contact-list.entity';
import { errorCodes as authErrorCodes } from '@src/auth/auth.constants';
import { Contact } from './entities/contact.entity';

@ApiTags('users')
@ApiBearerAuth()
@Controller({ path: 'users', version: '1' })
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @ApiOperation({
    servers: [{ url: '/v1' }],
    summary: 'Get all contact',
    description: 'Get all contact',
  })
  @Get('/:user/contacts')
  async findAllContacts(
    @Request() req,
    @Param('user') id: string,
    @Query(ListQueryArgsPipe) params: ListQueryArgsDto,
  ): Promise<ContactList> {
    params.where = {
      ...params.where,
      userId: id,
    };
    return await this.contactsService.findAllContacts(
      params,
      req.user.customerId,
      id,
    );
  }

  @ApiOperation({
    servers: [{ url: '/v1' }],
    summary: 'create contacts',
    description: 'create contacts',
  })
  @Post('/:user/contacts')
  async createContact(
    @Param('user') id: string,
    @Body() contact: CreateContactDto,
  ): Promise<Contact> {
    return await this.contactsService.create({
      ...contact,
      userId: id,
    });
  }

  @ApiOperation({
    servers: [{ url: '/v1' }],
    summary: 'update contacts',
    description: 'update contacts',
  })
  @Patch('/:user/contacts/:id')
  async updateContacts(
    @Request() req,
    @Param('user') userId: string,
    @Param('id') id: string,
    @Body() contact: UpdateContactDto,
  ): Promise<Contact> {
    return await this.contactsService.update(id, {
      ...contact,
      userId,
    });
  }

  @ApiOperation({
    servers: [{ url: '/v1' }],
    summary: 'update contacts',
    description: 'update contacts',
  })
  @Delete('/:user/contacts/:id')
  async deleteContact(
    @Request() req,
    @Param('user') userId: string,
    @Param('id') id: string,
  ) {
    if (userId !== req.user.id) {
      throw new ForbiddenException({
        error: 'Forbidden',
        message: authErrorCodes.AUTHORIZATION_REQUIRED,
      });
    }
    await this.contactsService.deleteContact(id, userId);
    return;
  }
}
