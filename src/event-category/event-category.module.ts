import { Module } from '@nestjs/common';
import { EventCategoryController } from './event-category.controller';
import { EventCategoryService } from './event-category.service';

@Module({
  controllers: [EventCategoryController],
  providers: [EventCategoryService],
})
export class EventCategoryModule {}
