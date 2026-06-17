import { Controller, Post, Param, Body, UseGuards } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiResponse } from '@nestjs/swagger'
import { InpostService } from './inpost.service'
import { GenerateLabelDto } from './dto/generate-label.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorator'
import { Role } from '@prisma/client'

@ApiTags('InPost')
@ApiBearerAuth()
@Controller('admin/orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class InpostController {
  constructor(private readonly inpostService: InpostService) {}

  @Post(':id/generate-label')
  @ApiOperation({ summary: 'Generate InPost shipping label for an order (Admin)' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({ status: 201, description: 'Label generated — returns ShipX shipment ID and label PDF URL' })
  generateLabel(@Param('id') id: string, @Body() dto: GenerateLabelDto) {
    return this.inpostService.generateLabel(id, dto)
  }
}
