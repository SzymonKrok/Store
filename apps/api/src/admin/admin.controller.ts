import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Query,
  HttpCode,
  UseGuards,
} from '@nestjs/common'
import { AdminService } from './admin.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorator'
import { Role } from '@prisma/client'

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  getStats() {
    return this.adminService.getStats()
  }

  @Get('users')
  getUsers(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.adminService.getUsers(page ? Number(page) : 1, limit ? Number(limit) : 20)
  }

  @Get('users/:id')
  getUser(@Param('id') id: string) {
    return this.adminService.getUserWithOrders(id)
  }

  @Patch('users/:id/role')
  toggleRole(@Param('id') id: string) {
    return this.adminService.toggleUserRole(id)
  }

  @Delete('users/:id')
  @HttpCode(204)
  deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(id)
  }
}
