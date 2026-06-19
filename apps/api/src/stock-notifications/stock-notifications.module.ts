import { Module } from '@nestjs/common'
import { StockNotificationsService } from './stock-notifications.service'
import { StockNotificationsController } from './stock-notifications.controller'

@Module({
  controllers: [StockNotificationsController],
  providers: [StockNotificationsService],
  exports: [StockNotificationsService],
})
export class StockNotificationsModule {}
