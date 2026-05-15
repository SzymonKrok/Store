import { IsString, IsEnum, IsNumber, IsPositive, IsOptional, IsBoolean, IsInt, Min, Matches } from 'class-validator'
export class CreateCouponDto {
  @IsString()
  @Matches(/^[A-Z0-9_-]+$/, { message: 'Uppercase letters, numbers, _ and - only' })
  code!: string

  @IsEnum(['PERCENTAGE', 'FLAT'], { message: 'type must be PERCENTAGE or FLAT' })
  type!: 'PERCENTAGE' | 'FLAT'

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  value!: number

  @IsString()
  @IsOptional()
  expiresAt?: string

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @IsOptional()
  minOrderValue?: number

  @IsInt()
  @Min(1)
  @IsOptional()
  maxUses?: number

  @IsInt()
  @Min(1)
  @IsOptional()
  limitPerUser?: number

  @IsBoolean()
  @IsOptional()
  isActive?: boolean
}
