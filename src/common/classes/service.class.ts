import { InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '@src/database/prisma.service';
import { IPaginatedResult, IPaginationArgs } from '@src/interfaces/types';
import { blackListUser } from '@src/users/users.constants';
import { excludeProperties } from '@src/utils/exclude';

export abstract class Service {
  constructor(readonly prisma: PrismaService) {}

  async paginate(
    model: string,
    query,
    pagination: IPaginationArgs<any>,
    keys?: string[],
  ): Promise<IPaginatedResult<any>> {
    try {
      const { skip = 0, take = 100, includeCount = true } = pagination;
      const transactions = [
        this.prisma[model].findMany({ ...query, skip, take }),
      ];

      if (includeCount) {
        transactions.push(this.prisma[model].count({ where: query.where }));
      }

      const [results, count] = await Promise.all(transactions);

      const paginateResult = {
        results,
        pagination: {
          total: includeCount ? count : undefined,
          size: results.length,
          skip,
          take,
          hasMore: includeCount ? skip + take < count : undefined,
        },
      };

      if (keys?.length) {
        const filterResultField = results.map((i) => {
          for (const key of keys) {
            if (i[key] === undefined) {
              break;
            }
            if (i[key] && !Array.isArray(i[key])) {
              i[key] = excludeProperties(i[key], blackListUser);
            }

            if (i[key] && Array.isArray(i[key])) {
              i[key] = i[key].map((j) => excludeProperties(j, blackListUser));
            }
          }
          return i;
        });

        return {
          ...paginateResult,
          results: filterResultField,
        };
      }

      return paginateResult;
    } catch (error) {
      throw new InternalServerErrorException(
        `There was an error retrieving ${model} list.
        Query args: ${JSON.stringify(query)}`,
      );
    }
  }

  async get<T>(model: string, findArgs): Promise<Awaited<T>> {
    try {
      const result = await this.prisma[model].findUnique(findArgs);
      return result;
    } catch (error) {
      throw new InternalServerErrorException(
        `There was an error retrieving ${model}`,
      );
    }
  }

  async getFirst(model: string, findArgs) {
    try {
      const result = await this.prisma[model].findFirst(findArgs);
      return result;
    } catch (error) {
      throw new InternalServerErrorException(
        `There was an error retrieving ${model}`,
      );
    }
  }
}
