import {
  Body,
  Controller,
  Get,
  InternalServerErrorException,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '@src/auth/roles.decorator';
import { Role } from '@prisma/client';
import { EventCategoryService } from './event-category.service';
import { EventCategory } from './entities/event-category.entity';
import { CreateEventCategoryDto } from './dto/create-event-categor.dto';
import { ListQueryArgsPipe } from '@src/common/pipes/ListQueryArgsPipe';
import { ListQueryArgsDto } from '@src/common/dto/list-query-args.dto';
import { EventCategoryList } from './entities/event-category-list.entity';
import { UpdateEventCategoryDto } from './dto/update-event-category.dto';
import { errorCodes } from './event-category.constants';

@ApiTags('event-category')
@ApiBearerAuth()
@Controller({
  path: 'event-category',
  version: '1',
})
export class EventCategoryController {
  constructor(private readonly eventCategoryService: EventCategoryService) {}

  @ApiOperation({
    servers: [{ url: '/v1' }],
    summary: 'create new Category events',
    description: 'allows to create new categories of events',
  })
  @Post()
  @Roles(Role.admin)
  async create(
    @Body() categoryEvent: CreateEventCategoryDto,
  ): Promise<EventCategory> {
    return this.eventCategoryService.create(categoryEvent);
  }

  @ApiOperation({
    servers: [{ url: '/v1' }],
    summary: 'Get all event categories',
    description: 'Returns a list of event categories',
  })
  @Roles(Role.admin, Role.monitoring, Role.statesman)
  @Get()
  findAll(
    @Query(ListQueryArgsPipe) params: ListQueryArgsDto,
  ): Promise<EventCategoryList> {
    return this.eventCategoryService.findAll(params);
  }

  @ApiOperation({
    servers: [{ url: '/v1' }],
    summary: 'Update a event category',
  })
  @Roles(Role.admin)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() eventCategory: UpdateEventCategoryDto,
  ): Promise<EventCategory> {
    try {
      const updated = await this.eventCategoryService.update(id, eventCategory);
      return updated;
    } catch (err) {
      if (err.code === 'P2025') {
        throw new NotFoundException(errorCodes.EVENT_CATEGORY_NOT_FOUND);
      }
      throw new InternalServerErrorException(
        'there was an error updating event category',
      );
    }
  }
}
