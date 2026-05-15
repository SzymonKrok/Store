import { Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { ConfigService } from '@nestjs/config'
import { Resend } from 'resend'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class AbandonedCartService {
  private readonly logger = new Logger(AbandonedCartService.name)
  private readonly resend: Resend

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    this.resend = new Resend(this.config.get<string>('RESEND_API_KEY'))
  }

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
        await this.sendRecoveryEmail(cart.user.email, cart.items)
        await this.prisma.cart.update({
          where: { id: cart.id },
          data: { recoveryEmailSentAt: new Date() },
        })
        this.logger.log(`Recovery email sent to ${cart.user.email}`)
      } catch (err) {
        this.logger.error(`Failed to send recovery email to ${cart.user.email}`, err)
      }
    }
  }

  private async sendRecoveryEmail(
    email: string,
    items: Array<{ quantity: number; variant: { product: { name: string } } }>,
  ) {
    const storefrontUrl = this.config.get<string>('STOREFRONT_URL') ?? 'http://localhost:3000'
    const itemsList = items
      .map((i) => `<li>${i.variant.product.name} &times; ${i.quantity}</li>`)
      .join('')

    await this.resend.emails.send({
      from: 'Store <noreply@store.pl>',
      to: email,
      subject: 'Zapomniałeś o swoim koszyku!',
      html: `
        <p>Hej!</p>
        <p>Zostawiłeś coś w swoim koszyku:</p>
        <ul>${itemsList}</ul>
        <p>
          <a href="${storefrontUrl}/sklep" style="background:#1C1917;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-family:sans-serif;">
            Wróć do sklepu
          </a>
        </p>
      `,
    })
  }
}
