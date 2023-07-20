import { ArgumentMetadata } from '@nestjs/common';
import { ListCsvArgsDto } from '../dto/list-csv-args.dto';

export class ListCsvArgsPipe {
  transform(value: any, metadata: ArgumentMetadata) {
    const args = new ListCsvArgsDto();

    if (metadata.type === 'query') {
      if (value.orderBy) {
        const parsed = JSON.parse(value.orderBy);
        args.orderBy = Object.keys(parsed).length !== 0 ? parsed : undefined;
      }
      if (value.where) {
        const parsed = JSON.parse(value.where);
        args.where = Object.keys(parsed).length !== 0 ? parsed : undefined;
      }
    }
    return args;
  }
}
