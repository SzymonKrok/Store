import { Test, TestingModule } from '@nestjs/testing'
import { BadRequestException, NotFoundException } from '@nestjs/common'
import { CartService } from './cart.service'
import { PrismaService } from '../prisma/prisma.service'

const mockCart = { id: 'cart1', userId: 'u1', sessionId: null, items: [], recoveryEmailSentAt: null, updatedAt: new Date() }
const mockSessionCart = { id: 'cart2', userId: null, sessionId: 'sess1', items: [], recoveryEmailSentAt: null, updatedAt: new Date() }
const mockVariant = { id: 'v1', sku: 'SKU-1', price: 99, stock: 10, attributes: {}, productId: 'p1' }
const mockItem = { id: 'item1', cartId: 'cart1', variantId: 'v1', quantity: 2 }

const mockPrisma = {
  cart: {
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  cartItem: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  productVariant: {
    findUnique: jest.fn(),
  },
  $transaction: jest.fn(),
}

describe('CartService', () => {
  let service: CartService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CartService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile()
    service = module.get<CartService>(CartService)
    jest.clearAllMocks()
  })

  describe('getCart', () => {
    it('throws BadRequestException when neither userId nor sessionId provided', async () => {
      await expect(service.getCart()).rejects.toThrow(BadRequestException)
    })

    it('returns existing cart by userId', async () => {
      mockPrisma.cart.findFirst.mockResolvedValue(mockCart)
      const result = await service.getCart('u1')
      expect(result).toEqual(mockCart)
      expect(mockPrisma.cart.create).not.toHaveBeenCalled()
    })

    it('creates a new cart when none exists for userId', async () => {
      mockPrisma.cart.findFirst.mockResolvedValue(null)
      mockPrisma.cart.create.mockResolvedValue(mockCart)
      await service.getCart('u1')
      expect(mockPrisma.cart.create).toHaveBeenCalledWith(expect.objectContaining({ data: { userId: 'u1' } }))
    })

    it('creates cart with sessionId when no userId provided', async () => {
      mockPrisma.cart.findFirst.mockResolvedValue(null)
      mockPrisma.cart.create.mockResolvedValue(mockSessionCart)
      await service.getCart(undefined, 'sess1')
      expect(mockPrisma.cart.create).toHaveBeenCalledWith(expect.objectContaining({ data: { sessionId: 'sess1' } }))
    })
  })

  describe('addItem', () => {
    it('throws NotFoundException for unknown variant', async () => {
      mockPrisma.cart.findFirst.mockResolvedValue(mockCart)
      mockPrisma.cart.create.mockResolvedValue(mockCart)
      mockPrisma.productVariant.findUnique.mockResolvedValue(null)
      await expect(service.addItem('u1', undefined, 'bad-variant', 1)).rejects.toThrow(NotFoundException)
    })

    it('creates new cart item when variant not in cart', async () => {
      mockPrisma.cart.findFirst.mockResolvedValue(mockCart)
      mockPrisma.productVariant.findUnique.mockResolvedValue(mockVariant)
      mockPrisma.cartItem.findFirst.mockResolvedValue(null)
      mockPrisma.cartItem.create.mockResolvedValue(mockItem)
      mockPrisma.cart.update.mockResolvedValue(mockCart)
      await service.addItem('u1', undefined, 'v1', 2)
      expect(mockPrisma.cartItem.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: { cartId: 'cart1', variantId: 'v1', quantity: 2 } }),
      )
    })

    it('increments quantity when variant already in cart', async () => {
      mockPrisma.cart.findFirst.mockResolvedValue(mockCart)
      mockPrisma.productVariant.findUnique.mockResolvedValue(mockVariant)
      mockPrisma.cartItem.findFirst.mockResolvedValue(mockItem)
      mockPrisma.cartItem.update.mockResolvedValue({ ...mockItem, quantity: 4 })
      mockPrisma.cart.update.mockResolvedValue(mockCart)
      await service.addItem('u1', undefined, 'v1', 2)
      expect(mockPrisma.cartItem.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { quantity: 4 } }),
      )
    })
  })

  describe('updateItem', () => {
    it('throws NotFoundException for unknown item', async () => {
      mockPrisma.cartItem.findUnique.mockResolvedValue(null)
      await expect(service.updateItem('bad-item', 3)).rejects.toThrow(NotFoundException)
    })

    it('updates quantity', async () => {
      mockPrisma.cartItem.findUnique.mockResolvedValue(mockItem)
      mockPrisma.cartItem.update.mockResolvedValue({ ...mockItem, quantity: 3 })
      mockPrisma.cart.findFirst.mockResolvedValue(mockCart)
      await service.updateItem('item1', 3, 'u1')
      expect(mockPrisma.cartItem.update).toHaveBeenCalledWith({ where: { id: 'item1' }, data: { quantity: 3 } })
    })
  })

  describe('removeItem', () => {
    it('throws NotFoundException for unknown item', async () => {
      mockPrisma.cartItem.findUnique.mockResolvedValue(null)
      await expect(service.removeItem('bad-item')).rejects.toThrow(NotFoundException)
    })

    it('deletes item', async () => {
      mockPrisma.cartItem.findUnique.mockResolvedValue(mockItem)
      mockPrisma.cartItem.delete.mockResolvedValue(mockItem)
      mockPrisma.cart.findFirst.mockResolvedValue(mockCart)
      await service.removeItem('item1', 'u1')
      expect(mockPrisma.cartItem.delete).toHaveBeenCalledWith({ where: { id: 'item1' } })
    })
  })

  describe('mergeCarts', () => {
    it('does nothing when session cart is empty', async () => {
      mockPrisma.cart.findFirst
        .mockResolvedValueOnce(mockCart)
        .mockResolvedValueOnce({ ...mockSessionCart, items: [] })
      await service.mergeCarts('u1', 'sess1')
      expect(mockPrisma.$transaction).not.toHaveBeenCalled()
    })

    it('reassigns session cart to user when user has no cart', async () => {
      mockPrisma.cart.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ ...mockSessionCart, items: [mockItem] })
      mockPrisma.cart.update.mockResolvedValue(mockCart)
      await service.mergeCarts('u1', 'sess1')
      expect(mockPrisma.cart.update).toHaveBeenCalledWith({
        where: { id: 'cart2' },
        data: { userId: 'u1', sessionId: null },
      })
    })

    it('merges items when both carts exist', async () => {
      const userCartWithItems = { ...mockCart, items: [mockItem] }
      const sessionCartWithItems = { ...mockSessionCart, items: [{ id: 'item2', cartId: 'cart2', variantId: 'v2', quantity: 1 }] }
      mockPrisma.cart.findFirst
        .mockResolvedValueOnce(userCartWithItems)
        .mockResolvedValueOnce(sessionCartWithItems)
      mockPrisma.$transaction.mockImplementation(async (fn: any) => fn(mockPrisma))
      mockPrisma.cartItem.create.mockResolvedValue({})
      mockPrisma.cart.delete.mockResolvedValue({})
      await service.mergeCarts('u1', 'sess1')
      expect(mockPrisma.$transaction).toHaveBeenCalled()
    })
  })
})
