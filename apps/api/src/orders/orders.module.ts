import { Module } from '@nestjs/common'
import { OrdersController } from './orders.controller'
import { OrdersService } from './orders.service'
import { CouponsModule } from '../coupons/coupons.module'
import { FakturowniaModule } from '../fakturownia/fakturownia.module'
import { SettingsModule } from '../settings/settings.module'

@Module({
  imports: [CouponsModule, FakturowniaModule, SettingsModule],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
