import { ArgumentMetadata } from '@nestjs/common';
import { ListQueryArgsDto } from '../dto/list-query-args.dto';
import { BadRequestException } from '@nestjs/common';

export class ListQueryArgsPipe {
  transform(value: any, metadata: ArgumentMetadata) {
    const args = new ListQueryArgsDto();
    args.skip = 0;
    args.take = 100;
    args.includeCount = true;

    if (metadata.type === 'query') {
      if (value.select && value.include) {
        throw new BadRequestException({
          statusCode: 400,
          message: ['select and include cannot be used together'],
          error: 'Bad Request',
        });
      }
      if (value.select) {
        const parsed = JSON.parse(value.select);
        args.select = Object.keys(parsed).length !== 0 ? parsed : undefined;
      }
      if (value.include) {
        const parsed = JSON.parse(value.include);
        args.include = Object.keys(parsed).length !== 0 ? parsed : undefined;
      }
      if (value.orderBy) {
        const parsed = JSON.parse(value.orderBy);
        args.orderBy = Object.keys(parsed).length !== 0 ? parsed : undefined;
      }
      if (value.where) {
        const parsed = JSON.parse(value.where);
        args.where = Object.keys(parsed).length !== 0 ? parsed : undefined;
      }
      if (value.skip) {
        args.skip = parseInt(value.skip);
      }
      if (value.take) {
        args.take = parseInt(value.take);
      }
      if (value.includeCount) {
        args.includeCount = value.includeCount === 'true';
      }
    }
    return args;
  }
}
