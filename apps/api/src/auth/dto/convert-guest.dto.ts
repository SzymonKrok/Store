import { IsString, IsNotEmpty, MinLength } from 'class-validator'

export class ConvertGuestDto {
  @IsString()
  @IsNotEmpty()
  orderId!: string

  @IsString()
  @MinLength(8)
  password!: string
}
