import { Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { PrismaService } from '../prisma/prisma.service'
import { MailService } from '../mail/mail.service'

@Injectable()
export class AbandonedCartService {
  private readonly logger = new Logger(AbandonedCartService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  @Cron('0 * * * *')
  async handleAbandonedCarts() {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000)

    const carts = await this.prisma.cart.findMany({
      where: {
        userId: { not: null },
        recoveryEmailSentAt: null,
        updatedAt: { lt: twoHoursAgo },
        items: { some: {} },
      },
      include: {
        user: true,
        items: {
          include: {
            variant: { include: { product: true } },
          },
        },
      },
    })

    this.logger.log(`Found ${carts.length} abandoned cart(s) to process`)

    for (const cart of carts) {
      if (!cart.user?.email) continue
      try {
        await this.mail.sendAbandonedCartRecovery(cart.user.email, cart.items)
        await this.prisma.cart.update({
          where: { id: cart.id },
          data: { recoveryEmailSentAt: new Date() },
        })
        this.logger.log(`Recovery email sent to ${cart.user.email}`)
      } catch (err) {
        this.logger.error(`Failed to process abandoned cart for ${cart.user.email}`, err)
      }
    }
  }
}
