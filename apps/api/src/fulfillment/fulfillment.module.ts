import { Module } from '@nestjs/common'
import { OrderFulfillmentListener } from './order-fulfillment.listener'
import { FakturowniaModule } from '../fakturownia/fakturownia.module'
import { InpostModule } from '../inpost/inpost.module'

@Module({
  imports: [FakturowniaModule, InpostModule],
  providers: [OrderFulfillmentListener],
})
export class FulfillmentModule {}
