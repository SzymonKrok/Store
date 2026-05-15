import { Type } from 'class-transformer'
import {
  IsString, IsNumber, IsPositive, IsOptional, IsArray,
  ValidateNested, IsInt, Min, Matches, IsUrl,
} from 'class-validator'

export class CreateVariantDto {
  @IsString()
  sku!: string

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  price!: number

  @IsInt()
  @Min(0)
  stock!: number

  attributes!: Record<string, string>
}

export class CreateProductImageDto {
  @IsUrl()
  url!: string

  @IsString()
  @IsOptional()
  altText?: string

  @IsInt()
  @Min(0)
  @IsOptional()
  position?: number
}

export class CreateProductDto {
  @IsString()
  name!: string

  @IsString()
  @Matches(/^[a-z0-9-]+$/, { message: 'Slug must be lowercase letters, numbers, and hyphens' })
  slug!: string

  @IsString()
  @IsOptional()
  description?: string

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  basePrice!: number

  @IsString()
  categoryId!: string

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateVariantDto)
  variants!: CreateVariantDto[]

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProductImageDto)
  @IsOptional()
  images?: CreateProductImageDto[]
}
