import { IsString, IsInt, Min, Max, MinLength, MaxLength } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class CreateReviewDto {
  @ApiProperty()
  @IsString()
  productId!: string

  @ApiProperty()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  authorName!: string

  @ApiProperty({ minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number

  @ApiProperty()
  @IsString()
  @MinLength(5)
  @MaxLength(2000)
  comment!: string
}
