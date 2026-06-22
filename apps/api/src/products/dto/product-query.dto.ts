import { IsOptional, IsString, IsNumber, IsPositive, IsEnum, IsInt, Min, Max, IsBoolean } from 'class-validator'
import { Type, Transform } from 'class-transformer'

export enum SortBy {
  PRICE_ASC = 'price_asc',
  PRICE_DESC = 'price_desc',
  NEWEST = 'newest',
  BESTSELLER = 'bestseller',
}

export class ProductQueryDto {
  @IsString()
  @IsOptional()
  q?: string

  @IsString()
  @IsOptional()
  categoryId?: string

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @IsOptional()
  minPrice?: number

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @IsOptional()
  maxPrice?: number

  @IsEnum(SortBy)
  @IsOptional()
  sortBy?: SortBy = SortBy.NEWEST

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 20

  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  @IsOptional()
  showArchived?: boolean
}
