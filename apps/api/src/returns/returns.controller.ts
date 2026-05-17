import { Controller, Post, Get, Patch, Param, Body, Query, UseGuards } from '@nestjs/common'
import { ReturnsService } from './returns.service'
import { CreateReturnDto } from './dto/create-return.dto'
import { UpdateReturnStatusDto } from './dto/update-return-status.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorator'
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { Role, ReturnStatus } from '@prisma/client'

@Controller()
export class ReturnsController {
  constructor(private readonly returnsService: ReturnsService) {}

  @Post('orders/:orderId/return')
  @UseGuards(OptionalJwtAuthGuard)
  createReturn(
    @Param('orderId') orderId: string,
    @Body() dto: CreateReturnDto,
    @CurrentUser() user?: { id: string },
  ) {
    return this.returnsService.createReturn(orderId, dto, user?.id)
  }

  @Get('admin/returns')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    return this.returnsService.findAll(
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
      status as ReturnStatus | undefined,
    )
  }

  @Patch('admin/returns/:id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  updateStatus(@Param('id') id: string, @Body() dto: UpdateReturnStatusDto) {
    return this.returnsService.updateStatus(id, dto)
  }
}
