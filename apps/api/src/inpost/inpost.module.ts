import { Module } from '@nestjs/common'
import { InpostController } from './inpost.controller'
import { InpostService } from './inpost.service'
import { UploadModule } from '../upload/upload.module'

@Module({
  imports: [UploadModule],
  controllers: [InpostController],
  providers: [InpostService],
  exports: [InpostService],
})
export class InpostModule {}
