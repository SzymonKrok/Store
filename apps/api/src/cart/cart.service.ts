import { Injectable, BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

const cartInclude = {
  items: {
    include: {
      variant: {
        include: {
          product: {
            include: { images: { take: 1, orderBy: { position: 'asc' as const } } },
          },
        },
      },
    },
  },
} as const

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  async getCart(userId?: string, sessionId?: string) {
    if (!userId && !sessionId) throw new BadRequestException('userId or sessionId required')

    const where = userId ? { userId } : { sessionId }
    const existing = await this.prisma.cart.findFirst({ where, include: cartInclude })
    if (existing) return existing

    return this.prisma.cart.create({
      data: userId ? { userId } : { sessionId },
      include: cartInclude,
    })
  }

  async addItem(userId: string | undefined, sessionId: string | undefined, variantId: string, quantity: number) {
    const cart = await this.getCart(userId, sessionId)

    const variant = await this.prisma.productVariant.findUnique({ where: { id: variantId } })
    if (!variant) throw new NotFoundException('Variant not found')

    const existing = await this.prisma.cartItem.findFirst({ where: { cartId: cart.id, variantId } })
    const currentInCart = existing?.quantity ?? 0
    if (variant.stock < currentInCart + quantity) {
      throw new ConflictException(`Niewystarczający stan magazynowy (dostępne: ${variant.stock} szt.)`)
    }

    if (existing) {
      await this.prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + quantity },
      })
    } else {
      await this.prisma.cartItem.create({ data: { cartId: cart.id, variantId, quantity } })
    }

    await this.prisma.cart.update({ where: { id: cart.id }, data: { recoveryEmailSentAt: null } })
    return this.getCart(userId, sessionId)
  }

  async updateItem(itemId: string, quantity: number, userId?: string, sessionId?: string) {
    const item = await this.prisma.cartItem.findUnique({ where: { id: itemId }, include: { cart: true } })
    if (!item) throw new NotFoundException('Cart item not found')
    const owns = userId ? item.cart.userId === userId : item.cart.sessionId === sessionId
    if (!owns) throw new ForbiddenException('Not your cart item')

    await this.prisma.cartItem.update({ where: { id: itemId }, data: { quantity } })
    return this.getCart(userId, sessionId)
  }

  async removeItem(itemId: string, userId?: string, sessionId?: string) {
    const item = await this.prisma.cartItem.findUnique({ where: { id: itemId }, include: { cart: true } })
    if (!item) throw new NotFoundException('Cart item not found')
    const owns = userId ? item.cart.userId === userId : item.cart.sessionId === sessionId
    if (!owns) throw new ForbiddenException('Not your cart item')

    await this.prisma.cartItem.delete({ where: { id: itemId } })
    return this.getCart(userId, sessionId)
  }

  async mergeCarts(userId: string, sessionId: string) {
    const [userCart, sessionCart] = await Promise.all([
      this.prisma.cart.findFirst({ where: { userId }, include: { items: true } }),
      this.prisma.cart.findFirst({ where: { sessionId }, include: { items: true } }),
    ])

    if (!sessionCart || sessionCart.items.length === 0) return

    if (!userCart) {
      await this.prisma.cart.update({
        where: { id: sessionCart.id },
        data: { userId, sessionId: null },
      })
      return
    }

    await this.prisma.$transaction(async (tx) => {
      for (const sessionItem of sessionCart.items) {
        const existing = userCart.items.find((i) => i.variantId === sessionItem.variantId)
        if (existing) {
          await tx.cartItem.update({
            where: { id: existing.id },
            data: { quantity: existing.quantity + sessionItem.quantity },
          })
        } else {
          await tx.cartItem.create({
            data: { cartId: userCart.id, variantId: sessionItem.variantId, quantity: sessionItem.quantity },
          })
        }
      }
      await tx.cart.delete({ where: { id: sessionCart.id } })
    })
  }
}
