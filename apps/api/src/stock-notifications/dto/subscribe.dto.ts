import { IsString, IsEmail } from 'class-validator'

export class SubscribeStockNotificationDto {
  @IsString()
  variantId!: string

  @IsEmail({}, { message: 'Nieprawidłowy adres email' })
  email!: string
}
