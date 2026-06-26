import { Test, TestingModule } from '@nestjs/testing'
import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common'
import { OrdersService } from './orders.service'
import { PrismaService } from '../prisma/prisma.service'
import { CouponsService } from '../coupons/coupons.service'
import { SettingsService } from '../settings/settings.service'
import { FakturowniaService } from '../fakturownia/fakturownia.service'
import { MailService } from '../mail/mail.service'

const mockVariant = { id: 'v1', sku: 'SKU-1', price: '100', stock: 5, attributes: {}, productId: 'p1' }
const mockProduct = { id: 'p1', name: 'T-Shirt' }
const mockCartItem = { id: 'ci1', cartId: 'cart1', variantId: 'v1', quantity: 2, variant: { ...mockVariant, product: mockProduct } }
const mockCart = { id: 'cart1', userId: 'u1', sessionId: null, items: [mockCartItem] }
const mockOrder = { id: 'order1', userId: 'u1', status: 'PENDING_PAYMENT', subtotal: 200, discountAmount: 0, total: 200, items: [] }

const mockPrisma = {
  cart: { findFirst: jest.fn(), delete: jest.fn() },
  cartItem: { deleteMany: jest.fn() },
  productVariant: { findUnique: jest.fn(), update: jest.fn() },
  order: { create: jest.fn(), findMany: jest.fn(), findUnique: jest.fn(), update: jest.fn(), count: jest.fn() },
  couponUsage: { create: jest.fn() },
  coupon: { update: jest.fn() },
  user: { findUnique: jest.fn().mockResolvedValue({ firstName: 'Jan' }), update: jest.fn() },
  $transaction: jest.fn(),
}

const mockCouponsService = {
  validate: jest.fn(),
}

const mockSettingsService = {
  getSettings: jest.fn().mockResolvedValue({
    freeShipping: false,
    shippingCourierCost: '14.99',
    shippingLockerCost: '9.99',
    freeShippingThreshold: null,
  }),
}

const mockFakturowniaService = {
  generateInvoice: jest.fn(),
}

const mockMailService = {
  sendGuestOrderAcknowledged: jest.fn(),
  sendOrderConfirmation: jest.fn(),
}

describe('OrdersService', () => {
  let service: OrdersService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: CouponsService, useValue: mockCouponsService },
        { provide: SettingsService, useValue: mockSettingsService },
        { provide: FakturowniaService, useValue: mockFakturowniaService },
        { provide: MailService, useValue: mockMailService },
      ],
    }).compile()
    service = module.get<OrdersService>(OrdersService)
    jest.clearAllMocks()
  })

  describe('create', () => {
    const dto = {
      deliveryMethod: 'COURIER' as const,
      shippingAddress: {
        firstName: 'Jan', lastName: 'Kowalski', email: 'jan@example.com',
        street: 'ul. Kwiatowa 1', city: 'Warszawa', postalCode: '00-001', phone: '123456789',
      },
    }

    it('throws BadRequestException when cart is empty', async () => {
      mockPrisma.cart.findFirst.mockResolvedValue({ ...mockCart, items: [] })
      await expect(service.create('u1', dto)).rejects.toThrow(BadRequestException)
    })

    it('throws BadRequestException when cart not found', async () => {
      mockPrisma.cart.findFirst.mockResolvedValue(null)
      await expect(service.create('u1', dto)).rejects.toThrow(BadRequestException)
    })

    it('throws ConflictException when stock is insufficient', async () => {
      mockPrisma.cart.findFirst.mockResolvedValue(mockCart)
      mockPrisma.$transaction.mockImplementation(async (fn: any) => {
        const tx = {
          productVariant: { updateMany: jest.fn().mockResolvedValue({ count: 0 }) },
          order: { create: jest.fn() },
          couponUsage: { create: jest.fn() },
          coupon: { update: jest.fn() },
          cartItem: { deleteMany: jest.fn() },
          cart: { delete: jest.fn() },
        }
        return fn(tx)
      })
      await expect(service.create('u1', dto)).rejects.toThrow(ConflictException)
    })

    it('creates order and decrements stock', async () => {
      mockPrisma.cart.findFirst.mockResolvedValue(mockCart)
      mockPrisma.$transaction.mockImplementation(async (fn: any) => {
        const tx = {
          productVariant: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
          order: { create: jest.fn().mockResolvedValue(mockOrder) },
          couponUsage: { create: jest.fn() },
          coupon: { update: jest.fn() },
          cartItem: { deleteMany: jest.fn() },
          cart: { delete: jest.fn() },
        }
        const result = await fn(tx)
        expect(tx.productVariant.updateMany).toHaveBeenCalledWith({
          where: { id: 'v1', stock: { gte: 2 } },
          data: { stock: { decrement: 2 } },
        })
        return result
      })
      const result = await service.create('u1', dto)
      expect(result).toEqual(mockOrder)
    })

    it('adds courier shipping cost to the total and persists it', async () => {
      mockPrisma.cart.findFirst.mockResolvedValue(mockCart)
      const createSpy = jest.fn().mockResolvedValue(mockOrder)
      mockPrisma.$transaction.mockImplementation(async (fn: any) => {
        const tx = {
          productVariant: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
          order: { create: createSpy },
          couponUsage: { create: jest.fn() },
          coupon: { update: jest.fn() },
          cartItem: { deleteMany: jest.fn() },
          cart: { delete: jest.fn() },
        }
        return fn(tx)
      })
      await service.create('u1', dto)
      // subtotal 200 (2 × 100), no discount, courier 14.99 → total 214.99
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ shippingCost: 14.99, total: 214.99 }),
        }),
      )
    })

    it('applies coupon discount when couponCode provided', async () => {
      mockPrisma.cart.findFirst.mockResolvedValue(mockCart)
      mockCouponsService.validate.mockResolvedValue({
        coupon: { id: 'c1' },
        discountAmount: 20,
        finalTotal: 180,
      })
      mockPrisma.$transaction.mockImplementation(async (fn: any) => {
        const tx = {
          productVariant: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
          order: { create: jest.fn().mockResolvedValue({ ...mockOrder, discountAmount: 20, total: 180 }) },
          couponUsage: { create: jest.fn() },
          coupon: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
          cartItem: { deleteMany: jest.fn() },
          cart: { delete: jest.fn() },
        }
        return fn(tx)
      })
      await service.create('u1', { ...dto, couponCode: 'SAVE20' })
      expect(mockCouponsService.validate).toHaveBeenCalledWith('SAVE20', 200, 'u1')
    })
  })

  describe('findOne', () => {
    it('throws NotFoundException for unknown order', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(null)
      await expect(service.findOne('bad-id', 'u1')).rejects.toThrow(NotFoundException)
    })

    it('throws ForbiddenException when user does not own order', async () => {
      mockPrisma.order.findUnique.mockResolvedValue({ ...mockOrder, userId: 'other-user', items: [] })
      await expect(service.findOne('order1', 'u1')).rejects.toThrow(ForbiddenException)
    })

    it('returns order for owner', async () => {
      mockPrisma.order.findUnique.mockResolvedValue({ ...mockOrder, items: [], coupon: null })
      const result = await service.findOne('order1', 'u1')
      expect(result.id).toBe('order1')
    })
  })
})
