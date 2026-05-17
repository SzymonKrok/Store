import { IsOptional, IsString } from 'class-validator'

export class UpdateSettingsDto {
  @IsOptional()
  @IsString()
  ga4Id?: string | null

  @IsOptional()
  @IsString()
  fbPixelId?: string | null

  @IsOptional()
  @IsString()
  termsOfService?: string

  @IsOptional()
  @IsString()
  privacyPolicy?: string
}
