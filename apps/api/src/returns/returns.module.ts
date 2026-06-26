import { Module } from '@nestjs/common'
import { ReturnsController } from './returns.controller'
import { ReturnsService } from './returns.service'
import { OrdersModule } from '../orders/orders.module'
import { PaymentsModule } from '../payments/payments.module'

@Module({
  imports: [OrdersModule, PaymentsModule],
  controllers: [ReturnsController],
  providers: [ReturnsService],
})
export class ReturnsModule {}
