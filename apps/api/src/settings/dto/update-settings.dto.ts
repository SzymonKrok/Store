import { IsOptional, IsString, IsBoolean, IsNumber, Min } from 'class-validator'

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

  @IsOptional()
  @IsNumber()
  @Min(0)
  shippingCourierCost?: number

  @IsOptional()
  @IsNumber()
  @Min(0)
  shippingLockerCost?: number

  @IsOptional()
  @IsBoolean()
  freeShipping?: boolean

  @IsOptional()
  @IsNumber()
  @Min(0)
  freeShippingThreshold?: number | null
}
