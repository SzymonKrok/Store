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
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiParam, ApiResponse } from '@nestjs/swagger'
import { AdminService } from './admin.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorator'
import { Role } from '@prisma/client'

@ApiTags('Admin')
@ApiBearerAuth()
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  @ApiResponse({ status: 200, description: 'Sales stats, recent orders, top products' })
  getStats() {
    return this.adminService.getStats()
  }

  @Get('insights')
  @ApiOperation({ summary: 'Get extended dashboard insights (AOV, top products, abandoned carts, etc.)' })
  getInsights() {
    return this.adminService.getInsights()
  }

  @Get('users')
  @ApiOperation({ summary: 'List all users (paginated)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getUsers(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.adminService.getUsers(page ? Number(page) : 1, limit ? Number(limit) : 20)
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Get user with their orders' })
  @ApiParam({ name: 'id' })
  getUser(@Param('id') id: string) {
    return this.adminService.getUserWithOrders(id)
  }

  @Patch('users/:id/role')
  @ApiOperation({ summary: 'Toggle user role between USER and ADMIN' })
  @ApiParam({ name: 'id' })
  toggleRole(@Param('id') id: string) {
    return this.adminService.toggleUserRole(id)
  }

  @Delete('users/:id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete a user account' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 204, description: 'User deleted' })
  deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(id)
  }
}
