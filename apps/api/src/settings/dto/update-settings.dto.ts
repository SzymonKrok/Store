import { IsOptional, IsString, IsBoolean } from 'class-validator'

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

  @IsOptional()
  @IsBoolean()
  showQuantitySelector?: boolean

  @IsOptional()
  @IsBoolean()
  showStockBadge?: boolean

  @IsOptional()
  @IsBoolean()
  showReviews?: boolean

  @IsOptional()
  @IsBoolean()
  showBestsellers?: boolean

  @IsOptional()
  @IsBoolean()
  enableGuestCheckout?: boolean
}
