import { Controller, Post, Body, UseGuards } from '@nestjs/common'
import { IsString, Matches } from 'class-validator'
import { UploadService } from './upload.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorator'
import { Role } from '@prisma/client'

class PresignDto {
  @IsString()
  filename!: string

  @IsString()
  @Matches(/^image\/(jpeg|png|webp|gif)$/, { message: 'contentType must be an image MIME type' })
  contentType!: string
}

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('presign')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  presign(@Body() dto: PresignDto) {
    return this.uploadService.getPresignedUrl(dto.filename, dto.contentType)
  }
}
