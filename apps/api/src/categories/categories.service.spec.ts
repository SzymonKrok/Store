import { Test, TestingModule } from '@nestjs/testing'
import { CategoriesService } from './categories.service'
import { PrismaService } from '../prisma/prisma.service'
import { ConflictException, NotFoundException } from '@nestjs/common'

const mockPrisma = {
  category: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}

describe('CategoriesService', () => {
  let service: CategoriesService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile()
    service = module.get<CategoriesService>(CategoriesService)
    jest.clearAllMocks()
  })

  describe('findAll', () => {
    it('returns root categories with nested children', async () => {
      mockPrisma.category.findMany.mockResolvedValue([
        { id: '1', name: 'Tops', slug: 'tops', parentId: null, children: [] },
      ])
      const result = await service.findAll()
      expect(result).toHaveLength(1)
      expect(mockPrisma.category.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { parentId: null } }),
      )
    })
  })

  describe('create', () => {
    it('creates a category when slug is unique', async () => {
      mockPrisma.category.findUnique.mockResolvedValue(null)
      mockPrisma.category.create.mockResolvedValue({ id: '1', name: 'Tops', slug: 'tops', parentId: null })
      const result = await service.create({ name: 'Tops', slug: 'tops' })
      expect(result.slug).toBe('tops')
    })

    it('throws ConflictException when slug already exists', async () => {
      mockPrisma.category.findUnique.mockResolvedValue({ id: '1' })
      await expect(service.create({ name: 'Tops', slug: 'tops' })).rejects.toThrow(ConflictException)
    })
  })

  describe('update', () => {
    it('throws NotFoundException when category does not exist', async () => {
      mockPrisma.category.findUnique.mockResolvedValue(null)
      await expect(service.update('nonexistent', { name: 'New' })).rejects.toThrow(NotFoundException)
    })

    it('throws ConflictException when new slug is taken by another category', async () => {
      mockPrisma.category.findUnique.mockResolvedValue({ id: '1', name: 'Old', slug: 'old' })
      mockPrisma.category.findFirst.mockResolvedValue({ id: '2' })
      await expect(service.update('1', { slug: 'taken' })).rejects.toThrow(ConflictException)
    })
  })

  describe('remove', () => {
    it('throws NotFoundException when category does not exist', async () => {
      mockPrisma.category.findUnique.mockResolvedValue(null)
      await expect(service.remove('nonexistent')).rejects.toThrow(NotFoundException)
    })

    it('deletes category when it exists', async () => {
      mockPrisma.category.findUnique.mockResolvedValue({ id: '1' })
      mockPrisma.category.delete.mockResolvedValue({ id: '1' })
      await service.remove('1')
      expect(mockPrisma.category.delete).toHaveBeenCalledWith({ where: { id: '1' } })
    })
  })
})
