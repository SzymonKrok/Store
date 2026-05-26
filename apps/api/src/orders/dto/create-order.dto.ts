import { IsString, IsOptional, IsBoolean, IsEnum, ValidateNested, Matches } from 'class-validator'
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

class BillingAddressDto {
  @IsString()
  firstName!: string

  @IsString()
  lastName!: string

  @IsString()
  street!: string

  @IsString()
  city!: string

  @IsString()
  @Matches(/^\d{2}-\d{3}$/, { message: 'postalCode must be in format 00-000' })
  postalCode!: string
}

export class CreateOrderDto {
  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shippingAddress!: ShippingAddressDto

  @ValidateNested()
  @Type(() => BillingAddressDto)
  @IsOptional()
  billingAddress?: BillingAddressDto

  @IsString()
  @IsOptional()
  couponCode?: string

  @IsString()
  @IsOptional()
  sessionId?: string

  @IsEnum(['COURIER', 'PARCEL_LOCKER'])
  deliveryMethod!: 'COURIER' | 'PARCEL_LOCKER'

  @IsString()
  @IsOptional()
  lockerCode?: string

  @IsBoolean()
  @IsOptional()
  wantsInvoice?: boolean

  @IsString()
  @IsOptional()
  companyName?: string

  @IsString()
  @IsOptional()
  taxId?: string
}
