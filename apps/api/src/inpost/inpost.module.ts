import { Module } from '@nestjs/common'
import { InpostController } from './inpost.controller'
import { InpostService } from './inpost.service'

@Module({
  controllers: [InpostController],
  providers: [InpostService],
  exports: [InpostService],
})
export class InpostModule {}
