import { Module } from '@nestjs/common'
import { OrdersController } from './orders.controller'
import { OrdersService } from './orders.service'
import { CouponsModule } from '../coupons/coupons.module'
import { FakturowniaModule } from '../fakturownia/fakturownia.module'

@Module({
  imports: [CouponsModule, FakturowniaModule],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
