import { IsString, IsNumber, IsPositive } from 'class-validator'

export class ValidateCouponDto {
  @IsString()
  code!: string

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  subtotal!: number
}
