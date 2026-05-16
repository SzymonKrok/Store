import { IsEnum, IsNumber, IsPositive } from 'class-validator'

export class GenerateLabelDto {
  @IsEnum(['A', 'B', 'C'])
  parcelSize!: 'A' | 'B' | 'C'

  @IsNumber()
  @IsPositive()
  parcelWeight!: number
}
