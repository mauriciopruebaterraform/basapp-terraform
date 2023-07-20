import { Prisma } from '@prisma/client';
import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { PrismaService } from '@src/database/prisma.service';
import { IEntityService, IPaginationArgs } from '@src/interfaces/types';
import { Service } from '@src/common/classes/service.class';
import { NotificationTemplateDto } from './dto/notification-template.dto';
import { UpdateNotificationTemplateDto } from './dto/update-notification-template.dto';
import { errorCodes } from './notification-templates.constants';

@Injectable()
export class NotificationTemplatesService
  extends Service
  implements IEntityService
{
  constructor(readonly prisma: PrismaService) {
    super(prisma);
  }

  async validateNotificationTemplate(id: string, customerId: string) {
    const existNotificationTemplate =
      await this.prisma.notificationTemplate.count({
        where: {
          id,
          customerId,
        },
      });
    if (!existNotificationTemplate) {
      throw new UnprocessableEntityException({
        statusCode: 422,
        message: errorCodes.NOTIFICATION_TEMPLATE_NOT_FOUND,
      });
    }
  }
  create(data: NotificationTemplateDto & { customerId: string }) {
    const { image, customerId, ...notificationTemplate } = data;
    return this.prisma.notificationTemplate.create({
      data: {
        ...notificationTemplate,
        image: image as unknown as Prisma.InputJsonObject,
        customer: {
          connect: {
            id: customerId,
          },
        },
      },
    });
  }
  async update(
    id: string,
    data: UpdateNotificationTemplateDto & { customerId: string },
  ) {
    const { image, customerId, ...notificationTemplate } = data;
    await this.validateNotificationTemplate(id, customerId);
    return await this.prisma.notificationTemplate.update({
      data: {
        ...notificationTemplate,
        image: image as unknown as Prisma.InputJsonValue,
      },
      where: {
        id,
      },
    });
  }

  async findAll(
    params: IPaginationArgs<Prisma.NotificationTemplateFindManyArgs>,
  ) {
    const { includeCount, skip, take, ...findAllParams } = params;
    return this.paginate(
      'notificationTemplate',
      {
        ...findAllParams,
      },
      { includeCount, skip, take },
    );
  }
}
