import { Test, TestingModule } from '@nestjs/testing'
import { BadRequestException, NotFoundException } from '@nestjs/common'
import { CouponsService } from './coupons.service'
import { PrismaService } from '../prisma/prisma.service'

const mockCoupon = {
  id: 'c1',
  code: 'SAVE10',
  type: 'PERCENTAGE',
  value: '10',
  expiresAt: null,
  minOrderValue: null,
  maxUses: null,
  limitPerUser: null,
  usedCount: 0,
  isActive: true,
  createdAt: new Date(),
}

const mockPrisma = {
  coupon: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  couponUsage: { count: jest.fn() },
  $transaction: jest.fn(),
}

describe('CouponsService', () => {
  let service: CouponsService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CouponsService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile()
    service = module.get<CouponsService>(CouponsService)
    jest.clearAllMocks()
  })

  describe('validate', () => {
    it('throws NotFoundException for unknown coupon', async () => {
      mockPrisma.coupon.findUnique.mockResolvedValue(null)
      await expect(service.validate('BAD', 100)).rejects.toThrow(NotFoundException)
    })

    it('throws NotFoundException for inactive coupon', async () => {
      mockPrisma.coupon.findUnique.mockResolvedValue({ ...mockCoupon, isActive: false })
      await expect(service.validate('SAVE10', 100)).rejects.toThrow(NotFoundException)
    })

    it('throws BadRequestException for expired coupon', async () => {
      mockPrisma.coupon.findUnique.mockResolvedValue({
        ...mockCoupon,
        expiresAt: new Date('2020-01-01'),
      })
      await expect(service.validate('SAVE10', 100)).rejects.toThrow(BadRequestException)
    })

    it('throws BadRequestException when subtotal < minOrderValue', async () => {
      mockPrisma.coupon.findUnique.mockResolvedValue({ ...mockCoupon, minOrderValue: '200' })
      await expect(service.validate('SAVE10', 100)).rejects.toThrow(BadRequestException)
    })

    it('throws BadRequestException when maxUses reached', async () => {
      mockPrisma.coupon.findUnique.mockResolvedValue({ ...mockCoupon, maxUses: 5, usedCount: 5 })
      await expect(service.validate('SAVE10', 100)).rejects.toThrow(BadRequestException)
    })

    it('throws BadRequestException when per-user limit reached', async () => {
      mockPrisma.coupon.findUnique.mockResolvedValue({ ...mockCoupon, limitPerUser: 1 })
      mockPrisma.couponUsage.count.mockResolvedValue(1)
      await expect(service.validate('SAVE10', 100, 'u1')).rejects.toThrow(BadRequestException)
    })

    it('calculates PERCENTAGE discount correctly', async () => {
      mockPrisma.coupon.findUnique.mockResolvedValue({ ...mockCoupon, type: 'PERCENTAGE', value: '10' })
      const result = await service.validate('SAVE10', 200)
      expect(result.discountAmount).toBe(20)
      expect(result.finalTotal).toBe(180)
    })

    it('calculates FLAT discount correctly', async () => {
      mockPrisma.coupon.findUnique.mockResolvedValue({ ...mockCoupon, type: 'FLAT', value: '30' })
      const result = await service.validate('SAVE30', 100)
      expect(result.discountAmount).toBe(30)
      expect(result.finalTotal).toBe(70)
    })

    it('caps FLAT discount at subtotal', async () => {
      mockPrisma.coupon.findUnique.mockResolvedValue({ ...mockCoupon, type: 'FLAT', value: '200' })
      const result = await service.validate('BIG', 50)
      expect(result.discountAmount).toBe(50)
      expect(result.finalTotal).toBe(0)
    })
  })
})
