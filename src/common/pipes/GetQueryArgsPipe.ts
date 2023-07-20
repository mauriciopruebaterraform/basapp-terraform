import { GetQueryArgsDto } from './../dto/get-query-args.dto';
import { ArgumentMetadata } from '@nestjs/common';
import { BadRequestException } from '@nestjs/common';
export class GetQueryArgsPipe {
  transform(value: any, metadata: ArgumentMetadata) {
    const args = new GetQueryArgsDto();

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
      if (value.where) {
        const parsed = JSON.parse(value.where);
        args.where = Object.keys(parsed).length !== 0 ? parsed : undefined;
      }
      if (value.orderBy) {
        const parsed = JSON.parse(value.orderBy);
        args.orderBy = Object.keys(parsed).length !== 0 ? parsed : undefined;
      }
    }
    return args;
  }
}
