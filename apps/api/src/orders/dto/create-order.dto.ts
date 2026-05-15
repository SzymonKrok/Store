import { IsString, IsOptional, ValidateNested, Matches } from 'class-validator'
import { Type } from 'class-transformer'

class ShippingAddressDto {
  @IsString()
  firstName!: string

  @IsString()
  lastName!: string

  @IsString()
  email!: string

  @IsString()
  street!: string

  @IsString()
  city!: string

  @IsString()
  @Matches(/^\d{2}-\d{3}$/, { message: 'postalCode must be in format 00-000' })
  postalCode!: string

  @IsString()
  phone!: string
}

export class CreateOrderDto {
  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shippingAddress!: ShippingAddressDto

  @IsString()
  @IsOptional()
  couponCode?: string

  @IsString()
  @IsOptional()
  sessionId?: string
}
