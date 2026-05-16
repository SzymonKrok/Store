import { Controller, Post, Param, Body, UseGuards, HttpCode } from '@nestjs/common'
import { PaymentsService } from './payments.service'
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { P24WebhookPayload } from './strategies/przelewy24.strategy'

interface JwtPayload {
  sub: string
  email: string
  role: string
}

@Controller()
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('orders/:id/pay')
  @UseGuards(OptionalJwtAuthGuard)
  initiatePayment(@Param('id') id: string, @CurrentUser() user: JwtPayload | null) {
    return this.paymentsService.initiatePayment(id, user?.sub)
  }

  @Post('payments/p24/webhook')
  @HttpCode(200)
  async p24Webhook(@Body() payload: P24WebhookPayload) {
    await this.paymentsService.handleP24Webhook(payload)
    return { data: 'OK' }
  }
}
