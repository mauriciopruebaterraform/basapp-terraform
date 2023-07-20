import {
  Prisma,
  User,
  Role,
  Customer,
  AuthorizedUser,
  CustomerType,
} from '@prisma/client';
import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@src/database/prisma.service';
import {
  IEntityService,
  IPaginationArgs,
  IPaginatedResult,
  IUserWithCustomer,
  IRequestUser,
} from '@src/interfaces/types';
import {
  changeInputJsonObject,
  changeRelationTable,
  generateCode,
} from './../utils/index';
import * as crypto from 'crypto';
import * as dayjs from 'dayjs';
import { errorCodes, notificationUsers } from './users.constants';
import * as bcrypt from 'bcryptjs';
import { Service } from '@src/common/classes/service.class';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User as EntityUser } from './entities/user.entity';
import { plainToClass } from 'class-transformer';
import { ChangePasswordDto } from './dto/change-password';
import { RegisterDto } from './dto/register.dto';
import { PushNotificationService } from '@src/push-notification/push-notification.service';
import { SmsService } from '@src/sms/sms.service';
import { ConfigurationService } from '@src/configuration/configuration.service';
import { Logger } from '@src/common/logger';
import { errorCodes as authErrorCodes } from '@src/auth/auth.constants';
import { JwtService } from '@nestjs/jwt';
import { isNil } from 'lodash';
import { CustomerSettings } from '@prisma/client';

@Injectable()
export class UsersService extends Service implements IEntityService {
  constructor(
    readonly prisma: PrismaService,
    private smsService: SmsService,
    private readonly config: ConfigService,
    private readonly pushNotificationService: PushNotificationService,
    private configurationService: ConfigurationService,
    private jwtService: JwtService,
  ) {
    super(prisma);
  }

  private async validateCustomerKey(secretKey: string) {
    const customerExists = await this.prisma.customer.findFirst({
      where: {
        secretKey: secretKey,
      },
    });
    if (!customerExists) {
      throw new UnprocessableEntityException(errorCodes.CUSTOMER_NOT_FOUND);
    }
    return customerExists;
  }

  private async validateAuthorizedUser(user: User, customer: Customer) {
    const countryCode = customer?.countryCode || '';
    const authorizedUserExist = await this.prisma.authorizedUser.findFirst({
      where: {
        username: user.username.substring(countryCode.length),
        customerId: customer.id,
      },
    });

    if (!authorizedUserExist) {
      throw new UnprocessableEntityException(
        errorCodes.USER_AUTHORIZED_NOT_FOUND,
      );
    }

    return authorizedUserExist;
  }

  async findAll(
    params: IPaginationArgs<Prisma.UserFindManyArgs>,
  ): Promise<IPaginatedResult<EntityUser>> {
    const { includeCount, skip, take, ...findAllParams } = params;
    const pagination = await this.paginate('user', findAllParams, {
      includeCount,
      skip,
      take,
    });
    pagination.results = pagination.results.map((user) =>
      plainToClass(EntityUser, user),
    );
    return pagination;
  }

  async findOne(
    id: string,
    findArgs?: { include?: Prisma.UserInclude; select?: Prisma.UserSelect },
  ) {
    const args: Prisma.UserFindUniqueArgs = {
      where: {
        id,
      },
      ...findArgs,
    };

    const result = await this.get('user', args);

    return plainToClass(EntityUser, result);
  }

  findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        customer: true,
      },
    });
  }

  findByUsername(username: string, customerType?: 'business' | 'government') {
    return this.prisma.user.findFirst({
      where: { username, customerType },
      include: {
        customer: true,
      },
    });
  }

  getRegister(
    authorizedFound: AuthorizedUser,
    customer: Customer,
    exist: boolean,
  ): Prisma.UserCreateInput | Prisma.UserUpdateInput {
    const generatedCode = generateCode();
    if (exist) {
      return {
        verificationCode: generatedCode,
        password: this.hashPassword(generatedCode),
      };
    }
    return {
      username: `${customer.countryCode}${authorizedFound.username}`,
      fullName: `${authorizedFound.firstName} ${authorizedFound.lastName}`,
      firstName: authorizedFound.firstName || '',
      lastName: authorizedFound.lastName || '',
      password: this.hashPassword(generatedCode),
      verificationCode: generatedCode,
      role: 'user',
      lot: authorizedFound.lot,
      customerType: customer.type,
      authorizedUser: {
        connect: {
          id: authorizedFound.id,
        },
      },
      customer: {
        connect: {
          id: customer.id,
        },
      },
    };
  }

  private async sendSMS(phoneNumber: string, verificationCode: string) {
    try {
      if (verificationCode) {
        await this.smsService.send({
          phoneNumber,
          msg: `${verificationCode} es tu numero de validacion de Basapp`,
        });
      }
    } catch (err) {
      Logger.error(err);
    }
  }

  async requestPasswordReset(username: string) {
    const user = await this.findByUsername(username);

    if (!user) {
      throw new ForbiddenException({
        statusCode: 403,
        message: errorCodes.INVALID_USERNAME,
      });
    }
    await this.throwIfUserIsNotValid(user);

    const recoveryToken = await this.createPasswordRecoveryToken(user);

    return this.sendResetPasswordEmail(user, recoveryToken.token);
  }

  sendResetPasswordEmail(user: IUserWithCustomer, token: string) {
    this.configurationService.subscriptionMail(
      'send-reset-password-email-topic',
      {
        username: user.username,
        fullName: user.fullName,
        token,
        customerType: user.customer?.type || '',
      },
    );

    return true;
  }

  sendWelcomeEmail(user: IUserWithCustomer, token: string) {
    this.configurationService.subscriptionMail('send-welcome-email-topic', {
      username: user.username,
      fullName: user.fullName,
      token,
      customerType: user.customer?.type || '',
    });

    return true;
  }

  generatePasswordResetToken(durationInSeconds?: number): {
    token: string;
    expires: Date;
  } {
    const token = crypto.randomBytes(32).toString('hex');
    const expires = dayjs()
      .add(
        durationInSeconds ||
          (this.config.get('password.resetExpiration') as number),
        'seconds',
      )
      .toDate();

    return {
      token,
      expires,
    };
  }

  async createPasswordRecoveryToken(user: User) {
    const { token, expires } = this.generatePasswordResetToken();
    const recoveryToken = await this.prisma.passwordRecoveryToken.upsert({
      where: {
        userId: user.id,
      },
      create: {
        user: {
          connect: {
            id: user.id,
          },
        },
        token,
        expiresAt: expires,
      },
      update: {
        token,
        expiresAt: expires,
        createdAt: new Date(),
      },
    });
    return recoveryToken;
  }

  throwIfUserIsNotValid(user: Omit<IUserWithCustomer, 'password'>) {
    if (user.active === false && user.role !== 'user') {
      throw new ForbiddenException({
        statusCode: 403,
        message: errorCodes.NOT_ACTIVE_USER,
      });
    }
    if (user.customer?.active === false) {
      throw new ForbiddenException({
        statusCode: 403,
        message: errorCodes.NOT_ACTIVE_CUSTOMER,
      });
    }

    return Promise.resolve(user);
  }

  async resetPasswordWithToken(
    token: string,
    password: string,
  ): Promise<boolean> {
    const recoveryToken = await this.prisma.passwordRecoveryToken.findFirst({
      where: { token },
    });

    if (!recoveryToken) {
      throw new ForbiddenException({
        statusCode: 403,
        message: errorCodes.INVALID_TOKEN,
      });
    }

    if (recoveryToken.expiresAt < new Date()) {
      throw new ForbiddenException({
        statusCode: 403,
        message: errorCodes.EXPIRED_TOKEN,
      });
    }

    const user = await this.prisma.user.findUnique({
      where: { id: recoveryToken.userId },
      select: {
        id: true,
      },
    });

    if (!user) {
      throw new ForbiddenException({
        statusCode: 403,
        message: errorCodes.INVALID_USER,
      });
    }

    const hashedPassword = this.hashPassword(password);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
      },
    });

    await this.prisma.passwordRecoveryToken.delete({
      where: { id: recoveryToken.id },
    });

    return true;
  }

  hashPassword(password: string): string {
    return bcrypt.hashSync(password, 10);
  }

  private async verifyUserId(id: string, include?: Prisma.UserInclude) {
    const user = await this.prisma.user.findUnique({
      where: {
        id,
      },
      include,
    });

    if (!user) {
      throw new NotFoundException(errorCodes.USER_NOT_FOUND);
    }

    return user;
  }

  private async validateUsername(
    username: string,
    customerType: CustomerType | undefined,
    userId?: string,
  ) {
    const user = await this.prisma.user.findFirst({
      where: {
        username,
        customerType: customerType || undefined,
      },
    });
    if (user && user.id !== userId) {
      throw new UnprocessableEntityException({
        statusCode: 422,
        message: errorCodes.USERNAME_ALREADY_TAKEN,
      });
    }
  }

  private async validateCustomer(customerId: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      throw new UnprocessableEntityException({
        statusCode: 422,
        message: errorCodes.INVALID_CUSTOMER,
      });
    }

    return customer;
  }

  private async validateParentRelation(customerId: string, parentId: string) {
    const children = await this.prisma.customer.findFirst({
      where: { parentId, id: customerId },
    });

    if (!children) {
      throw new UnprocessableEntityException({
        statusCode: 422,
        message: errorCodes.INVALID_CUSTOMER,
      });
    }
  }

  private async validateEventType(eventTypeId: string) {
    const eventType = await this.prisma.eventType.findUnique({
      where: { id: eventTypeId },
    });

    if (!eventType) {
      throw new UnprocessableEntityException({
        statusCode: 422,
        message: errorCodes.INVALID_EVENT_TYPE,
      });
    }
  }

  private async validateAlertTypes(alertTypes: string[]) {
    const alertTypeExist = await this.prisma.alertType.count({
      where: {
        OR: alertTypes.map((alertType) => ({ id: alertType })),
      },
    });

    if (alertTypeExist < alertTypes.length) {
      throw new UnprocessableEntityException(errorCodes.INVALID_ALERT_TYPE);
    }
  }

  private async pushNotification(notification: {
    title: string;
    description: string;
    players: string[];
  }) {
    this.pushNotificationService.pushNotification(
      {
        title: notification.title,
        description: notification.description,
        channelId: 'general-notifications',
        data: {},
      },
      notification.players,
    );
  }

  private async notifyUser(user: User, data: UpdateUserDto) {
    if (user.role === 'user') {
      if (!user.customerId) {
        throw new UnprocessableEntityException({
          message: errorCodes.INVALID_USER_ROLE,
          statusCode: 403,
        });
      }

      const dataNotification = {
        toUsers: {
          createMany: {
            data: [
              {
                userId: user.id,
              },
            ],
          },
        },
        customer: {
          connect: {
            id: user.customerId,
          },
        },
        user: {
          connect: {
            id: user.id,
          },
        },
      };

      if (
        !isNil(data.active) &&
        data.active !== user.active &&
        notificationUsers.title.active[data.active.toString()]
      ) {
        const value = data.active?.toString() || '';

        await this.prisma.notification.create({
          data: {
            title: notificationUsers.title.active[value],
            description: notificationUsers.message.active[value],
            notificationType: 'user',
            ...dataNotification,
          },
        });

        if (user.pushId) {
          this.pushNotification({
            title: notificationUsers.title.active[value],
            description: notificationUsers.message.active[value],
            players: [user.pushId],
          });
        }
      }

      if (
        data.status &&
        data.status !== user.status &&
        notificationUsers.title.status[data.status || '']
      ) {
        const status = data?.status || '';
        const description = data.comment || '';

        await this.prisma.notification.create({
          data: {
            title: notificationUsers.title.status[status],
            notificationType: 'user',
            description,
            ...dataNotification,
          },
        });

        if (user.pushId) {
          this.pushNotification({
            title: notificationUsers.title.status[status],
            description,
            players: [user.pushId],
          });
        }
      }
    }
  }

  async create(data: CreateUserDto & { updatedById: string }): Promise<User> {
    let customer;
    if (data.customerId) {
      await this.validateCustomer(data.customerId);
      customer = {
        connect: {
          id: data.customerId,
        },
      };
    }

    await this.validateUsername(data.username, undefined);

    const {
      authorizationEventTypeId,
      visitorsEventTypeId,
      monitoringEventTypes,
      monitoringAlertTypes,
      monitoringCustomers,
      ...permisionsData
    } = data.permissions || {};

    let authorizationEventType;
    if (authorizationEventTypeId) {
      await this.validateEventType(authorizationEventTypeId);
      authorizationEventType = {
        connect: {
          id: authorizationEventTypeId,
        },
      };
    }

    let visitorsEventType;
    if (visitorsEventTypeId) {
      await this.validateEventType(visitorsEventTypeId);
      visitorsEventType = {
        connect: {
          id: visitorsEventTypeId,
        },
      };
    }

    if (monitoringEventTypes) {
      for await (const eventType of monitoringEventTypes) {
        await this.validateEventType(eventType);
      }
    }

    if (monitoringAlertTypes) {
      await this.validateAlertTypes(monitoringAlertTypes);
    }

    if (monitoringCustomers?.length && data.customerId) {
      for await (const childId of monitoringCustomers) {
        await this.validateParentRelation(childId, data.customerId);
      }
    }

    let password;
    if (data.password) {
      password = this.hashPassword(data.password);
    } else {
      // 6 digits random number password
      password = this.hashPassword(
        Math.floor(100000 + Math.random() * 900000).toString(),
      );
    }

    try {
      const user = await this.prisma.user.create({
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          fullName: `${data.firstName} ${data.lastName}`,
          username: data.username,
          password,
          lot: data.lot,
          image: data.image as unknown as Prisma.InputJsonObject,
          homeAddress: data.homeAddress as unknown as Prisma.InputJsonObject,
          workAddress: data.workAddress as unknown as Prisma.InputJsonObject,
          active: data.active,
          customer,
          role: data.role,
          userPermissions:
            data.role !== Role.admin
              ? {
                  create: {
                    ...permisionsData,
                    authorizationEventType,
                    authorizationEventTypeId: undefined,
                    visitorsEventType,
                    visitorsEventTypeId: undefined,
                    monitoringEventTypes: {
                      connect: monitoringEventTypes?.map((eventType) => ({
                        id: eventType,
                      })),
                    },
                    monitoringAlertTypes: {
                      connect: monitoringAlertTypes?.map((alertType) => ({
                        id: alertType,
                      })),
                    },
                    monitoringCustomers: {
                      create: monitoringCustomers?.map((customer) => ({
                        customer: {
                          connect: {
                            id: customer,
                          },
                        },
                      })),
                    },
                  },
                }
              : undefined,
          updatedBy: {
            connect: {
              id: data.updatedById,
            },
          },
        },
        include: {
          customer: true,
          userPermissions: {
            include: {
              authorizationEventType: true,
              visitorsEventType: true,
              monitoringEventTypes: true,
              monitoringAlertTypes: true,
              monitoringCustomers: true,
            },
          },
        },
      });

      const recoveryToken = await this.createPasswordRecoveryToken(user);
      this.sendWelcomeEmail(user, recoveryToken.token);
      return plainToClass(EntityUser, user);
    } catch (error) {
      throw new InternalServerErrorException('Error creating user');
    }
  }

  async update(
    userId: string,
    data: UpdateUserDto & { updatedById: string; reqUserCustomerId: string },
  ) {
    let dbCustomer: Customer | undefined;
    if (data.reqUserCustomerId) {
      dbCustomer = await this.validateCustomer(data.reqUserCustomerId);
    }

    const user = await this.verifyUserId(userId);

    if (data.username) {
      await this.validateUsername(data.username, dbCustomer?.type, userId);
    }

    const updatedBy = await this.prisma.user.findUnique({
      where: { id: data.updatedById },
    });

    if (!updatedBy) {
      throw new UnprocessableEntityException({
        statusCode: 403,
        message: errorCodes.INVALID_USER,
      });
    }

    if (
      updatedBy.role !== Role.admin &&
      updatedBy.customerId !== user.customerId
    ) {
      throw new UnprocessableEntityException({
        statusCode: 403,
        message: errorCodes.INVALID_USER_CUSTOMER,
      });
    }

    let customer;
    let authorizedUser: AuthorizedUser | undefined;
    let access_token: string | undefined;

    if (data.customerId) {
      await this.validateCustomer(data.customerId);
      customer = {
        connect: {
          id: data.customerId,
        },
      };
      access_token = this.jwtService.sign({
        sub: user.id,
        username: user.username,
        role: user.role,
        active: user.active,
        customerId: data.customerId,
      });
    }
    if (data.secretKey) {
      const anotherCustomer = await this.validateCustomerKey(data.secretKey);
      authorizedUser = await this.validateAuthorizedUser(user, anotherCustomer);

      customer = {
        connect: {
          id: anotherCustomer.id,
        },
      };
      access_token = this.jwtService.sign({
        sub: user.id,
        username: user.username,
        role: user.role,
        active: user.active,
        customerId: anotherCustomer.id,
      });
    }

    const {
      authorizationEventTypeId,
      visitorsEventTypeId,
      monitoringEventTypes,
      monitoringAlertTypes,
      monitoringCustomers,
      ...permissionsData
    } = data.permissions || {};

    if (authorizationEventTypeId) {
      await this.validateEventType(authorizationEventTypeId);
    }

    if (visitorsEventTypeId) {
      await this.validateEventType(visitorsEventTypeId);
    }

    if (monitoringEventTypes) {
      for await (const eventType of monitoringEventTypes) {
        await this.validateEventType(eventType);
      }
    }

    if (monitoringAlertTypes) {
      await this.validateAlertTypes(monitoringAlertTypes);
    }

    if (monitoringCustomers?.length && data.customerId) {
      for await (const childId of monitoringCustomers) {
        await this.validateParentRelation(childId, data.customerId);
      }
    }
    let fullName = user.fullName;

    if (data.firstName && data.lastName) {
      fullName = `${data.firstName} ${data.lastName}`;
    } else if (data.firstName && !data.lastName) {
      fullName = `${data.firstName} ${user.lastName}`;
    } else if (!data.firstName && data.lastName) {
      fullName = `${user.firstName} ${data.lastName}`;
    }

    const userPermissionsData = {
      ...permissionsData,
      monitoringEventTypes: {
        set: monitoringEventTypes?.map((eventType) => ({
          id: eventType,
        })),
      },
      monitoringAlertTypes: {
        set: monitoringAlertTypes?.map((alertType) => ({
          id: alertType,
        })),
      },
    };

    let active = data.active;
    if (data.status === 'active' || data.status === 'registered') {
      active = true;
    }
    if (data.status === 'disabled' || data.status === 'rejected') {
      active = false;
    }

    try {
      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: {
          firstName: data.firstName,
          idCard: data.idCard,
          lastName: data.lastName,
          fullName,
          authorizedUser: authorizedUser
            ? {
                connect: {
                  id: authorizedUser.id,
                },
              }
            : undefined,
          username: data.username,
          password: data.password
            ? this.hashPassword(data.password)
            : undefined,
          lot: authorizedUser?.lot || data.lot,
          image: changeInputJsonObject(data.image),
          active,
          pushId: data.pushId,
          homeAddress: changeInputJsonObject(data.homeAddress),
          workAddress: changeInputJsonObject(data.workAddress),
          customer,
          role: data.role,
          emergencyNumber: data.emergencyNumber,
          alarmNumber: data.alarmNumber,
          status: data.status,
          lastStateUpdatedTime: data.lastStateUpdatedTime,
          stateUpdatedUser: data.stateUpdatedUserId
            ? { connect: { id: data.stateUpdatedUserId } }
            : undefined,
          lastAccessToMenu: data.lastAccessToMenu,
          comment: data.comment,
          userPermissions: data.permissions
            ? {
                upsert: {
                  create: {
                    ...userPermissionsData,
                    monitoringEventTypes: {
                      connect: monitoringEventTypes?.map((eventType) => ({
                        id: eventType,
                      })),
                    },
                    monitoringAlertTypes: {
                      connect: monitoringAlertTypes?.map((alertType) => ({
                        id: alertType,
                      })),
                    },
                  },
                  update: {
                    ...userPermissionsData,
                    authorizationEventType: changeRelationTable(
                      authorizationEventTypeId,
                    ),
                    visitorsEventType: changeRelationTable(visitorsEventTypeId),
                    monitoringCustomers: {
                      deleteMany: monitoringCustomers ? {} : undefined,
                      create: monitoringCustomers
                        ? monitoringCustomers?.map((customer) => ({
                            customer: {
                              connect: {
                                id: customer,
                              },
                            },
                          }))
                        : undefined,
                    },
                  },
                },
              }
            : undefined,
          updatedBy: {
            connect: {
              id: updatedBy.id,
            },
          },
        },
        include: {
          userPermissions: {
            include: {
              authorizationEventType: true,
              visitorsEventType: true,
              monitoringEventTypes: true,
              monitoringAlertTypes: true,
              monitoringCustomers: true,
            },
          },
        },
      });

      await this.notifyUser(user, data);
      return {
        ...plainToClass(EntityUser, updatedUser),
        access_token,
      };
    } catch (error) {
      throw new InternalServerErrorException('Error updating user');
    }
  }

  async deleteAcc(userId: string, userRequest: IRequestUser, code: string) {
    if (userId !== userRequest.id) {
      throw new UnprocessableEntityException(authErrorCodes.ACTION_NOT_ALLOWED);
    }

    if (!userRequest.username.includes(code)) {
      throw new UnprocessableEntityException(errorCodes.INVALID_USERNAME);
    }
    const now = new Date();
    const cancelled = await this.prisma.eventState.findFirst({
      where: {
        name: 'Cancelado',
      },
    });

    if (!cancelled) {
      throw new InternalServerErrorException(errorCodes.EVENT_STATE_NOT_FOUND);
    }
    const user = await this.findById(userRequest.id);

    const prismaUser = this.prisma.user.update({
      data: {
        removed: true,
        removedAt: now,
        username: `Deleted[${userRequest.username}]`,
        active: false,
        pushId: null,
        authorizedUser: {
          disconnect: true,
        },
      },
      where: {
        id: userId,
      },
    });

    const prismaUserDeleted = this.prisma.userDeleted.create({
      data: {
        deletionRequestedAt: now,
        username: userRequest.username,
        customer: {
          connect: {
            id: userRequest.customerId,
          },
        },
        user: {
          connect: {
            id: userId,
          },
        },
        authorizedUser: user?.authorizedUserId
          ? {
              connect: {
                id: user.authorizedUserId,
              },
            }
          : undefined,
      },
    });

    const eventsUpdated = this.prisma.event.updateMany({
      data: {
        eventStateId: cancelled.id,
      },
      where: {
        userId,
      },
    });

    const reservationsUpdate = this.prisma.reservation.updateMany({
      where: {
        OR: [{ createdById: userId }, { userId }],
      },
      data: {
        eventStateId: cancelled.id,
      },
    });

    const transaction = await this.prisma.$transaction([
      prismaUser,
      prismaUserDeleted,
      eventsUpdated,
      reservationsUpdate,
    ]);

    return transaction[1];
  }

  async updatePassword(
    id: string,
    passwords: ChangePasswordDto,
  ): Promise<boolean> {
    const user = await this.findById(id);

    if (user) {
      const decryptedPassword = await bcrypt.compare(
        passwords.oldPassword,
        user.password,
      );

      if (!decryptedPassword) {
        throw new UnauthorizedException({
          statusCode: 401,
          message: errorCodes.PASSWORDS_DONT_MATCH,
        });
      }

      const updatePasswordHashed = this.hashPassword(passwords.newPassword);
      await this.prisma.user.update({
        data: {
          password: updatePasswordHashed,
        },
        where: {
          id,
        },
      });
      return true;
    } else {
      throw new UnauthorizedException({
        statusCode: 404,
        message: errorCodes.USER_NOT_FOUND,
      });
    }
  }

  validateUserRegister(settings: CustomerSettings) {
    if (settings?.validateUsers) {
      return 'registered';
    } else {
      return 'active';
    }
  }

  async register({ customerId, username }: RegisterDto) {
    let user: User;
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        alertTypes: {
          include: {
            alertType: true,
          },
        },
        sections: true,
        settings: true,
      },
    });

    if (!customer) {
      throw new NotFoundException({
        statusCode: 404,
        message: errorCodes.INVALID_CUSTOMER,
      });
    }
    if (customer.type == 'business') {
      const userWithoutCountryCode = username.replace(
        customer.countryCode || '',
        '',
      );
      const authorizedUser = await this.prisma.authorizedUser.findFirst({
        where: {
          customerId: customerId,
          username: userWithoutCountryCode,
        },
        include: {
          reservationTypes: true,
        },
      });

      if (!authorizedUser) {
        throw new NotFoundException({
          statusCode: 404,
          message: errorCodes.USER_AUTHORIZED_NOT_FOUND,
        });
      }

      if (!authorizedUser.active) {
        throw new ForbiddenException({
          statusCode: 403,
          message: errorCodes.USER_AUTHORIZED_INACTIVE,
        });
      }
      const dbUser = await this.prisma.user.findFirst({
        where: {
          username,
          customerType: CustomerType.business,
        },
      });
      const data = this.getRegister(
        authorizedUser,
        customer,
        dbUser?.customerId === customerId,
      ) as Prisma.UserCreateInput;

      if (dbUser) {
        user = await this.prisma.user.update({
          data,
          where: {
            id: dbUser.id,
          },
        });
      } else {
        user = await this.prisma.user.create({
          data,
        });
      }

      if (customer.verifyBySms) {
        await this.sendSMS(user.username, user.verificationCode as string);
      }

      return {
        user: {
          ...user,
          password: null,
        },
        customer,
        authorizedUser,
      };
    } else {
      if (!customer.settings) {
        throw new InternalServerErrorException({
          message: errorCodes.INVALID_CUSTOMER_SETTINGS,
        });
      }
      const dbUser = await this.prisma.user.findFirst({
        where: {
          username,
          customerType: CustomerType.government,
        },
      });
      let status;

      if (dbUser?.customerId !== customerId || !dbUser?.status) {
        status = this.validateUserRegister(customer.settings);
      }

      const code = generateCode();

      const data = {
        username,
        password: this.hashPassword(code),
        verificationCode: code,
        status,
        customerType: CustomerType.government,
        customer: {
          connect: {
            id: customerId,
          },
        },
      };

      if (dbUser) {
        user = await this.prisma.user.update({
          data: {
            ...data,
          },
          where: {
            id: dbUser.id,
          },
        });
      } else {
        user = await this.prisma.user.create({
          data: {
            ...data,
            role: 'user',
            firstName: '',
            lastName: '',
            fullName: '',
          },
        });
      }

      if (customer.verifyBySms) {
        await this.sendSMS(user.username, code);
      }
      return {
        user: {
          ...user,
          password: null,
        },
        customer,
      };
    }
  }

  async findAllNotifications(
    params: IPaginationArgs<Prisma.ContactFindManyArgs>,
    id: string,
  ) {
    const { includeCount, skip, take, ...findAllParams } = params;
    const user = await this.prisma.user.findFirst({
      where: {
        id,
      },
    });
    if (!user) {
      throw new NotFoundException(errorCodes.USER_NOT_FOUND);
    }

    const pagination = await this.paginate('notificationUser', findAllParams, {
      includeCount,
      skip,
      take,
    });
    return pagination;
  }
}
