import { Injectable, BadRequestException, ConflictException, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateCategoryDto } from './dto/create-category.dto'
import { UpdateCategoryDto } from './dto/update-category.dto'

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.category.findMany({
      include: { parent: { select: { id: true, name: true } } },
      orderBy: [{ parentId: 'asc' }, { name: 'asc' }],
    })
  }

  async create(dto: CreateCategoryDto) {
    const existing = await this.prisma.category.findUnique({ where: { slug: dto.slug } })
    if (existing) throw new ConflictException('Slug already exists')
    return this.prisma.category.create({ data: dto })
  }

  async update(id: string, dto: UpdateCategoryDto) {
    await this.findOneOrThrow(id)
    if (dto.slug) {
      const conflict = await this.prisma.category.findFirst({
        where: { slug: dto.slug, NOT: { id } },
      })
      if (conflict) throw new ConflictException('Slug already exists')
    }
    return this.prisma.category.update({ where: { id }, data: dto })
  }

  async remove(id: string) {
    await this.findOneOrThrow(id)
    const [productCount, childCount] = await this.prisma.$transaction([
      this.prisma.product.count({ where: { categoryId: id } }),
      this.prisma.category.count({ where: { parentId: id } }),
    ])
    if (productCount > 0) throw new BadRequestException('Kategoria zawiera produkty — usuń je przed usunięciem kategorii')
    if (childCount > 0) throw new BadRequestException('Kategoria zawiera podkategorie — usuń je przed usunięciem kategorii')
    await this.prisma.category.delete({ where: { id } })
  }

  private async findOneOrThrow(id: string) {
    const category = await this.prisma.category.findUnique({ where: { id } })
    if (!category) throw new NotFoundException('Category not found')
    return category
  }
}
