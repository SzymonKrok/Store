import { Module } from '@nestjs/common'
import { OrderFulfillmentListener } from './order-fulfillment.listener'
import { FakturowniaModule } from '../fakturownia/fakturownia.module'

@Module({
  imports: [FakturowniaModule],
  providers: [OrderFulfillmentListener],
})
export class FulfillmentModule {}
