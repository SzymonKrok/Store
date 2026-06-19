import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { MailService } from '../mail/mail.service'

@Injectable()
export class StockNotificationsService {
  private readonly logger = new Logger(StockNotificationsService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  async subscribe(variantId: string, email: string) {
    const variant = await this.prisma.productVariant.findUnique({
      where: { id: variantId },
      select: { id: true, isActive: true, stock: true },
    })
    if (!variant || !variant.isActive) throw new NotFoundException('Wariant produktu nie istnieje')
    if (variant.stock > 0) {
      throw new BadRequestException('Produkt jest dostępny — możesz dodać go do koszyka')
    }

    // Upsert: if the same email already subscribed, reset notifiedAt so they're notified again next restock
    await this.prisma.stockNotification.upsert({
      where: { variantId_email: { variantId, email } },
      create: { variantId, email },
      update: { notifiedAt: null, createdAt: new Date() },
    })
    return { ok: true }
  }

  /**
   * Fires after a variant transitions from 0 → >0 stock. Sends one email per
   * unnotified subscriber and marks them notified so they don't get a second
   * blast on the next restock.
   *
   * Fire-and-forget — caller should not await. Failures are logged, never thrown.
   */
  async notifyOnRestock(variantId: string): Promise<void> {
    try {
      const subs = await this.prisma.stockNotification.findMany({
        where: { variantId, notifiedAt: null },
        select: { id: true, email: true },
      })
      if (subs.length === 0) return

      const variant = await this.prisma.productVariant.findUnique({
        where: { id: variantId },
        select: {
          attributes: true,
          product: { select: { name: true, slug: true } },
        },
      })
      if (!variant) return

      const attrs = (variant.attributes ?? {}) as Record<string, string>
      const variantLabel = Object.entries(attrs)
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ') || null

      const now = new Date()
      for (const sub of subs) {
        await this.mail.sendBackInStock(sub.email, variant.product.name, variant.product.slug, variantLabel)
      }

      await this.prisma.stockNotification.updateMany({
        where: { id: { in: subs.map((s) => s.id) } },
        data: { notifiedAt: now },
      })
      this.logger.log(`Sent ${subs.length} back-in-stock notification(s) for variant ${variantId}`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      this.logger.warn(`notifyOnRestock failed for variant ${variantId}: ${msg}`)
    }
  }
}
