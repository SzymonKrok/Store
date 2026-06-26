import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PrismaService } from '../prisma/prisma.service'
import { MailService } from '../mail/mail.service'
import { StripeStrategy } from '../payments/strategies/stripe.strategy'
import { CreateReturnDto } from './dto/create-return.dto'
import { UpdateReturnStatusDto } from './dto/update-return-status.dto'
import { ReturnStatus } from '@prisma/client'

const RETURN_WINDOW_DAYS = 14
const RETURNABLE_ORDER_STATUSES = ['SHIPPED', 'DELIVERED'] as const

@Injectable()
export class ReturnsService {
  private readonly logger = new Logger(ReturnsService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    private readonly stripe: StripeStrategy,
    private readonly config: ConfigService,
  ) {}

  async createReturn(orderId: string, dto: CreateReturnDto, userId?: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        returnRequest: true,
        user: { select: { email: true } },
      },
    })

    if (!order) throw new NotFoundException('Zamówienie nie zostało znalezione')

    if (order.userId) {
      // user-owned order — require matching authenticated caller
      if (!userId || order.userId !== userId) throw new ForbiddenException('Brak dostępu do tego zamówienia')
    }
    // guest order (order.userId === null) — allow access via CUID (unguessable)

    if (!(RETURNABLE_ORDER_STATUSES as readonly string[]).includes(order.status)) {
      throw new BadRequestException(
        'Zwrot możliwy tylko dla zamówień w statusie Wysłane lub Dostarczone',
      )
    }

    const windowCutoff = new Date()
    windowCutoff.setDate(windowCutoff.getDate() - RETURN_WINDOW_DAYS)
    if (order.updatedAt < windowCutoff) {
      throw new BadRequestException('Czas na zwrot minął')
    }

    if (order.returnRequest) {
      throw new ConflictException('Wniosek zwrotu dla tego zamówienia już istnieje')
    }

    // Walidacja pozycji: każda musi należeć do zamówienia, ilość 1..zamówiona.
    const itemsById = new Map(order.items.map((i) => [i.id, i]))
    for (const reqItem of dto.items) {
      const orderItem = itemsById.get(reqItem.orderItemId)
      if (!orderItem) {
        throw new BadRequestException('Wybrana pozycja nie należy do tego zamówienia')
      }
      if (reqItem.quantity > orderItem.quantity) {
        throw new BadRequestException(
          `Nie można zwrócić ${reqItem.quantity} szt. „${orderItem.productName}" — zamówiono ${orderItem.quantity}`,
        )
      }
    }

    const returnRequest = await this.prisma.returnRequest.create({
      data: {
        orderId,
        reason: dto.reason,
        bankAccount: dto.bankAccount ?? null,
        items: {
          create: dto.items.map((i) => ({
            orderItemId: i.orderItemId,
            quantity: i.quantity,
          })),
        },
      },
      include: { items: { include: { orderItem: true } } },
    })

    const customerEmail = order.user?.email ?? order.guestEmail
    if (customerEmail) {
      void this.mail
        .sendReturnRequestConfirmation(customerEmail, orderId, dto.reason)
        .catch((err: unknown) => {
          this.logger.error(`Failed to send return confirmation to ${customerEmail}: ${this.errMsg(err)}`)
        })
    }

    // Powiadomienie dla sklepu (Sylwia) o nowym wniosku.
    const adminEmail = this.config.get<string>('STORE_EMAIL')
    if (adminEmail) {
      const itemLines = returnRequest.items.map((ri) => ({
        name: ri.orderItem.productName,
        sku: ri.orderItem.variantSku,
        quantity: ri.quantity,
      }))
      void this.mail
        .sendReturnRequestAdminNotification(adminEmail, orderId, dto.reason, itemLines, customerEmail ?? '—')
        .catch((err: unknown) => {
          this.logger.error(`Failed to send admin return notification: ${this.errMsg(err)}`)
        })
    }

    return returnRequest
  }

  async findAll(page = 1, limit = 20, status?: ReturnStatus) {
    const skip = (page - 1) * limit
    const where = status ? { status } : {}
    const [items, total] = await this.prisma.$transaction([
      this.prisma.returnRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          items: { include: { orderItem: true } },
          order: {
            select: {
              id: true,
              total: true,
              status: true,
              user: { select: { email: true } },
              guestEmail: true,
            },
          },
        },
      }),
      this.prisma.returnRequest.count({ where }),
    ])
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  async updateStatus(id: string, dto: UpdateReturnStatusDto) {
    const returnRequest = await this.prisma.returnRequest.findUnique({
      where: { id },
      include: {
        order: { include: { user: { select: { email: true } } } },
        items: { include: { orderItem: true } },
      },
    })

    if (!returnRequest) throw new NotFoundException('Wniosek zwrotu nie istnieje')

    const order = returnRequest.order
    const customerEmail = order.user?.email ?? order.guestEmail

    if (dto.status === ReturnStatus.RETURN_APPROVED) {
      const updated = await this.prisma.returnRequest.update({
        where: { id },
        data: { status: ReturnStatus.RETURN_APPROVED },
      })
      if (customerEmail) {
        void this.mail
          .sendReturnApproved(customerEmail, order.id)
          .catch((err: unknown) => this.logger.error(`Return-approved email failed: ${this.errMsg(err)}`))
      }
      return updated
    }

    if (dto.status === ReturnStatus.REFUNDED) {
      if (returnRequest.status === ReturnStatus.REFUNDED) {
        throw new ConflictException('Środki dla tego wniosku zostały już zwrócone')
      }

      // Kwota zwrotu = wartość zwracanych pozycji, skorygowana o proporcję rabatu,
      // by nigdy nie oddać więcej niż klient faktycznie zapłacił.
      const subtotal = Number(order.subtotal)
      const total = Number(order.total)
      const factor = subtotal > 0 ? total / subtotal : 1
      const grossItems = returnRequest.items.reduce(
        (sum, ri) => sum + Number(ri.orderItem.priceAtPurchase) * ri.quantity,
        0,
      )
      const refundAmount = Math.round(grossItems * factor * 100) / 100

      // Realizacja refundu w Stripe na oryginalną metodę płatności.
      let stripeRefundId: string | null = null
      try {
        let paymentIntentId = order.stripePaymentIntentId
        if (!paymentIntentId && order.stripeSessionId) {
          paymentIntentId = await this.stripe.getPaymentIntentId(order.stripeSessionId)
        }
        if (paymentIntentId) {
          const refund = await this.stripe.refund(paymentIntentId, Math.round(refundAmount * 100))
          stripeRefundId = refund.id
          this.logger.log(`Stripe refund ${refund.id} — ${refundAmount} zł for return ${id}`)
        } else {
          this.logger.warn(
            `Return ${id}: brak PaymentIntent — refund Stripe pominięty, wymagany ręczny przelew (${refundAmount} zł)`,
          )
        }
      } catch (err: unknown) {
        throw new BadRequestException(`Refund Stripe nie powiódł się: ${this.errMsg(err)}`)
      }

      // Czy zwracane są wszystkie pozycje w pełnej ilości?
      const returnedByItem = new Map<string, number>()
      for (const ri of returnRequest.items) {
        returnedByItem.set(ri.orderItemId, (returnedByItem.get(ri.orderItemId) ?? 0) + ri.quantity)
      }
      const orderItems = await this.prisma.orderItem.findMany({ where: { orderId: order.id } })
      const fullyReturned = orderItems.every(
        (oi) => (returnedByItem.get(oi.id) ?? 0) >= oi.quantity,
      )

      const updated = await this.prisma.$transaction(async (tx) => {
        // Przywracamy stan magazynowy tylko dla zwracanych pozycji.
        for (const ri of returnRequest.items) {
          const result = await tx.productVariant.updateMany({
            where: { id: ri.orderItem.variantId },
            data: { stock: { increment: ri.quantity } },
          })
          if (result.count === 0) {
            this.logger.warn(`restoreStock: variant ${ri.orderItem.variantId} not found — skipping`)
          }
        }

        if (fullyReturned) {
          await tx.order.update({ where: { id: order.id }, data: { status: 'REFUNDED' } })
        }

        return tx.returnRequest.update({
          where: { id },
          data: { status: ReturnStatus.REFUNDED, refundedAmount: refundAmount, stripeRefundId },
        })
      })

      if (customerEmail) {
        void this.mail
          .sendReturnRefunded(customerEmail, order.id, refundAmount)
          .catch((err: unknown) => this.logger.error(`Return-refunded email failed: ${this.errMsg(err)}`))
      }

      return updated
    }

    // Powrót do statusu „Złożony" lub inne — tylko zmiana statusu.
    return this.prisma.returnRequest.update({
      where: { id },
      data: { status: dto.status },
    })
  }

  private errMsg(err: unknown): string {
    return err instanceof Error ? err.message : String(err)
  }
}
