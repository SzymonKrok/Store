import {
  IsString,
  MinLength,
  IsArray,
  ValidateNested,
  ArrayMinSize,
  IsInt,
  Min,
  IsOptional,
  Matches,
} from 'class-validator'
import { Transform, Type } from 'class-transformer'

export class ReturnItemDto {
  @IsString()
  orderItemId!: string

  @IsInt()
  @Min(1, { message: 'Ilość musi wynosić co najmniej 1' })
  quantity!: number
}

export class CreateReturnDto {
  @IsString()
  @MinLength(10, { message: 'Powód zwrotu musi mieć co najmniej 10 znaków' })
  reason!: string

  @IsArray()
  @ArrayMinSize(1, { message: 'Wybierz co najmniej jedną pozycję do zwrotu' })
  @ValidateNested({ each: true })
  @Type(() => ReturnItemDto)
  items!: ReturnItemDto[]

  // IBAN — opcjonalny. Przy płatności Stripe refund wraca na oryginalną metodę,
  // więc numer konta jest potrzebny tylko jako fallback.
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.replace(/\s/g, '').toUpperCase() : value))
  @IsString()
  @Matches(/^[A-Z]{2}[0-9A-Z]{13,30}$/, { message: 'Nieprawidłowy numer IBAN' })
  bankAccount?: string
}
