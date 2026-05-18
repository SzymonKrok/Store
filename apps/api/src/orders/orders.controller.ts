import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, HttpCode } from '@nestjs/common'
import { OrdersService } from './orders.service'
import { CreateOrderDto } from './dto/create-order.dto'
import { UpdateOrderStatusDto } from './dto/update-order-status.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorator'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { Role } from '@prisma/client'

interface JwtPayload {
  id: string
  email: string
  role: string
}

@Controller()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('orders')
  @UseGuards(OptionalJwtAuthGuard)
  create(@CurrentUser() user: JwtPayload | null, @Body() dto: CreateOrderDto) {
    return this.ordersService.create(user?.id, dto)
  }

  @Get('orders')
  @UseGuards(JwtAuthGuard)
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.ordersService.findAll(user.id, page ? Number(page) : 1, limit ? Number(limit) : 20)
  }

  @Get('orders/:id')
  @UseGuards(OptionalJwtAuthGuard)
  findOne(@CurrentUser() user: JwtPayload | null, @Param('id') id: string) {
    return this.ordersService.findOne(id, user?.id, user?.role === 'ADMIN')
  }

  @Get('admin/orders')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  findAllAdmin(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    return this.ordersService.findAllAdmin(page ? Number(page) : 1, limit ? Number(limit) : 20, status)
  }

  @Patch('admin/orders/:id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  updateStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.ordersService.updateStatus(id, dto.status)
  }

  @Post('admin/orders/:id/regenerate-invoice')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @HttpCode(200)
  regenerateInvoice(@Param('id') id: string) {
    return this.ordersService.regenerateInvoice(id)
  }
}
