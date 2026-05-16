import { Module } from '@nestjs/common'
import { PaymentsController } from './payments.controller'
import { PaymentsService } from './payments.service'
import { Przelewy24Strategy } from './strategies/przelewy24.strategy'
import { OrdersModule } from '../orders/orders.module'

@Module({
  imports: [OrdersModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, Przelewy24Strategy],
})
export class PaymentsModule {}
