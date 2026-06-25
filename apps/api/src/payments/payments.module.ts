import { Module } from '@nestjs/common'
import { PaymentsController } from './payments.controller'
import { PaymentsService } from './payments.service'
import { StripeStrategy } from './strategies/stripe.strategy'
import { OrdersModule } from '../orders/orders.module'

@Module({
  imports: [OrdersModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, StripeStrategy],
  exports: [StripeStrategy],
})
export class PaymentsModule {}
