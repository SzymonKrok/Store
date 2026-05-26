import { IsString, IsOptional, IsBoolean, IsEnum, ValidateNested, Matches, ValidateIf, IsObject } from 'class-validator'
import { Type } from 'class-transformer'

class ShippingAddressDto {
  @IsString()
  firstName!: string

  @IsString()
  lastName!: string

  @IsString()
  email!: string

  @IsString()
  @IsOptional()
  street?: string

  @IsString()
  @IsOptional()
  city?: string

  @IsString()
  @IsOptional()
  @Matches(/^\d{2}-\d{3}$/, { message: 'postalCode must be in format 00-000' })
  postalCode?: string

  @IsString()
  phone!: string
}

class BillingAddressDto {
  @IsEnum(['PRIVATE', 'COMPANY'])
  @IsOptional()
  accountType?: 'PRIVATE' | 'COMPANY'

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

  @IsString()
  @ValidateIf((o) => o.accountType === 'COMPANY')
  companyName?: string

  @IsString()
  @Matches(/^\d{10}$/, { message: 'NIP must be 10 digits' })
  @ValidateIf((o) => o.accountType === 'COMPANY')
  nip?: string
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

  @IsObject()
  @IsOptional()
  shippingPointDetails?: Record<string, unknown>

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
