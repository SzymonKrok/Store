import { Module } from '@nestjs/common'
import { FakturowniaService } from './fakturownia.service'

@Module({
  providers: [FakturowniaService],
  exports: [FakturowniaService],
})
export class FakturowniaModule {}
