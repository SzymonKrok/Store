import { Type } from 'class-transformer'
import {
  IsString, IsNumber, IsPositive, IsOptional, IsArray,
  ValidateNested, IsInt, Min, Matches, IsUrl, IsObject, IsBoolean,
} from 'class-validator'

export class CreateVariantDto {
  @IsString()
  sku!: string

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  price!: number

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @IsOptional()
  compareAtPrice?: number | null

  @IsInt()
  @Min(0)
  stock!: number

  @IsObject()
  attributes!: Record<string, string>

  @IsBoolean()
  @IsOptional()
  isActive?: boolean
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

  @IsString()
  @IsOptional()
  attributeValue?: string | null
}

export class CreateProductDto {
  @IsString()
  name!: string

  @IsString()
  @Matches(/^[a-z0-9-]+$/, { message: 'Slug must be lowercase letters, numbers, and hyphens' })
  slug!: string

  @IsString()
  @IsOptional()
  shortDescription?: string | null

  @IsString()
  @IsOptional()
  description?: string

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  keyFeatures?: string[]

  @IsObject()
  @IsOptional()
  specifications?: Record<string, string> | null

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  basePrice!: number

  @IsString()
  categoryId!: string

  @IsString()
  @IsOptional()
  imageAttributeKey?: string | null

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
