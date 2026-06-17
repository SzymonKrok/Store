import { Controller, Post, Body, UseGuards } from '@nestjs/common'
import { IsString, Matches } from 'class-validator'
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiProperty } from '@nestjs/swagger'
import { UploadService } from './upload.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorator'
import { Role } from '@prisma/client'

class PresignDto {
  @ApiProperty({ example: 'product-hero.jpg' })
  @IsString()
  filename!: string

  @ApiProperty({ example: 'image/jpeg', enum: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] })
  @IsString()
  @Matches(/^image\/(jpeg|png|webp|gif)$/, { message: 'contentType must be an image MIME type' })
  contentType!: string
}

@ApiTags('Upload')
@ApiBearerAuth()
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('presign')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get a pre-signed R2 PUT URL for direct browser upload (Admin)' })
  @ApiResponse({ status: 201, description: 'Returns { uploadUrl, publicUrl, key }' })
  presign(@Body() dto: PresignDto) {
    return this.uploadService.getPresignedUrl(dto.filename, dto.contentType)
  }
}
