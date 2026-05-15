import { Module } from '@nestjs/common'
import { AbandonedCartService } from './abandoned-cart.service'

@Module({
  providers: [AbandonedCartService],
})
export class AbandonedCartModule {}
