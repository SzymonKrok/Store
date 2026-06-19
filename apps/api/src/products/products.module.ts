import { Module } from '@nestjs/common'
import { ProductsService } from './products.service'
import { ProductsController } from './products.controller'
import { StockNotificationsModule } from '../stock-notifications/stock-notifications.module'

@Module({
  imports: [StockNotificationsModule],
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}
