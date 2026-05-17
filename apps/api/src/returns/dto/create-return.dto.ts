import { IsString, MinLength, Matches } from 'class-validator'
import { Transform } from 'class-transformer'

export class CreateReturnDto {
  @IsString()
  @MinLength(10, { message: 'Powód zwrotu musi mieć co najmniej 10 znaków' })
  reason!: string

  @Transform(({ value }) => (typeof value === 'string' ? value.replace(/\s/g, '').toUpperCase() : value))
  @IsString()
  @Matches(/^[A-Z]{2}[0-9A-Z]{13,30}$/, { message: 'Nieprawidłowy numer IBAN' })
  bankAccount!: string
}
