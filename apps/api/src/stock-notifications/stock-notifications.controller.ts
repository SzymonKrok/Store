import { Body, Controller, HttpCode, Post } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { StockNotificationsService } from './stock-notifications.service'
import { SubscribeStockNotificationDto } from './dto/subscribe.dto'

@ApiTags('Stock Notifications')
@Controller('stock-notifications')
export class StockNotificationsController {
  constructor(private readonly service: StockNotificationsService) {}

  @Post()
  @HttpCode(201)
  @ApiOperation({ summary: 'Subscribe to a back-in-stock notification for a variant' })
  @ApiResponse({ status: 201, description: 'Subscribed' })
  @ApiResponse({ status: 400, description: 'Variant already in stock or invalid email' })
  @ApiResponse({ status: 404, description: 'Variant not found' })
  subscribe(@Body() dto: SubscribeStockNotificationDto) {
    return this.service.subscribe(dto.variantId, dto.email)
  }
}
