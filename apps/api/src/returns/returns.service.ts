import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { OrdersService } from '../orders/orders.service'
import { MailService } from '../mail/mail.service'
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
    private readonly ordersService: OrdersService,
    private readonly mail: MailService,
  ) {}

  async createReturn(orderId: string, dto: CreateReturnDto, userId?: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
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

    const returnRequest = await this.prisma.returnRequest.create({
      data: { orderId, reason: dto.reason, bankAccount: dto.bankAccount },
    })

    const customerEmail = order.user?.email ?? order.guestEmail
    if (customerEmail) {
      void this.mail.sendReturnRequestConfirmation(customerEmail, orderId, dto.reason)
        .catch((err: unknown) => {
          this.logger.error(`Failed to send return confirmation to ${customerEmail}: ${err instanceof Error ? err.message : String(err)}`)
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
      include: { order: true },
    })

    if (!returnRequest) throw new NotFoundException('Wniosek zwrotu nie istnieje')

    if (dto.status === ReturnStatus.REFUNDED) {
      if (returnRequest.order.status === 'REFUNDED') {
        throw new ConflictException('Środki zostały już zwrócone — stan magazynu nie zostanie zmieniony ponownie')
      }

      return this.prisma.$transaction(async (tx) => {
        await this.ordersService.restoreStock(returnRequest.orderId, tx)
        await tx.order.update({
          where: { id: returnRequest.orderId },
          data: { status: 'REFUNDED' },
        })
        return tx.returnRequest.update({
          where: { id },
          data: { status: ReturnStatus.REFUNDED },
        })
      })
    }

    return this.prisma.returnRequest.update({
      where: { id },
      data: { status: dto.status },
    })
  }
}
