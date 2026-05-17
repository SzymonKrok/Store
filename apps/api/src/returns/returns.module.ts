import { Module } from '@nestjs/common'
import { ReturnsController } from './returns.controller'
import { ReturnsService } from './returns.service'
import { OrdersModule } from '../orders/orders.module'

@Module({
  imports: [OrdersModule],
  controllers: [ReturnsController],
  providers: [ReturnsService],
})
export class ReturnsModule {}
