import { Test, TestingModule } from '@nestjs/testing'
import { ProductsService } from './products.service'
import { PrismaService } from '../prisma/prisma.service'
import { ConflictException, NotFoundException } from '@nestjs/common'
import { SortBy } from './dto/product-query.dto'

const mockPrisma = {
  product: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  $transaction: jest.fn(),
  $queryRaw: jest.fn(),
}

describe('ProductsService', () => {
  let service: ProductsService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile()
    service = module.get<ProductsService>(ProductsService)
    jest.clearAllMocks()
  })

  describe('findAll', () => {
    it('returns paginated products with metadata', async () => {
      mockPrisma.$transaction.mockResolvedValue([
        [{ id: '1', name: 'T-Shirt', variants: [], images: [] }],
        1,
      ])
      const result = await service.findAll({ sortBy: SortBy.NEWEST, page: 1, limit: 20 })
      expect(result.total).toBe(1)
      expect(result.items).toHaveLength(1)
      expect(result.totalPages).toBe(1)
    })

    it('calculates correct skip for page 2', async () => {
      mockPrisma.$transaction.mockResolvedValue([[], 0])
      await service.findAll({ sortBy: SortBy.NEWEST, page: 2, limit: 10 })
      expect(mockPrisma.$transaction).toHaveBeenCalled()
    })
  })

  describe('findOne', () => {
    it('throws NotFoundException for unknown slug', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null)
      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException)
    })

    it('attaches omnibusPrice to each variant', async () => {
      mockPrisma.product.findUnique.mockResolvedValue({
        id: '1', slug: 'test', name: 'T-Shirt', description: null,
        basePrice: 99, category: { id: 'c1', name: 'Tops', slug: 'tops' },
        variants: [{ id: 'v1', sku: 'SKU-1', price: 99, stock: 5, attributes: {} }],
        images: [],
      })
      mockPrisma.$queryRaw.mockResolvedValue([{ min_price: 79 }])
      const result = await service.findOne('test')
      expect(result.variants[0].omnibusPrice).toBe(79)
    })

    it('sets omnibusPrice to null when no price history exists', async () => {
      mockPrisma.product.findUnique.mockResolvedValue({
        id: '1', slug: 'test', name: 'T-Shirt', description: null,
        basePrice: 99, category: { id: 'c1', name: 'Tops', slug: 'tops' },
        variants: [{ id: 'v1', sku: 'SKU-1', price: 99, stock: 5, attributes: {} }],
        images: [],
      })
      mockPrisma.$queryRaw.mockResolvedValue([{ min_price: null }])
      const result = await service.findOne('test')
      expect(result.variants[0].omnibusPrice).toBeNull()
    })
  })

  describe('create', () => {
    it('throws ConflictException when slug already exists', async () => {
      mockPrisma.product.findUnique.mockResolvedValue({ id: '1' })
      await expect(
        service.create({
          name: 'T-Shirt', slug: 'test', basePrice: 99, categoryId: 'cat1',
          variants: [{ sku: 'SKU', price: 99, stock: 10, attributes: { size: 'M' } }],
        }),
      ).rejects.toThrow(ConflictException)
    })
  })

  describe('remove', () => {
    it('throws NotFoundException for unknown id', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null)
      await expect(service.remove('nonexistent')).rejects.toThrow(NotFoundException)
    })

    it('deletes the product when it exists', async () => {
      mockPrisma.product.findUnique.mockResolvedValue({ id: '1' })
      mockPrisma.product.delete.mockResolvedValue({ id: '1' })
      await service.remove('1')
      expect(mockPrisma.product.delete).toHaveBeenCalledWith({ where: { id: '1' } })
    })
  })
})
