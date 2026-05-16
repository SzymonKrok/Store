import { Module } from '@nestjs/common'
import { OrderTimeoutService } from './order-timeout.service'
import { OrdersModule } from '../orders/orders.module'

@Module({
  imports: [OrdersModule],
  providers: [OrderTimeoutService],
})
export class OrderTimeoutModule {}
