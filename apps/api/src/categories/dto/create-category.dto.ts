import { IsString, IsOptional, IsUrl, Matches, MaxLength, MinLength } from 'class-validator'

export class CreateCategoryDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string

  @IsString()
  @Matches(/^[a-z0-9-]+$/, { message: 'Slug must be lowercase letters, numbers, and hyphens' })
  @MaxLength(100)
  slug!: string

  @IsString()
  @IsOptional()
  parentId?: string

  @IsUrl()
  @IsOptional()
  imageUrl?: string
}
