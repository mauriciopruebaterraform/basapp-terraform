import { PermissionList } from './entities/permission-list.entity';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { Role } from '@prisma/client';
import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '@src/auth/roles.decorator';
import { Permission } from './entities/permission.entity';
import { PermissionsService } from './permissions.service';
import { ListQueryArgsDto } from '@src/common/dto/list-query-args.dto';
import { ListQueryArgsPipe } from '@src/common/pipes/ListQueryArgsPipe';

@ApiTags('permissions')
@ApiBearerAuth()
@Controller({
  path: 'permissions',
  version: '1',
})
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @ApiOperation({
    servers: [{ url: '/v1' }],
    summary: 'Get all permissions',
    description: 'Returns a list of permissions',
  })
  @Roles(Role.admin, Role.statesman, Role.monitoring)
  @Get()
  findAll(
    @Query(ListQueryArgsPipe) params: ListQueryArgsDto,
  ): Promise<PermissionList> {
    return this.permissionsService.findAll(params);
  }

  @ApiOperation({
    servers: [{ url: '/v1' }],
    summary: 'Update permission by id',
    description:
      'Update permission by id. It only updates statesman or monitoring field',
  })
  @Roles(Role.admin)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updatePermissionDto: UpdatePermissionDto,
  ): Promise<Permission> {
    return this.permissionsService.update(id, updatePermissionDto);
  }

  @ApiOperation({
    servers: [{ url: '/v1' }],
    summary: 'Update multiple permissions by category',
    description:
      'Update multiple permissions by category. It only updates statesman or monitoring field',
  })
  @Roles(Role.admin)
  @Patch('/category/:category')
  updateByCategory(
    @Param('category') category: string,
    @Body() updatePermissionDto: UpdatePermissionDto,
  ): Promise<{ count: number }> {
    return this.permissionsService.updateByCategory(
      category,
      updatePermissionDto,
    );
  }
}
