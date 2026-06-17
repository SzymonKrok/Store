import { Controller, Post, Get, Patch, Param, Body, Query, UseGuards } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiParam, ApiResponse } from '@nestjs/swagger'
import { ReturnsService } from './returns.service'
import { CreateReturnDto } from './dto/create-return.dto'
import { UpdateReturnStatusDto } from './dto/update-return-status.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorator'
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { Role, ReturnStatus } from '@prisma/client'

@ApiTags('Returns')
@Controller()
export class ReturnsController {
  constructor(private readonly returnsService: ReturnsService) {}

  @Post('orders/:orderId/return')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Request a return for an order (authenticated or guest)' })
  @ApiParam({ name: 'orderId' })
  @ApiResponse({ status: 201, description: 'Return request created with RETURN_REQUESTED status' })
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
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all return requests with optional status filter (Admin)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: ['RETURN_REQUESTED', 'RETURN_APPROVED', 'REFUNDED'] })
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
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update return request status (Admin)' })
  @ApiParam({ name: 'id' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateReturnStatusDto) {
    return this.returnsService.updateStatus(id, dto)
  }
}
